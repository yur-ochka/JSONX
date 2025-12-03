// src/core/expressions/evalExpr.js - Corrected implementation

import { parseSelector } from "../selector/parseSelector.js";
import { evalSelector } from "../selector/evalSelector.js";

export function evalExpr(ast, ctx, currentNode, root) {
  console.log("🔍 evalExpr AST:", ast.type, ast);

  switch (ast.type) {
    case "number":
    case "string":
    case "boolean":
    case "null":
      return ast.value;

    case "selector": {
      try {
        console.log(
          "🔍 Evaluating selector:",
          ast.value,
          "against:",
          currentNode
        );
        const tokens = parseSelector(ast.value);
        const result = evalSelector(currentNode, tokens); // FIXED: Use currentNode
        console.log("🔍 Selector result:", result);
        return result;
      } catch (e) {
        console.error("❌ Selector error:", e.message);
        if (ctx.mode === "strict") throw e;
        return null;
      }
    }

    case "identifier": {
      // Check if it's a function in the context
      if (ctx.getFn) {
        const fn = ctx.getFn(ast.value);
        if (fn) {
          console.log("🔍 Found function:", ast.value, fn);
          return fn;
        }
      }
      console.warn("⚠️ Identifier not found:", ast.value);
      return null;
    }

    case "call": {
      console.log("🔍 Function call:", ast.name, "with args:", ast.args);
      const fn = ctx.getFn ? ctx.getFn(ast.name) : null;
      if (!fn) {
        console.error("❌ Function not found:", ast.name);
        if (ctx.mode === "strict")
          throw new Error(`Unknown function: ${ast.name}`);
        return null;
      }

      // Evaluate all arguments
      const args = ast.args.map((arg) => {
        const result = evalExpr(arg, ctx, currentNode, root);
        console.log("🔍 Arg evaluated:", arg, "->", result);
        return result;
      });

      console.log("🔍 Calling function:", ast.name, "with args:", args);
      try {
        const result = fn(...args);
        console.log("🔍 Function result:", result);
        return result;
      } catch (e) {
        console.error("❌ Function execution error:", e);
        if (ctx.mode === "strict") throw e;
        return null;
      }
    }

    case "pipe": {
      console.log("🔍 Pipe expression with steps:", ast.steps.length);
      if (ast.steps.length === 0) return null;

      // Evaluate first step
      let val = evalExpr(ast.steps[0], ctx, currentNode, root);
      console.log("🔍 Pipe initial value:", val);

      // Apply remaining steps as functions
      for (let i = 1; i < ast.steps.length; i++) {
        const step = ast.steps[i];

        // For pipe steps, we expect them to be identifiers (function names)
        if (step.type === "identifier") {
          const fn = ctx.getFn ? ctx.getFn(step.value) : null;
          if (!fn) {
            console.error("❌ Pipe function not found:", step.value);
            if (ctx.mode === "strict")
              throw new Error(`Pipe step is not a function: ${step.value}`);
            return null;
          }
          console.log("🔍 Applying pipe function:", step.value, "to:", val);
          try {
            val = fn(val);
            console.log("🔍 Pipe result:", val);
          } catch (e) {
            console.error("❌ Pipe function error:", e);
            if (ctx.mode === "strict") throw e;
            return null;
          }
        } else {
          console.error("❌ Invalid pipe step type:", step.type);
          if (ctx.mode === "strict")
            throw new Error("Pipe step must be a function identifier");
          return null;
        }
      }

      return val;
    }

    default:
      console.error("❌ Unknown AST type:", ast.type);
      if (ctx.mode === "strict")
        throw new Error(`Unknown AST node type: ${ast.type}`);
      return null;
  }
}
