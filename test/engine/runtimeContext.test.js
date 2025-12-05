const {
  createRuntimeContext,
} = require("../../src/core/engine/runtimeContext.js");

describe("Runtime Context", () => {
  describe("Function Registration", () => {
    test("registerFn should add a function", () => {
      const ctx = createRuntimeContext();
      const testFn = () => "test";

      ctx.registerFn("testFunc", testFn);
      expect(ctx.getFn("testFunc")).toBe(testFn);
    });

    test("registerFn should throw error for invalid name", () => {
      const ctx = createRuntimeContext();

      expect(() => ctx.registerFn(123, () => {})).toThrow(
        "Invalid fn registration"
      );
      expect(() => ctx.registerFn("valid", "not a function")).toThrow(
        "Invalid fn registration"
      );
    });

    test("unregisterFn should remove function ", () => {
      const ctx = createRuntimeContext({ builtins: { existingFn: () => {} } });

      expect(ctx.getFn("existingFn")).toBeDefined();
      ctx.unregisterFn("existingFn");
      expect(ctx.getFn("existingFn")).toBeUndefined();
    });

    test("getFn should return undefined for non-existent function", () => {
      const ctx = createRuntimeContext();

      expect(ctx.getFn("nonExistent")).toBeUndefined();
    });
  });

  describe("evaluateExprString - Function Calls", () => {
    test("should evaluate function with string arguments", () => {
      const ctx = createRuntimeContext({
        builtins: {
          concat: (a, b) => a + b,
          upper: (str) => str.toUpperCase(),
        },
      });

      const result1 = ctx.evaluateExprString(
        "concat('Hello', 'World')",
        null,
        null
      );
      expect(result1).toBe("HelloWorld");

      const result2 = ctx.evaluateExprString("upper('test')", null, null);
      expect(result2).toBe("TEST");
    });

    test("should evaluate function with number arguments", () => {
      const ctx = createRuntimeContext({
        builtins: {
          add: (a, b) => a + b,
          multiply: (a, b) => a * b,
        },
      });

      const result1 = ctx.evaluateExprString("add(5, 3)", null, null);
      expect(result1).toBe(8);

      const result2 = ctx.evaluateExprString("multiply(4, 2.5)", null, null);
      expect(result2).toBe(10);
    });

    test("should return unparsed text as-is for unknown argument types", () => {
      const ctx = createRuntimeContext({
        builtins: {
          identity: (arg) => arg,
        },
      });

      const result = ctx.evaluateExprString(
        "identity(someUnparsedText)",
        null,
        null
      );
      expect(result).toBe("someUnparsedText");
    });

    test("should handle empty arguments", () => {
      const ctx = createRuntimeContext({
        builtins: {
          noArgs: () => "success",
        },
      });

      const result = ctx.evaluateExprString("noArgs()", null, null);
      expect(result).toBe("success");
    });

    test("should return null for unknown function in permissive mode", () => {
      const ctx = createRuntimeContext({ mode: "permissive" });

      const result = ctx.evaluateExprString("unknownFunc()", null, null);
      expect(result).toBeNull();
    });

    test("should throw error for unknown function in strict mode", () => {
      const ctx = createRuntimeContext({ mode: "strict" });

      expect(() => ctx.evaluateExprString("unknownFunc()", null, null)).toThrow(
        "Unknown function: unknownFunc"
      );
    });
  });

  describe("evaluateExprString - Literals", () => {
    test("should evaluate string literals", () => {
      const ctx = createRuntimeContext();

      expect(ctx.evaluateExprString("'hello'", null, null)).toBe("hello");
      expect(ctx.evaluateExprString('"world"', null, null)).toBe("world");
    });

    test("should evaluate number literals", () => {
      const ctx = createRuntimeContext();

      expect(ctx.evaluateExprString("42", null, null)).toBe(42);
      expect(ctx.evaluateExprString("3.14", null, null)).toBe(3.14);
      expect(ctx.evaluateExprString("-10", null, null)).toBe(-10);
    });

    test("should handle NaN for non-numeric strings", () => {
      const ctx = createRuntimeContext();

      expect(ctx.evaluateExprString("notANumber", null, null)).toBeNull();
    });
  });

  describe("evaluateExprString - Error Handling", () => {
    test("should throw error for unparsable expression in strict mode", () => {
      const ctx = createRuntimeContext({ mode: "strict" });

      expect(() =>
        ctx.evaluateExprString("invalid expression", null, null)
      ).toThrow("Cannot evaluate expression: invalid expression");
    });

    test("should return null for unparsable expression in permissive mode ", () => {
      const ctx = createRuntimeContext({ mode: "permissive" });

      const result = ctx.evaluateExprString("invalid expression", null, null);
      expect(result).toBeNull();
    });
  });

  describe("parseArgs helper function", () => {
    test("should parse comma-separated arguments", () => {
      const ctx = createRuntimeContext({
        builtins: {
          testArgs: (...args) => args,
        },
      });

      const result = ctx.evaluateExprString(
        "testArgs('string', 123, $.selector, unparsed, 'another string')",
        null,
        null
      );

      expect(Array.isArray(result)).toBe(true);
    });

    test("should handle nested parentheses in arguments", () => {
      const ctx = createRuntimeContext({
        builtins: {
          process: (arg) => arg,
        },
      });

      const result = ctx.evaluateExprString(
        "process('text with (nested) parentheses')",
        null,
        null
      );

      expect(result).toBe("text with (nested) parentheses");
    });
  });
});
