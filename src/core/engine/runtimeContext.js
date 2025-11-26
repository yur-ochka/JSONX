// Execution context for transformation: registered functions and mode ('permissive' | 'strict')

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
    evaluateExprString(expr, node, root) {
      expr = String(expr).trim();

      const fnCall = expr.match(/^([a-zA-Z_\$][a-zA-Z0-9_\$]*)\((.*)\)$/s);
      if (fnCall) {
        const name = fnCall[1];
        const argsStr = fnCall[2];
        const fn = functions[name];
        if (!fn) {
          if (this.mode === "strict")
            throw new Error(`Unknown function: ${name}`);
          return null;
        }
        const args = parseArgs(argsStr).map((a) => resolveArg(a, node, root));
        return fn(...args);
      }

      if (expr.startsWith("$.")) {
        const { parseSelector } = require("../selector/parseSelector");
        const { evalSelector } = require("../selector/evalSelector");
        const tokens = parseSelector(expr);
        return evalSelector(root, tokens);
      }

      if (/^(['"]).*\1$/.test(expr)) return expr.slice(1, -1);
      if (!Number.isNaN(Number(expr))) return Number(expr);

      if (this.mode === "strict")
        throw new Error(`Cannot evaluate expression: ${expr}`);
      return null;

      function parseArgs(s) {
        const res = [];
        let cur = "";
        let inStr = false;
        let strChar = "";
        for (let i = 0; i < s.length; i++) {
          const ch = s[i];
          if (inStr) {
            cur += ch;
            if (ch === strChar && s[i - 1] !== "\\") {
              inStr = false;
            }
            continue;
          }
          if (ch === "'" || ch === '"') {
            inStr = true;
            strChar = ch;
            cur += ch;
            continue;
          }
          if (ch === ",") {
            res.push(cur.trim());
            cur = "";
            continue;
          }
          cur += ch;
        }
        if (cur.trim() !== "") res.push(cur.trim());
        return res;
      }

      function resolveArg(a, node, root) {
        if (a.startsWith("$.")) {
          const { parseSelector } = require("../selector/parseSelector");
          const { evalSelector } = require("../selector/evalSelector");
          const tokens = parseSelector(a);
          return evalSelector(root, tokens);
        }
        if (/^(['"]).*\1$/.test(a)) return a.slice(1, -1);
        if (!Number.isNaN(Number(a))) return Number(a);
        if (functions[a]) return functions[a];
        return null;
      }
    },
  };
}
