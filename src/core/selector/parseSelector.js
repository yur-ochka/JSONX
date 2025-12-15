// JSONPath-like selector parser

export function parseSelector(selector) {
  if (typeof selector !== "string")
    throw new Error("Selector must be a string");

  if (selector === "$") {
    return [];
  }

  if (!selector.startsWith("$."))
    throw new Error(
      `Invalid selector: ${selector}. Must be '$' or start with '$.'`
    );

  const tokens = [];
  let i = 1; // skip $

  while (i < selector.length) {
    const char = selector[i];

    if (char === ".") {
      i++;
      let name = "";
      while (i < selector.length && /[A-Za-z0-9_$]/.test(selector[i])) {
        name += selector[i++];
      }

      if (!name && i === selector.length && tokens.length === 0) {
        return [];
      }

      if (!name) throw new Error(`Invalid property name at position ${i}`);
      tokens.push({ type: "prop", key: name });
      continue;
    }

    if (char === "[") {
      i++;
      if (selector[i] === "*" && selector[i + 1] === "]") {
        tokens.push({ type: "wildcard" });
        i += 2;
        continue;
      }

      let num = "";
      while (i < selector.length && /[0-9]/.test(selector[i])) {
        num += selector[i++];
      }
      if (selector[i] !== "]") throw new Error(`Missing closing ] in selector`);
      i++;

      if (num === "") throw new Error("Empty array index");
      tokens.push({ type: "index", index: Number(num) });
      continue;
    }

    throw new Error(`Unexpected character '${char}' at position ${i}`);
  }

  return tokens;
}
