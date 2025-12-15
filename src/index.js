import { transform } from "./core/engine/transform.js";
import { createRuntimeContext } from "./core/engine/runtimeContext.js";
import { builtins } from "./core/expressions/builtins.js";
import { validateSchema } from "./core/validation/schemaValidator.js";
import { templateSpecSchema } from "./core/validation/templateSchema.js";
//import { TemplateMatcher } from "./core/matching/templateMatcher.js";

export function compileTemplate(spec) {
  if (!spec || typeof spec !== "object") {
    throw new Error("Invalid template spec");
  }

  // Validate against schema
  const result = validateSchema(templateSpecSchema, spec, { mode: "strict" });

  if (!result.valid) {
    const msg = result.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
    throw new Error("Template spec validation failed: " + msg);
  }

  // Compile and enhance with template matcher
  const compiled = {
    ...spec,
    _compiled: true,
    //_matcher: new TemplateMatcher(spec.templates || []),
  };

  return compiled;
}

export function createTransformer(options = {}) {
  // Store the builtins separately
  const transformerBuiltins = { ...builtins, ...options.builtins };

  const ctx = createRuntimeContext({
    builtins: transformerBuiltins,
    mode: options.mode || "permissive",
  });

  return {
    registerFn: (name, fn) => {
      transformerBuiltins[name] = fn;
      ctx.registerFn(name, fn);
    },

    unregisterFn: (name) => {
      delete transformerBuiltins[name];
      ctx.unregisterFn(name);
    },

    async transform(input, compiledTemplate, opts = {}) {
      return transform(input, compiledTemplate, {
        ...opts,
        builtins: { ...transformerBuiltins, ...opts.builtins },
        mode: opts.mode || ctx.mode,
      });
    },
  };
}

// Convenience function for simple transforms
export async function transformDirect(input, templateSpec, opts = {}) {
  const transformer = createTransformer(opts);
  const compiled = compileTemplate(templateSpec);
  return transformer.transform(input, compiled, opts);
}

// Export everything
export { transform, builtins };
