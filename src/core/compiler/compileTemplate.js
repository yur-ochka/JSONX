// compileTemplate(spec) -> CompiledTemplate

const { validateTemplate } = require("../validation/validateTemplate");
const { parseExpr } = require("../expressions/parseExpr");

const path = require("path");

function parseSelector(sel) {
  if (typeof sel !== "string") throw new TypeError("selector must be a string");
  sel = sel.trim();
  if (!sel.startsWith("$")) {
    throw new Error(`Selector must start with $: "${sel}"`);
  }

  // remove leading $
  let i = 1;
  const tokens = [{ type: "root", raw: "$" }];

  while (i < sel.length) {
    const ch = sel[i];
    if (ch === ".") {
      // property access: .propName
      i++;
      let prop = "";
      while (i < sel.length) {
        const c = sel[i];
        if (c === "." || c === "[") break;
        prop += c;
        i++;
      }
      if (prop.length === 0)
        throw new Error(`Empty property in selector "${sel}"`);
      tokens.push({ type: "prop", value: prop });
      continue;
    }

    if (ch === "[") {
      i++;
      let inside = "";
      while (i < sel.length && sel[i] !== "]") {
        inside += sel[i];
        i++;
      }
      if (i >= sel.length)
        throw new Error(`Unterminated '[' in selector "${sel}"`);
      i++;
      inside = inside.trim();
      if (inside === "*") {
        tokens.push({ type: "wildcard" });
      } else {
        const idx = Number(inside);
        if (!Number.isFinite(idx) || Math.floor(idx) !== idx || idx < 0) {
          throw new Error(
            `Unsupported bracket content in selector "${sel}": [${inside}]`
          );
        }
        tokens.push({ type: "index", value: idx });
      }
      continue;
    }

    throw new Error(`Unexpected character "${ch}" in selector "${sel}"`);
  }

  return tokens;
}

function compileSelectorTokens(tokens) {
  return { tokens };
}

function walkAndCompileOutputs(node) {
  if (node === null) return null;
  const t = typeof node;
  if (t === "string") {
    // potential selector string starting with $
    if (node.trim().startsWith("$")) {
      const parsed = parseSelector(node.trim());
      return {
        _kind: "selector",
        selector: node.trim(),
        compiled: compileSelectorTokens(parsed),
      };
    }
    return node;
  }

  if (t === "number" || t === "boolean") return node;

  if (Array.isArray(node)) {
    return node.map((item) => walkAndCompileOutputs(item));
  }

  if (t === "object") {
    if (
      node &&
      node.hasOwnProperty &&
      node.hasOwnProperty("expr") &&
      typeof node.expr === "string"
    ) {
      try {
        const ast = parseExpr(node.expr);
        return { _kind: "expr", expr: node.expr, ast };
      } catch (err) {
        throw new Error(
          `Invalid expression syntax "${node.expr}": ${
            err && err.message ? err.message : err
          }`
        );
      }
    }
    if (node.hasOwnProperty("apply") && typeof node.apply === "string") {
      const out = { _kind: "apply", apply: node.apply };
      if (node.from && typeof node.from === "string") {
        out.from = {
          selector: node.from,
          compiled: compileSelectorTokens(parseSelector(node.from)),
        };
      }
      return out;
    }

    const res = {};
    for (const key of Object.keys(node)) {
      res[key] = walkAndCompileOutputs(node[key]);
    }
    return res;
  }

  return node;
}

function compileTemplate(spec) {
  if (typeof spec !== "object" || spec === null) {
    throw new TypeError("Template spec must be an object");
  }

  const { valid, errors } = validateTemplate(spec);
  if (!valid) {
    const errMsgs = errors
      .map((e) => `${e.instancePath || "/"}: ${e.message}`)
      .join("; ");
    const err = new Error(`Template validation failed: ${errMsgs}`);
    err.validation = errors;
    throw err;
  }

  const templates = Array.isArray(spec.templates) ? spec.templates : [];
  const nameMap = new Map();
  const compiledTemplates = [];

  templates.forEach((tpl, idx) => {
    const name = tpl.name || null;
    if (name) {
      if (nameMap.has(name)) {
        throw new Error(`Duplicate template name: "${name}"`);
      }
      nameMap.set(name, idx);
    }
  });

  templates.forEach((tpl, idx) => {
    const compiled = {
      originalIndex: idx,
      name: tpl.name || null,
      rawMatch: tpl.match || null,
      compiledMatch: null,
      rawOutput: tpl.output,
      output: null,
    };

    if (tpl.match) {
      try {
        compiled.compiledMatch = compileSelectorTokens(
          parseSelector(tpl.match)
        );
      } catch (e) {
        throw new Error(
          `Error parsing match selector for template "${
            tpl.name || "#" + idx
          }": ${e.message}`
        );
      }
    }

    try {
      compiled.output = walkAndCompileOutputs(tpl.output);
    } catch (e) {
      throw new Error(
        `Error compiling output for template "${tpl.name || "#" + idx}": ${
          e.message
        }`
      );
    }

    compiledTemplates.push(compiled);
  });

  let compiledRoot;
  try {
    compiledRoot = walkAndCompileOutputs(spec.root);
  } catch (e) {
    throw new Error(`Error compiling root output: ${e.message}`);
  }

  const byName = {};
  compiledTemplates.forEach((ct) => {
    if (ct.name) byName[ct.name] = ct;
  });

  function collectApplyTargets(node, acc = []) {
    if (!node || typeof node !== "object") return acc;
    if (Array.isArray(node)) {
      node.forEach((x) => collectApplyTargets(x, acc));
      return acc;
    }
    if (node._kind === "apply") {
      acc.push(node.apply);
      if (node.from && node.from.selector) {
      }
      return acc;
    }
    for (const k of Object.keys(node)) {
      collectApplyTargets(node[k], acc);
    }
    return acc;
  }

  const applyList = new Set();
  collectApplyTargets(compiledRoot).forEach((s) => applyList.add(s));
  compiledTemplates.forEach((ct) => {
    collectApplyTargets(ct.output).forEach((s) => applyList.add(s));
  });

  const missing = [];
  applyList.forEach((templateName) => {
    if (!byName[templateName]) missing.push(templateName);
  });

  const warnings = [];
  if (missing.length > 0) {
    warnings.push(
      `apply() references unknown templates: ${missing.join(", ")}`
    );
  }

  const compiledSpec = {
    meta: {
      compiledAt: new Date().toISOString(),
      templateCount: compiledTemplates.length,
      warnings,
    },
    templates: compiledTemplates,
    templateByName: byName,
    root: compiledRoot,
    raw: spec,
  };

  return compiledSpec;
}

module.exports = { compileTemplate, parseSelector };
