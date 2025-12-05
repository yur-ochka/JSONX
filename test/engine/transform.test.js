import {
  createTransformer,
  compileTemplate,
  transformDirect,
} from "../../src/index.js";

describe("JSONX Transformation Engine", () => {
  describe("Basic Transformations", () => {
    test("full transform flow", async () => {
      const template = {
        templates: [
          {
            name: "userItem",
            output: {
              id: "$.id",
              fullName: { expr: "concat($.firstName, ' ', $.lastName)" },
            },
          },
        ],
        root: {
          user: { apply: "userItem", from: "$.user" },
        },
      };

      const input = {
        user: { id: 1, firstName: "Alice", lastName: "Smith" },
      };

      const tr = createTransformer();
      const result = await tr.transform(input, compileTemplate(template));

      expect(result).toEqual({
        user: {
          id: 1,
          fullName: "Alice Smith",
        },
      });
    });

    test("array transformation", async () => {
      const template = {
        templates: [
          {
            name: "item",
            output: {
              id: "$.id",
              name: { expr: "uppercase($.name)" },
            },
          },
        ],
        root: {
          items: { apply: "item", from: "$.items" },
        },
      };

      const input = {
        items: [
          { id: 1, name: "apple" },
          { id: 2, name: "banana" },
        ],
      };

      const tr = createTransformer();
      const result = await tr.transform(input, compileTemplate(template));

      expect(result).toEqual({
        items: [
          { id: 1, name: "APPLE" },
          { id: 2, name: "BANANA" },
        ],
      });
    });

    test("pipe expressions", async () => {
      const template = {
        templates: [
          {
            name: "product",
            output: {
              slug: { expr: "$.name | lowercase | trim" },
            },
          },
        ],
        root: {
          product: { apply: "product", from: "$.product" },
        },
      };

      const input = {
        product: { name: "  RED SHIRT  " },
      };

      const tr = createTransformer();
      const result = await tr.transform(input, compileTemplate(template));

      expect(result).toEqual({
        product: {
          slug: "red shirt",
        },
      });
    });

    test("nested object transformation", async () => {
      const template = {
        templates: [
          {
            name: "address",
            output: {
              street: "$.street",
              city: { expr: "uppercase($.city)" },
            },
          },
          {
            name: "user",
            output: {
              name: "$.name",
              address: { apply: "address", from: "$.address" },
            },
          },
        ],
        root: {
          user: { apply: "user", from: "$.user" },
        },
      };

      const input = {
        user: {
          name: "John",
          address: {
            street: "Main St",
            city: "kyiv",
          },
        },
      };

      const tr = createTransformer();
      const result = await tr.transform(input, compileTemplate(template));

      expect(result).toEqual({
        user: {
          name: "John",
          address: {
            street: "Main St",
            city: "KYIV",
          },
        },
      });
    });
  });

  describe("Error Handling and Edge Cases", () => {
    test("missing fields in permissive mode", async () => {
      const template = {
        templates: [
          {
            name: "person",
            output: {
              name: "$.name",
              missing: "$.nonexistent",
            },
          },
        ],
        root: {
          person: { apply: "person", from: "$.person" },
        },
      };

      const input = {
        person: { name: "Alice" },
      };

      const tr = createTransformer();
      const result = await tr.transform(input, compileTemplate(template), {
        mode: "permissive",
      });

      expect(result).toEqual({
        person: {
          name: "Alice",
          missing: undefined,
        },
      });
    });

    test("missing fields in strict mode throws error", async () => {
      const template = {
        templates: [
          {
            name: "person",
            output: {
              name: "$.nonexistent",
            },
          },
        ],
        root: {
          person: { apply: "person", from: "$.person" },
        },
      };

      const input = {
        person: { id: 1 },
      };

      const tr = createTransformer();

      await expect(
        tr.transform(input, compileTemplate(template), { mode: "strict" })
      ).rejects.toThrow();
    });

    test("empty array transformation", async () => {
      const template = {
        templates: [
          {
            name: "item",
            output: {
              id: "$.id",
            },
          },
        ],
        root: {
          items: { apply: "item", from: "$.items" },
        },
      };

      const input = {
        items: [],
      };

      const tr = createTransformer();
      const result = await tr.transform(input, compileTemplate(template));

      expect(result).toEqual({
        items: [],
      });
    });

    test("null input handling", async () => {
      const template = {
        templates: [
          {
            name: "item",
            output: {
              value: { expr: "default($.value, 'missing')" },
            },
          },
        ],
        root: {
          item: { apply: "item", from: "$.item" },
        },
      };

      const input = {
        item: { value: null },
      };

      const tr = createTransformer();
      const result = await tr.transform(input, compileTemplate(template));

      expect(result).toEqual({
        item: {
          value: "missing",
        },
      });
    });
  });

  describe("Complex Expressions", () => {
    test("math expressions", async () => {
      const template = {
        templates: [
          {
            name: "calc",
            output: {
              sum: { expr: "add($.a, $.b)" },
              product: { expr: "multiply($.a, $.b)" },
              rounded: { expr: "round(divide($.a, $.b), 2)" },
            },
          },
        ],
        root: {
          result: { apply: "calc", from: "$.calc" },
        },
      };

      const input = {
        calc: { a: 10, b: 3 },
      };

      const tr = createTransformer();
      const result = await tr.transform(input, compileTemplate(template));

      expect(result).toEqual({
        result: {
          sum: 13,
          product: 30,
          rounded: 3.33,
        },
      });
    });

    test("complex pipe with multiple functions", async () => {
      const template = {
        templates: [
          {
            name: "processor",
            output: {
              result: { expr: "$.text | trim | uppercase | substring(0, 5)" },
            },
          },
        ],
        root: {
          processed: { apply: "processor", from: "$.data" },
        },
      };

      const input = {
        data: { text: "  hello world  " },
      };

      const tr = createTransformer();
      const result = await tr.transform(input, compileTemplate(template));

      expect(result).toEqual({
        processed: {
          result: "HELLO",
        },
      });
    });

    test("nested function calls", async () => {
      const template = {
        templates: [
          {
            name: "formatter",
            output: {
              result: {
                expr: "concat(uppercase($.first), ' ', lowercase($.last))",
              },
            },
          },
        ],
        root: {
          formatted: { apply: "formatter", from: "$.name" },
        },
      };

      const input = {
        name: { first: "john", last: "DOE" },
      };

      const tr = createTransformer();
      const result = await tr.transform(input, compileTemplate(template));

      expect(result).toEqual({
        formatted: {
          result: "JOHN doe",
        },
      });
    });
  });

  describe("Direct Transform Function", () => {
    test("transformDirect works without transformer instance", async () => {
      const template = {
        templates: [
          {
            name: "user",
            output: {
              name: { expr: "uppercase($.name)" },
            },
          },
        ],
        root: {
          user: { apply: "user", from: "$.user" },
        },
      };

      const input = {
        user: { name: "alice" },
      };

      const result = await transformDirect(input, template);

      expect(result).toEqual({
        user: {
          name: "ALICE",
        },
      });
    });
  });
});
