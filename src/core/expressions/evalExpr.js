import { parseSelector } from "../selector/parseSelector.js";
import { evalSelector } from "../selector/evalSelector.js";

// Make the function async
export async function evalExpr(ast, ctx, currentNode, root) {

  switch (ast.type) {
    case "number":
      return ast.value;

    case "string":
      return ast.value;

    case "boolean":
      return ast.value;

    case "null":
      return null;

    case "selector": {
      try {
        const tokens = parseSelector(ast.value);
        const result = evalSelector(currentNode, tokens, ctx);
        return result;
      } catch (error) {
        if (ctx.mode === "strict") throw error;
        return null;
      }
    }

    case "identifier": {
      if (ctx && typeof ctx.getFn === "function") {
        const fn = ctx.getFn(ast.value);
        if (fn) {
          return fn;
        }
      }
      return null;
    }

    case "call": {

      // Get the function
      const fn = ctx.getFn ? ctx.getFn(ast.name) : null;
      if (!fn) {
        if (ctx.mode === "strict") {
          throw new Error(`Unknown function: ${ast.name}`);
        }
        return null;
      }

      // Evaluate all arguments 
      const evaluatedArgs = [];
      for (const arg of ast.args) {
        evaluatedArgs.push(await evalExpr(arg, ctx, currentNode, root));
      }

      try {
        const result = fn(...evaluatedArgs);

        if (result && typeof result.then === "function") {
          return await result;
        }

        return result;
      } catch (error) {
        if (ctx.mode === "strict") throw error;
        return null;
      }
    }

    case "pipe": {
      if (ast.steps.length === 0) return null;

      // Evaluate first step
      let value = await evalExpr(ast.steps[0], ctx, currentNode, root);

      // Apply remaining steps
      for (let i = 1; i < ast.steps.length; i++) {
        const step = ast.steps[i];

        if (step.type === "identifier") {
          const fn = ctx.getFn ? ctx.getFn(step.value) : null;
          if (!fn) {
            if (ctx.mode === "strict") {
              throw new Error(`Unknown pipe function: ${step.value}`);
            }
            return null;
          }

          try {
            const result = fn(value);
            // Handle async functions
            value =
              result && typeof result.then === "function"
                ? await result
                : result;
          } catch (error) {
            if (ctx.mode === "strict") throw error;
            return null;
          }
        } else if (step.type === "call") {
          // Function call with arguments
          const fn = ctx.getFn ? ctx.getFn(step.name) : null;
          if (!fn) {
            if (ctx.mode === "strict") {
              throw new Error(`Unknown pipe function: ${step.name}`);
            }
            return null;
          }

          // Evaluate all arguments first
          const evaluatedArgs = [];
          for (const arg of step.args) {
            evaluatedArgs.push(await evalExpr(arg, ctx, currentNode, root));
          }

          // The piped value becomes the FIRST argument
          const allArgs = [value, ...evaluatedArgs];

          try {
            const result = fn(...allArgs);
            // Handle async functions
            value =
              result && typeof result.then === "function"
                ? await result
                : result;
          } catch (error) {
            if (ctx.mode === "strict") throw error;
            return null;
          }
        } else {
          if (ctx.mode === "strict") {
            throw new Error(
              `Pipe step must be identifier or call, got ${step.type}`
            );
          }
          return null;
        }
      }

      return value;
    }

    default:
      if (ctx.mode === "strict") {
        throw new Error(`Unknown AST type: ${ast.type}`);
      }
      return null;
  }
}
