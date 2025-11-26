// Apply a named template (or template object) to a JSON node

import { evaluate } from "./evaluator.js";

export async function applyTemplate(template, node, ctx, root, templatesMap) {
  if (!template || typeof template !== "object")
    throw new Error("Invalid template");
  const outputSpec = template.output || {};
  return evaluate(
    outputSpec,
    ctx,
    node,
    root === undefined ? node : root,
    templatesMap
  );
}
