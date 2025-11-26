// Public API export layer for JSONX

import { transform } from "./core/engine/transform.js";
import { createRuntimeContext } from "./core/engine/runtimeContext.js";
import { builtins } from "./core/expressions/builtins.js";

import { validateSchema } from "./core/validation/schemaValidator.js";
import { templateSpecSchema } from "./core/validation/templateSchema.js";

export function compileTemplate(spec) {
  if (!spec || typeof spec !== "object")
    throw new Error("Invalid template spec");

  const result = validateSchema(templateSpecSchema, spec, { mode: "strict" });

  if (!result.valid) {
    const msg = result.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
    throw new Error("Template spec validation failed: " + msg);
  }

  return spec;
}

export function createTransformer(options = {}) {
  const ctx = createRuntimeContext({
    builtins,
    mode: options.mode || "permissive",
  });

  return {
    registerFn: ctx.registerFn,
    unregisterFn: ctx.unregisterFn,

    async transform(input, compiledTemplate, opts = {}) {
      return transform(input, compiledTemplate, {
        ...opts,
        mode: opts.mode || ctx.mode,
      });
    },
  };
}

export { transform, builtins };
