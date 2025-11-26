// Evaluates parsed selector tokens on a JSON object

export function evalSelector(root, tokens) {
  let current = root;

  for (const token of tokens) {
    if (token.type === "prop") {
      if (current && typeof current === "object" && token.key in current) {
        current = current[token.key];
      } else {
        return undefined;
      }
    } else if (token.type === "index") {
      if (Array.isArray(current) && current[token.index] !== undefined) {
        current = current[token.index];
      } else {
        return undefined;
      }
    } else if (token.type === "wildcard") {
      if (!Array.isArray(current)) return undefined;
      current = current.map((item) => item);
    } else {
      throw new Error(`Unknown selector token: ${token.type}`);
    }
  }

  return current;
}
