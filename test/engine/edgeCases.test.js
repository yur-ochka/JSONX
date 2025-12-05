import { createTransformer, compileTemplate } from "../../src/index.js";

describe("Edge Cases and Error Tests", () => {
  describe("Invalid Templates", () => {
    test("invalid template spec throws error", () => {
      expect(() => compileTemplate({})).toThrow();
      expect(() => compileTemplate(null)).toThrow();
      expect(() => compileTemplate("not an object")).toThrow();
    });

    test("template without required fields", () => {
      expect(() => compileTemplate({ templates: [] })).toThrow(); // No root
      expect(() => compileTemplate({ root: {} })).toThrow(); // No templates
    });
  });

  describe("Selector Edge Cases", () => {
    test("selector with non-existent path returns null", async () => {
      const template = {
        templates: [
          {
            name: "test",
            output: {
              a: "$.nonexistent",
              b: "$.deep.nonexistent.property",
            },
          },
        ],
        root: {
          result: { apply: "test", from: "$.data" },
        },
      };

      const input = {
        data: { existing: "value" },
      };

      const tr = createTransformer();
      const result = await tr.transform(input, compileTemplate(template), {
        mode: "permissive",
      });

      expect(result).toEqual({
        result: {
          a: undefined,
          b: undefined,
        },
      });
    });

    test("array index out of bounds", async () => {
      const template = {
        templates: [
          {
            name: "test",
            output: {
              value: "$.items[10]", // Out of bounds
            },
          },
        ],
        root: {
          result: { apply: "test", from: "$.data" },
        },
      };

      const input = {
        data: { items: [1, 2, 3] },
      };

      const tr = createTransformer();
      const result = await tr.transform(input, compileTemplate(template), {
        mode: "permissive",
      });

      expect(result).toEqual({
        result: {
          value: undefined,
        },
      });
    });

    test("wildcard on non-array", async () => {
      const template = {
        templates: [
          {
            name: "test",
            output: {
              values: "$.object[*]", // object is not array
            },
          },
        ],
        root: {
          result: { apply: "test", from: "$.data" },
        },
      };

      const input = {
        data: { object: { a: 1, b: 2 } },
      };

      const tr = createTransformer();
      const result = await tr.transform(input, compileTemplate(template), {
        mode: "permissive",
      });

      expect(result).toEqual({
        result: {
          values: undefined,
        },
      });
    });
  });

  describe("Expression Edge Cases", () => {
    test("unknown function in expression", async () => {
      const template = {
        templates: [
          {
            name: "test",
            output: {
              value: { expr: "unknownFunction($.value)" },
            },
          },
        ],
        root: {
          result: { apply: "test", from: "$.data" },
        },
      };

      const input = {
        data: { value: 5 },
      };

      const tr = createTransformer();

      // Should fail in strict mode
      await expect(
        tr.transform(input, compileTemplate(template), { mode: "strict" })
      ).rejects.toThrow(/Unknown function/);

      // Should return null in permissive mode
      const result = await tr.transform(input, compileTemplate(template), {
        mode: "permissive",
      });
      expect(result).toEqual({
        result: {
          value: null,
        },
      });
    });

    test("division by zero", async () => {
      const template = {
        templates: [
          {
            name: "test",
            output: {
              value: { expr: "divide($.a, $.b)" },
            },
          },
        ],
        root: {
          result: { apply: "test", from: "$.data" },
        },
      };

      const input = {
        data: { a: 10, b: 0 },
      };

      const tr = createTransformer();
      const result = await tr.transform(input, compileTemplate(template), {
        mode: "permissive",
      });

      // In JavaScript, division by zero gives Infinity
      expect(result.result.value).toBe(Infinity);
    });
  });

  describe("Complex Data Structures", () => {
    test("transform with deeply nested objects", async () => {
      const template = {
        templates: [
          {
            name: "deep",
            output: {
              value: "$.level1.level2.level3.value",
            },
          },
        ],
        root: {
          result: { apply: "deep", from: "$.data" },
        },
      };

      const input = {
        data: {
          level1: {
            level2: {
              level3: {
                value: "found",
              },
            },
          },
        },
      };

      const tr = createTransformer();
      const result = await tr.transform(input, compileTemplate(template));

      expect(result).toEqual({
        result: {
          value: "found",
        },
      });
    });

    test("transform with mixed array and object", async () => {
      const template = {
        templates: [
          {
            name: "item",
            output: {
              name: "$.name",
              tags: "$.tags[*]",
            },
          },
        ],
        root: {
          items: { apply: "item", from: "$.items" },
        },
      };

      const input = {
        items: [
          {
            name: "Product 1",
            tags: ["new", "sale"],
          },
          {
            name: "Product 2",
            tags: ["featured"],
          },
        ],
      };

      const tr = createTransformer();
      const result = await tr.transform(input, compileTemplate(template));

      expect(result).toEqual({
        items: [
          {
            name: "Product 1",
            tags: ["new", "sale"],
          },
          {
            name: "Product 2",
            tags: ["featured"],
          },
        ],
      });
    });

    test("circular reference handling", async () => {
      const template = {
        templates: [
          {
            name: "node",
            output: {
              id: "$.id",
              // Don't try to output circular reference
              name: "$.name",
            },
          },
        ],
        root: {
          node: { apply: "node", from: "$.node" },
        },
      };

      // Create object with circular reference
      const circularObject = { id: 1, name: "Test" };
      circularObject.self = circularObject;

      const input = {
        node: circularObject,
      };

      const tr = createTransformer();

      // Should not crash
      const result = await tr.transform(input, compileTemplate(template), {
        mode: "permissive",
      });

      expect(result).toEqual({
        node: {
          id: 1,
          name: "Test",
        },
      });
    });
  });

  describe("Performance Considerations", () => {
    test("handles large arrays efficiently", async () => {
      const template = {
        templates: [
          {
            name: "item",
            output: {
              id: "$.id",
              squared: { expr: "multiply($.value, $.value)" },
            },
          },
        ],
        root: {
          items: { apply: "item", from: "$.items" },
        },
      };

      // Create large array
      const items = [];
      for (let i = 0; i < 1000; i++) {
        items.push({ id: i, value: i });
      }

      const input = { items };

      const tr = createTransformer();

      // Time the transformation
      const start = Date.now();
      const result = await tr.transform(input, compileTemplate(template));
      const duration = Date.now() - start;

      expect(result.items).toHaveLength(1000);
      expect(result.items[0]).toEqual({ id: 0, squared: 0 });
      expect(result.items[999]).toEqual({ id: 999, squared: 998001 });

      // Should complete in reasonable time
      expect(duration).toBeLessThan(1000); // Less than 1 second
    });
  });
});
