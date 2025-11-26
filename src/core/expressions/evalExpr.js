// Evaluates parsed expression tree

import { parseSelector } from "../selector/parseSelector.js";
import { evalSelector } from "../selector/evalSelector.js";

export function evalExpr(ast, ctx, currentNode, root) {
  switch (ast.type) {
    case "number":
    case "string":
      return ast.value;

    case "selector": {
      try {
        const tokens = parseSelector(ast.value);
        return evalSelector(root, tokens);
      } catch (e) {
        if (ctx.mode === "strict") throw e;
        return null;
      }
    }

    case "identifier": {
      const fn = ctx.getFn(ast.value);
      if (fn) return fn;
      return null;
    }

    case "call": {
      const fn = ctx.getFn(ast.name);
      if (!fn) {
        if (ctx.mode === "strict")
          throw new Error(`Unknown function: ${ast.name}`);
        return null;
      }
      const args = ast.args.map((arg) => evalExpr(arg, ctx, currentNode, root));
      return fn(...args);
    }

    case "pipe": {
      let val = evalExpr(ast.steps[0], ctx, currentNode, root);
      for (let i = 1; i < ast.steps.length; i++) {
        const step = ast.steps[i];
        const fn = evalExpr(step, ctx, currentNode, root);
        if (typeof fn !== "function") {
          if (ctx.mode === "strict")
            throw new Error("Pipe step is not a function");
          return null;
        }
        val = fn(val);
      }
      return val;
    }

    default:
      if (ctx.mode === "strict")
        throw new Error(`Unknown AST node type: ${ast.type}`);
      return null;
  }
}
