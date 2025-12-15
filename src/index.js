import { transform } from "./core/engine/transform.js";
import { createRuntimeContext } from "./core/engine/runtimeContext.js";
import { builtins } from "./core/expressions/builtins.js";
import { validateSchema } from "./core/validation/schemaValidator.js";
import { templateSpecSchema } from "./core/validation/templateSchema.js";
//import { TemplateMatcher } from "./core/matching/templateMatcher.js";

/**
 * Validates a raw template specification against the JSONX schema and compiles it
 * for the transformation engine.
 * * @param {object} spec - The raw template object.
 * @returns {object} A compiled template object, enhanced with internal metadata.
 * @throws {Error} If the template fails schema validation.
 */

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

/**
 * Creates an isolated JSONX transformer instance. Each instance maintains its own
 * function registry, ensuring no global side effects.
 * * @param {object} [options] - Configuration options.
 * @param {string} [options.mode='permissive'] - Default mode ('strict' or 'permissive').
 * @param {object} [options.builtins] - Additional built-in functions to register immediately.
 * @returns {object} A Transformer API object.
 */

export function createTransformer(options = {}) {
  // Store the builtins separately
  const transformerBuiltins = { ...builtins, ...options.builtins };

  const ctx = createRuntimeContext({
    builtins: transformerBuiltins,
    mode: options.mode || "permissive",
  });

  return {
    /**
     * Registers a custom function for use in expressions within this transformer instance.
     * @param {string} name - The name of the function (e.g., 'slugify').
     * @param {function} fn - The function implementation: `(...args) => result`.
     */

    registerFn: (name, fn) => {
      transformerBuiltins[name] = fn;
      ctx.registerFn(name, fn);
    },

    /**
     * Unregisters a custom function.
     * @param {string} name - The name of the function to unregister.
     */

    unregisterFn: (name) => {
      delete transformerBuiltins[name];
      ctx.unregisterFn(name);
    },

    /**
     * Executes the JSON transformation.
     * @param {any} input - The input JSON data.
     * @param {object} compiledTemplate - The compiled template object from `compileTemplate()`.
     * @param {object} [opts] - Transformation runtime options.
     * @param {string} [opts.mode] - Override the instance mode ('strict' or 'permissive').
     * @returns {Promise<any>} The transformed output data.
     */

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
