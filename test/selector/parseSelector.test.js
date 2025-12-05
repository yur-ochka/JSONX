const { parseSelector } = require("../../src/core/selector/parseSelector.js");

describe("parseSelector", () => {
  test("parses simple property path", () => {
    const tokens = parseSelector("$.user.name");
    expect(tokens).toEqual([
      { type: "prop", key: "user" },
      { type: "prop", key: "name" },
    ]);
  });

  test("parses array index", () => {
    const tokens = parseSelector("$.users[0].id");
    expect(tokens).toEqual([
      { type: "prop", key: "users" },
      { type: "index", index: 0 },
      { type: "prop", key: "id" },
    ]);
  });

  test("parses wildcard", () => {
    const tokens = parseSelector("$.items[*]");
    expect(tokens).toEqual([
      { type: "prop", key: "items" },
      { type: "wildcard" },
    ]);
  });
});
