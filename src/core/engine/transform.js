import { createRuntimeContext } from "./runtimeContext.js";
import { applyTemplate } from "./applyTemplate.js";

export async function transform(input, templateSpec, opts = {}) {
  if (!templateSpec || typeof templateSpec !== "object")
    throw new Error("Invalid template specification");

  console.log(
    "[transform] Received opts.builtins:",
    opts.builtins ? Object.keys(opts.builtins) : "none"
  );

  const ctx = createRuntimeContext(
    Object.assign(
      {
        builtins: opts.builtins || {}, // This should now have concat, etc.
        mode: opts.mode || "permissive",
      },
      opts
    )
  );

  const templates = templateSpec.templates || [];
  const templatesMap = {};
  for (const t of templates) {
    if (!t.name) continue;
    templatesMap[t.name] = t;
  }

  // Check for root template
  if (templateSpec.root) {
    const { evaluate } = await import("./evaluator.js");
    return evaluate(templateSpec.root, ctx, input, input, templatesMap);
  }

  // Check for start template option
  if (opts.start) {
    const t = templatesMap[opts.start];
    if (!t) throw new Error(`Unknown start template: ${opts.start}`);
    return applyTemplate(t, input, ctx, input, templatesMap);
  }

  // Check for auto-matching if no specific template is specified
  if (templateSpec._matcher) {
    const matching = templateSpec._matcher.findMatchingTemplates(input, input);
    if (matching.length > 0) {
      // Apply first matching template
      return applyTemplate(matching[0], input, ctx, input, templatesMap);
    }
  }

  // Fallback to root template
  if (templatesMap.root) {
    return applyTemplate(templatesMap.root, input, ctx, input, templatesMap);
  }

  if (ctx.mode === "strict") {
    throw new Error("No root, start, or matching template found");
  }

  return null;
}
