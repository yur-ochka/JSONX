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

describe("evalExpr", () => {
  const root = {
    user: {
      name: "alice",
      age: 30,
      active: true,
      scores: [85, 90, 95],
    },
    data: null,
  };

  const ctx = {
    mode: "strict",
    getFn: (name) => builtins[name],
  };

  const permissiveCtx = {
    mode: "permissive",
    getFn: (name) => builtins[name],
  };

  describe("Basic Literals", () => {
    test("should evaluate number literal", async () => {
      const ast = { type: "number", value: 42 };
      const result = await evalExpr(ast, ctx, root, root);
      expect(result).toBe(42);
    });

    test("should evaluate string literal", async () => {
      const ast = { type: "string", value: "hello world" };
      const result = await evalExpr(ast, ctx, root, root);
      expect(result).toBe("hello world");
    });

    test("should evaluate boolean literal (true)", async () => {
      const ast = { type: "boolean", value: true };
      const result = await evalExpr(ast, ctx, root, root);
      expect(result).toBe(true);
    });

    test("should evaluate boolean literal (false)", async () => {
      const ast = { type: "boolean", value: false };
      const result = await evalExpr(ast, ctx, root, root);
      expect(result).toBe(false);
    });

    test("should evaluate null literal", async () => {
      const ast = { type: "null" };
      const result = await evalExpr(ast, ctx, root, root);
      expect(result).toBeNull();
    });

    test("should evaluate null literal (explicit)", async () => {
      const ast = { type: "null", value: null };
      const result = await evalExpr(ast, ctx, root, root);
      expect(result).toBeNull();
    });
  });

  describe("Identifier Evaluation", () => {
    test("should return function for valid identifier", async () => {
      const ast = { type: "identifier", value: "uppercase" };
      const result = await evalExpr(ast, ctx, root, root);

      expect(typeof result).toBe("function");
      expect(result).toBe(builtins.uppercase);
    });

    test("should return null for unknown identifier when ctx has getFn", async () => {
      const ast = { type: "identifier", value: "unknownFunction" };
      const result = await evalExpr(ast, ctx, root, root);

      expect(result).toBeNull();
    });

    test("should return null when ctx doesn't have getFn method", async () => {
      const ast = { type: "identifier", value: "uppercase" };
      const invalidCtx = { mode: "strict" };

      const result = await evalExpr(ast, invalidCtx, root, root);
      expect(result).toBeNull();
    });

    test("should return null when getFn returns undefined", async () => {
      const mockCtx = {
        mode: "strict",
        getFn: jest.fn(() => undefined),
      };

      const ast = { type: "identifier", value: "someFunction" };
      const result = await evalExpr(ast, mockCtx, root, root);

      expect(result).toBeNull();
      expect(mockCtx.getFn).toHaveBeenCalledWith("someFunction");
    });
  });

  describe("Function Call Evaluation", () => {
    test("should evaluate function call with multiple arguments", async () => {
      const ast = {
        type: "call",
        name: "concat",
        args: [
          { type: "string", value: "Hello " },
          { type: "string", value: "World" },
        ],
      };

      const result = await evalExpr(ast, ctx, root, root);
      expect(result).toBe("Hello World");
    });

    test("should throw error for unknown function in strict mode ", async () => {
      const ast = {
        type: "call",
        name: "unknownFunction",
        args: [],
      };

      await expect(evalExpr(ast, ctx, root, root)).rejects.toThrow(
        "Unknown function: unknownFunction"
      );
    });

    test("should return null for unknown function in permissive mode ", async () => {
      const ast = {
        type: "call",
        name: "unknownFunction",
        args: [],
      };

      const result = await evalExpr(ast, permissiveCtx, root, root);
      expect(result).toBeNull();
    });

    test("should handle async function calls", async () => {
      const mockAsyncFn = jest.fn(() => Promise.resolve("async result"));
      const asyncCtx = {
        mode: "strict",
        getFn: (name) => (name === "asyncFunc" ? mockAsyncFn : null),
      };

      const ast = {
        type: "call",
        name: "asyncFunc",
        args: [{ type: "string", value: "test" }],
      };

      const result = await evalExpr(ast, asyncCtx, root, root);
      expect(result).toBe("async result");
      expect(mockAsyncFn).toHaveBeenCalledWith("test");
    });

    test("should handle function that throws error in strict mode", async () => {
      const errorFn = jest.fn(() => {
        throw new Error("Function error");
      });

      const errorCtx = {
        mode: "strict",
        getFn: (name) => (name === "errorFunc" ? errorFn : null),
      };

      const ast = {
        type: "call",
        name: "errorFunc",
        args: [],
      };

      await expect(evalExpr(ast, errorCtx, root, root)).rejects.toThrow(
        "Function error"
      );
    });

    test("should handle function that throws error in permissive mode", async () => {
      const errorFn = jest.fn(() => {
        throw new Error("Function error");
      });

      const errorPermissiveCtx = {
        mode: "permissive",
        getFn: (name) => (name === "errorFunc" ? errorFn : null),
      };

      const ast = {
        type: "call",
        name: "errorFunc",
        args: [],
      };

      const result = await evalExpr(ast, errorPermissiveCtx, root, root);
      expect(result).toBeNull();
    });
  });

  describe("Pipe Evaluation", () => {
    test("should handle empty pipe", async () => {
      const ast = { type: "pipe", steps: [] };
      const result = await evalExpr(ast, ctx, root, root);
      expect(result).toBeNull();
    });

    test("should evaluate pipe with identifier step", async () => {
      const ast = {
        type: "pipe",
        steps: [
          { type: "string", value: "hello" },
          { type: "identifier", value: "uppercase" },
        ],
      };

      const result = await evalExpr(ast, ctx, root, root);
      expect(result).toBe("HELLO");
    });

    test("should throw error for unknown pipe function in strict mode", async () => {
      const ast = {
        type: "pipe",
        steps: [
          { type: "string", value: "test" },
          { type: "identifier", value: "unknownFunction" },
        ],
      };

      await expect(evalExpr(ast, ctx, root, root)).rejects.toThrow(
        "Unknown pipe function: unknownFunction"
      );
    });

    test("should return null for unknown pipe function in permissive mode", async () => {
      const ast = {
        type: "pipe",
        steps: [
          { type: "string", value: "test" },
          { type: "identifier", value: "unknownFunction" },
        ],
      };

      const result = await evalExpr(ast, permissiveCtx, root, root);
      expect(result).toBeNull();
    });

    test("should throw error for invalid pipe step type in strict mode ", async () => {
      const ast = {
        type: "pipe",
        steps: [
          { type: "string", value: "test" },
          { type: "number", value: 42 },
        ],
      };

      await expect(evalExpr(ast, ctx, root, root)).rejects.toThrow(
        "Pipe step must be identifier or call, got number"
      );
    });

    test("should handle async function in pipe", async () => {
      const mockAsyncFn = jest.fn((input) =>
        Promise.resolve(input.toUpperCase())
      );
      const asyncCtx = {
        mode: "strict",
        getFn: (name) => (name === "asyncUpper" ? mockAsyncFn : null),
      };

      const ast = {
        type: "pipe",
        steps: [
          { type: "string", value: "hello" },
          { type: "identifier", value: "asyncUpper" },
        ],
      };

      const result = await evalExpr(ast, asyncCtx, root, root);
      expect(result).toBe("HELLO");
      expect(mockAsyncFn).toHaveBeenCalledWith("hello");
    });

    test("should handle function error in pipe in strict mode", async () => {
      const errorFn = jest.fn(() => {
        throw new Error("Pipe function error");
      });

      const errorCtx = {
        mode: "strict",
        getFn: (name) => (name === "errorFunc" ? errorFn : null),
      };

      const ast = {
        type: "pipe",
        steps: [
          { type: "string", value: "test" },
          { type: "identifier", value: "errorFunc" },
        ],
      };

      await expect(evalExpr(ast, errorCtx, root, root)).rejects.toThrow(
        "Pipe function error"
      );
    });

    test("should handle function error in pipe in permissive mode", async () => {
      const errorFn = jest.fn(() => {
        throw new Error("Pipe function error");
      });

      const errorPermissiveCtx = {
        mode: "permissive",
        getFn: (name) => (name === "errorFunc" ? errorFn : null),
      };

      const ast = {
        type: "pipe",
        steps: [
          { type: "string", value: "test" },
          { type: "identifier", value: "errorFunc" },
        ],
      };

      const result = await evalExpr(ast, errorPermissiveCtx, root, root);
      expect(result).toBeNull();
    });
  });

  describe("Edge Cases and Integration", () => {
    test("should handle context without mode property", async () => {
      const invalidCtx = {
        getFn: (name) => builtins[name],
      };

      const ast = { type: "string", value: "test" };

      const result = await evalExpr(ast, invalidCtx, root, root);
      expect(result).toBe("test");
    });
  });
});
