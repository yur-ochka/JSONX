export function evalSelector(root, tokens, ctx = { mode: "permissive" }) {
  let current = root;

  for (const token of tokens) {
    if (token.type === "prop") {
      if (current && typeof current === "object" && token.key in current) {
        current = current[token.key];
      } else {
        if (ctx.mode === "strict") {
          throw new Error(`Property "${token.key}" not found in path`);
        }
        return undefined;
      }
    } else if (token.type === "index") {
      if (Array.isArray(current) && current[token.index] !== undefined) {
        current = current[token.index];
      } else {
        if (ctx.mode === "strict") {
          throw new Error(`Array index ${token.index} out of bounds`);
        }
        return undefined;
      }
    } else if (token.type === "wildcard") {
      if (!Array.isArray(current)) {
        if (ctx.mode === "strict") {
          throw new Error(`Cannot apply wildcard to non-array`);
        }
        return undefined;
      }
      current = current.map((item) => item);
    }
  }

  return current;
}
