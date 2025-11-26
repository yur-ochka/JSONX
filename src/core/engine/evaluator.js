// Evaluate an "output node" from a template into concrete JSON value

import { parseSelector } from "../selector/parseSelector.js";
import { evalSelector } from "../selector/evalSelector.js";

export async function evaluate(node, ctx, currentNode, root, templatesMap) {
  if (node === null || typeof node === "number" || typeof node === "boolean")
    return node;

  if (typeof node === "string") {
    if (node.startsWith("$.")) {
      try {
        const tokens = parseSelector(node);
        return evalSelector(root, tokens);
      } catch (e) {
        if (ctx.mode === "strict") throw e;
        return null;
      }
    }
    return node;
  }

  if (typeof node === "object") {
    if (node.expr && typeof node.expr === "string") {
      try {
        return ctx.evaluateExprString(node.expr, currentNode, root);
      } catch (e) {
        if (ctx.mode === "strict") throw e;
        return null;
      }
    }

    if (node.apply && typeof node.apply === "string") {
      const templateName = node.apply;
      const from = node.from || "$.";
      let fromVal;
      try {
        const tokens = parseSelector(from);
        fromVal = evalSelector(root, tokens);
      } catch (e) {
        if (ctx.mode === "strict") throw e;
        fromVal = undefined;
      }

      const targetTemplate = templatesMap[templateName];
      if (!targetTemplate) {
        if (ctx.mode === "strict")
          throw new Error(`Unknown template: ${templateName}`);
        return null;
      }

      if (Array.isArray(fromVal)) {
        const results = [];
        for (const item of fromVal) {
          const r = await applyTemplate(
            targetTemplate,
            item,
            ctx,
            root,
            templatesMap
          );
          results.push(r);
        }
        return results;
      }
      if (fromVal === undefined || fromVal === null) return [];
      return applyTemplate(targetTemplate, fromVal, ctx, root, templatesMap);
    }

    const out = Array.isArray(node) ? [] : {};
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        out.push(await evaluate(node[i], ctx, currentNode, root, templatesMap));
      }
    } else {
      for (const [k, v] of Object.entries(node)) {
        out[k] = await evaluate(v, ctx, currentNode, root, templatesMap);
      }
    }
    return out;
  }

  if (ctx.mode === "strict")
    throw new Error("Unsupported node type in evaluator");
  return null;
}

import { applyTemplate } from "./applyTemplate.js";
