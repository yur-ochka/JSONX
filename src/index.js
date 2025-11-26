// Public API export layer for JSONX

import { transform } from "./core/engine/transform.js";
import { createRuntimeContext } from "./core/engine/runtimeContext.js";
import { builtins } from "./core/expressions/builtins.js";

export function compileTemplate(spec) {
  if (!spec || typeof spec !== "object")
    throw new Error("Invalid template spec");
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
