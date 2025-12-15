export function parseExpr(expr) {
  expr = expr.trim();

  // Handle pipes (| operator)
  if (expr.includes("|")) {
    const parts = safeSplitPipe(expr);
    if (parts.length > 1) {
      return {
        type: "pipe",
        steps: parts.map(parseExpr),
      };
    }
  }

  // Handle function calls
  const fnMatch = expr.match(/^([A-Za-z_$][A-Za-z0-9_$]*)\((.*)\)$/s);
  if (fnMatch) {
    const name = fnMatch[1];
    const argsRaw = fnMatch[2].trim();
    return {
      type: "call",
      name,
      args: splitArgs(argsRaw).map((a) => parseExpr(a)),
    };
  }

  // Handle selector expressions
  if (expr.startsWith("$.")) {
    return { type: "selector", value: expr };
  }

  // Handle string literals
  if (/^(['"]).*\1$/.test(expr)) {
    return { type: "string", value: expr.slice(1, -1) };
  }

  // Handle number literals
  if (!Number.isNaN(Number(expr)) && expr.trim() !== "") {
    return { type: "number", value: Number(expr) };
  }

  // Handle boolean and null literals
  if (expr === "true") return { type: "boolean", value: true };
  if (expr === "false") return { type: "boolean", value: false };
  if (expr === "null") return { type: "null", value: null };

  // Default to identifier (for context variables)
  return { type: "identifier", value: expr };
}

// In splitArgs function, fix quote handling:
function splitArgs(s) {
  if (!s.trim()) return [];
  const args = [];
  let current = "";
  let depth = 0;
  let inString = false;
  let quoteChar = "";

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    // Handle string escaping
    if (inString) {
      if (ch === "\\" && i + 1 < s.length) {
        current += s[++i]; // Add escaped char
      } else if (ch === quoteChar) {
        inString = false;
        current += ch;
      } else {
        current += ch;
      }
      continue;
    }

    // Start of string
    if (ch === '"' || ch === "'") {
      inString = true;
      quoteChar = ch;
      current += ch;
      continue;
    }

    // Handle parentheses for nested calls
    if (ch === "(") depth++;
    if (ch === ")") depth--;

    // Split on comma only when not in nested structures
    if (ch === "," && depth === 0) {
      args.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

function safeSplitPipe(s) {
  const parts = [];
  let current = "";
  let inString = false;
  let quoteChar = "";

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (inString) {
      if (ch === "\\" && i + 1 < s.length) {
        current += s[++i];
      } else if (ch === quoteChar) {
        inString = false;
        current += ch;
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      quoteChar = ch;
      current += ch;
      continue;
    }

    if (ch === "|") {
      parts.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  if (current.trim() || parts.length > 0) {
    parts.push(current.trim());
  }

  return parts.filter((p) => p.length > 0);
}
