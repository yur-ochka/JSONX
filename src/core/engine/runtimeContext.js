// runtimeContext.js (updated)
// Execution context for transformation: registered functions and mode ('permissive' | 'strict')
import { parseSelector } from "../selector/parseSelector.js";
import { evalSelector } from "../selector/evalSelector.js";

// Helper function to parse function arguments
function parseArgs(argsStr) {
  const args = [];
  let current = "";
  let depth = 0;
  let inString = false;
  let quoteChar = "";

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];
    const prevChar = i > 0 ? argsStr[i - 1] : "";

    // Handle string literals
    if ((char === "'" || char === '"') && prevChar !== "\\") {
      if (!inString) {
        inString = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inString = false;
      }
    }

    // Handle parentheses depth
    if (!inString) {
      if (char === "(") depth++;
      if (char === ")") depth--;
    }

    // Split on comma when not inside string or nested parentheses
    if (char === "," && depth === 0 && !inString) {
      args.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  // Add the last argument
  if (current.trim() !== "") {
    args.push(current);
  }

  return args;
}

export function createRuntimeContext(opts = {}) {
  const functions = Object.assign({}, opts.builtins || {});
  const mode = opts.mode || "permissive";

  return {
    mode,
    registerFn(name, fn) {
      if (typeof name !== "string" || typeof fn !== "function")
        throw new Error("Invalid fn registration");
      functions[name] = fn;
    },
    unregisterFn(name) {
      delete functions[name];
    },
    getFn(name) {
      return functions[name];
    },
    evaluateExprString(expr, currentNode, root) {
      expr = String(expr).trim();

      // function call
      const fnCall = expr.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\((.*)\)$/s);
      if (fnCall) {
        const name = fnCall[1];
        const argsStr = fnCall[2];

        const fn = functions[name];
        if (!fn) {
          if (this.mode === "strict")
            throw new Error(`Unknown function: ${name}`);
          return null;
        }

        const args = parseArgs(argsStr).map((raw) => {
          raw = raw.trim();

          // selector
          if (raw.startsWith("$.")) {
            const tokens = parseSelector(raw);
            return evalSelector(root, tokens);
          }

          // string literal
          if (/^(['"]).*\1$/.test(raw)) {
            return raw.slice(1, -1);
          }

          // number
          if (!Number.isNaN(Number(raw))) {
            return Number(raw);
          }

          // unparsed text → return as is
          return raw;
        });

        return fn(...args);
      }

      // simple selector
      if (expr.startsWith("$.")) {
        const tokens = parseSelector(expr);
        return evalSelector(root, tokens);
      }

      // literal
      if (/^(['"]).*\1$/.test(expr)) return expr.slice(1, -1);
      if (!Number.isNaN(Number(expr))) return Number(expr);

      if (this.mode === "strict")
        throw new Error(`Cannot evaluate expression: ${expr}`);
      return null;
    },
  };
}
