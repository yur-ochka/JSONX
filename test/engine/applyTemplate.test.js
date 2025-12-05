const { applyTemplate } = require("../../src/core/engine/applyTemplate.js");
const {
  createRuntimeContext,
} = require("../../src/core/engine/runtimeContext.js");

describe("applyTemplate", () => {
  const template = {
    name: "user",
    output: {
      id: "$.id",
      name: "$.name",
    },
  };

  const ctx = createRuntimeContext({ builtins: {} });

  test("applies template to node", async () => {
    const node = { id: 1, name: "Alice" };
    const result = await applyTemplate(template, node, ctx, node, {});
    expect(result).toEqual(node);
  });
});
