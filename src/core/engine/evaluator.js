import { parseSelector } from "../selector/parseSelector.js";
import { evalSelector } from "../selector/evalSelector.js";

import { parseExpr } from "../expressions/parseExpr.js";
import { evalExpr } from "../expressions/evalExpr.js";

export async function evaluate(node, ctx, currentNode, root, templatesMap) {
  if (node === null || typeof node === "number" || typeof node === "boolean") {
    return node;
  }

  if (typeof node === "string") {
    if (node.startsWith("$.")) return safeSelect(node, root, ctx);
    return node;
  }

  if (typeof node === "object") {
    if (typeof node.expr === "string") {
      try {
        const ast = parseExpr(node.expr);
        return evalExpr(ast, ctx, currentNode, root);
      } catch (e) {
        if (ctx.mode === "strict") throw e;
        return null;
      }
    }

    if (typeof node.apply === "string") {
      const from = node.from || "$.";
      const sourceVal = safeSelect(from, root, ctx);

      const template = templatesMap[node.apply];
      if (!template) {
        if (ctx.mode === "strict")
          throw new Error(`Unknown template: ${node.apply}`);
        return null;
      }

      const { applyTemplate } = await import("./applyTemplate.js");

      if (Array.isArray(sourceVal)) {
        const arr = [];
        for (const item of sourceVal) {
          arr.push(
            await applyTemplate(template, item, ctx, root, templatesMap)
          );
        }
        return arr;
      } else {
        return applyTemplate(template, sourceVal, ctx, root, templatesMap);
      }
    }

    if (Array.isArray(node)) {
      const arr = [];
      for (const el of node) {
        arr.push(await evaluate(el, ctx, currentNode, root, templatesMap));
      }
      return arr;
    }

    const out = {};
    for (const [key, val] of Object.entries(node)) {
      out[key] = await evaluate(val, ctx, currentNode, root, templatesMap);
    }
    return out;
  }

  return null;
}

function safeSelect(selector, root, ctx) {
  try {
    const tokens = parseSelector(selector);
    return evalSelector(root, tokens);
  } catch (e) {
    if (ctx.mode === "strict") throw e;
    return null;
  }
}
