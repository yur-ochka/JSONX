// src/core/engine/applyTemplate.js

import { evaluate } from "./evaluator.js";

export async function applyTemplate(template, node, ctx, root, templatesMap) {
  if (!template || typeof template !== "object")
    throw new Error("Invalid template");

  const outputSpec = template.output || {};

  // ❗ root завжди ПОВИНЕН залишатися оригінальним вхідним JSON
  // НЕ node, НЕ currentNode, НЕ override
  const realRoot = root;

  return evaluate(outputSpec, ctx, node, realRoot, templatesMap);
}
