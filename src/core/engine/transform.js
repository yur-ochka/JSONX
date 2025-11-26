// Main transform entrypoint: accepts a template spec (the "compiled" template) and input JSON

import { createRuntimeContext } from "./runtimeContext.js";
import { applyTemplate } from "./applyTemplate.js";

export async function transform(input, templateSpec, opts = {}) {
  if (!templateSpec || typeof templateSpec !== "object")
    throw new Error("Invalid template specification");

  const ctx = createRuntimeContext(
    Object.assign(
      {
        builtins: {
          concat: (...parts) =>
            parts.map((p) => (p == null ? "" : String(p))).join(""),
          default: (v, d) => (v == null ? d : v),
          coalesce: (...args) => args.find((a) => a != null),
          length: (v) =>
            v == null
              ? 0
              : Array.isArray(v) || typeof v === "string"
              ? v.length
              : Object.keys(v).length,
          uppercase: (s) => (s == null ? s : String(s).toUpperCase()),
          lowercase: (s) => (s == null ? s : String(s).toLowerCase()),
        },
        mode: opts.mode || "permissive",
      },
      opts
    )
  );

  const templates = templateSpec.templates || [];
  const templatesMap = {};
  for (const t of templates) {
    if (!t.name) continue; // unnamed templates ignored for now
    templatesMap[t.name] = t;
  }

  if (templateSpec.root) {
    const { evaluate } = await import("./evaluator.js");
    return evaluate(templateSpec.root, ctx, input, input, templatesMap);
  }

  if (opts.start) {
    const t = templatesMap[opts.start];
    if (!t) throw new Error(`Unknown start template: ${opts.start}`);
    return applyTemplate(t, input, ctx, input, templatesMap);
  }

  if (templatesMap.root) {
    return applyTemplate(templatesMap.root, input, ctx, input, templatesMap);
  }

  if (ctx.mode === "strict")
    throw new Error("No root or start template specified");
  return null;
}
