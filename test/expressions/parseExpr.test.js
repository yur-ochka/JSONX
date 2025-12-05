const { parseExpr } = require("../../src/core/expressions/parseExpr.js");

describe("parseExpr", () => {
  test("parses selector expression", () => {
    const ast = parseExpr("$.user.id");
    expect(ast).toEqual({ type: "selector", value: "$.user.id" });
  });

  test("parses function call", () => {
    const ast = parseExpr("concat('a', 'b')");
    expect(ast.type).toBe("call");
    expect(ast.name).toBe("concat");
    expect(ast.args.length).toBe(2);
  });

  test("parses pipe expression", () => {
    const ast = parseExpr("$.name | uppercase");
    expect(ast.type).toBe("pipe");
  });
});
