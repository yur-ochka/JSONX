// Parses function calls, pipes, literals, selectors

export function parseExpr(expr) {
  expr = expr.trim();

  if (expr.includes("|")) {
    const parts = expr.split("|").map((p) => p.trim());
    return {
      type: "pipe",
      steps: parts.map(parseExpr),
    };
  }

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

  if (expr.startsWith("$.")) {
    return { type: "selector", value: expr };
  }

  if (/^(['"]).*\1$/.test(expr)) {
    return { type: "string", value: expr.slice(1, -1) };
  }

  if (!Number.isNaN(Number(expr))) {
    return { type: "number", value: Number(expr) };
  }

  return { type: "identifier", value: expr };
}

function splitArgs(s) {
  if (!s) return [];
  const out = [];
  let cur = "";
  let depth = 0;
  let inStr = false;
  let quote = "";

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      cur += ch;
      if (ch === quote && s[i - 1] !== "\\") {
        inStr = false;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      inStr = true;
      quote = ch;
      cur += ch;
      continue;
    }
    if (ch === "(") depth++;
    if (ch === ")") depth--;

    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
      continue;
    }

    cur += ch;
  }

  if (cur.trim()) out.push(cur.trim());
  return out;
}
