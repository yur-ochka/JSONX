const { parseSelector } = require("../../src/core/selector/parseSelector.js");
const { evalSelector } = require("../../src/core/selector/evalSelector.js");

describe("evalSelector", () => {
  const data = {
    user: { id: 1, name: "Alice" },
    items: [1, 2, 3],
  };

  test("evaluates simple property", () => {
    const r = evalSelector(data, parseSelector("$.user.id"));
    expect(r).toBe(1);
  });

  test("evaluates array index", () => {
    const r = evalSelector(data, parseSelector("$.items[1]"));
    expect(r).toBe(2);
  });

  test("evaluates wildcard", () => {
    const r = evalSelector(data, parseSelector("$.items[*]"));
    expect(r).toEqual([1, 2, 3]);
  });
});
