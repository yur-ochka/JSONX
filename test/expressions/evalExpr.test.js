const { evalExpr } = require("../../src/core/expressions/evalExpr.js");
const { parseExpr } = require("../../src/core/expressions/parseExpr.js");
const { builtins } = require("../../src/core/expressions/builtins.js");

const ctx = {
  mode: "strict",
  getFn: (name) => builtins[name],
};

describe("evalExpr", () => {
  const root = { user: { name: "alice" } };

  test("evaluates selector", async () => {
    const ast = parseExpr("$.user.name");
    const r = await evalExpr(ast, ctx, root, root);
    expect(r).toBe("alice");
  });

  test("evaluates builtin function", async () => {
    const ast = parseExpr("uppercase($.user.name)");
    const r = await evalExpr(ast, ctx, root, root);
    expect(r).toBe("ALICE");
  });

  test("evaluates pipe", async () => {
    const ast = parseExpr("$.user.name | uppercase");
    const r = await evalExpr(ast, ctx, root, root);
    expect(r).toBe("ALICE");
  });
});
