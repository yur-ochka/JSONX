import { createTransformer, compileTemplate } from "../../src/index.js";

describe("Custom Function Tests", () => {
  test("register and use custom function", async () => {
    const template = {
      templates: [
        {
          name: "product",
          output: {
            name: "$.name",
            slug: { expr: "slugify($.name)" },
          },
        },
      ],
      root: {
        products: { apply: "product", from: "$.products" },
      },
    };

    const input = {
      products: [{ name: "Red T-Shirt XL" }],
    };

    const tr = createTransformer();

    tr.registerFn("slugify", (str) => {
      return String(str)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    });

    const result = await tr.transform(input, compileTemplate(template));

    expect(result).toEqual({
      products: [{ name: "Red T-Shirt XL", slug: "red-t-shirt-xl" }],
    });
  });

  test("custom function with multiple arguments", async () => {
    const template = {
      templates: [
        {
          name: "item",
          output: {
            name: "$.name",
            formatted: { expr: "wrap($.name, '[', ']')" },
          },
        },
      ],
      root: {
        items: { apply: "item", from: "$.items" },
      },
    };

    const input = {
      items: [{ name: "test" }],
    };

    const tr = createTransformer();
    tr.registerFn("wrap", (str, left, right) => `${left}${str}${right}`);

    const result = await tr.transform(input, compileTemplate(template));

    expect(result).toEqual({
      items: [{ name: "test", formatted: "[test]" }],
    });
  });

  test("custom function overrides built-in", async () => {
    const template = {
      templates: [
        {
          name: "text",
          output: {
            result: { expr: "uppercase($.text)" },
          },
        },
      ],
      root: {
        transformed: { apply: "text", from: "$.data" },
      },
    };

    const input = {
      data: { text: "hello" },
    };

    const tr = createTransformer();

    tr.registerFn("uppercase", (str) => `CUSTOM: ${str.toUpperCase()}`);

    const result = await tr.transform(input, compileTemplate(template));

    expect(result).toEqual({
      transformed: {
        result: "CUSTOM: HELLO",
      },
    });
  });

  test("unregister custom function", async () => {
    const template = {
      templates: [
        {
          name: "item",
          output: {
            result: { expr: "customFn($.value)" },
          },
        },
      ],
      root: {
        item: { apply: "item", from: "$.item" },
      },
    };

    const input = {
      item: { value: 5 },
    };

    const tr = createTransformer();

    tr.registerFn("customFn", (x) => x * 2);
    tr.unregisterFn("customFn");

    await expect(
      tr.transform(input, compileTemplate(template), { mode: "strict" })
    ).rejects.toThrow();
  });
});
