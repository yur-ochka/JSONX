// debugging utilities for internal tracing

export const Debug = {
  enabled: false,

  enable() {
    this.enabled = true;
  },

  disable() {
    this.enabled = false;
  },

  log(...args) {
    if (this.enabled) console.log("[JSONX]", ...args);
  },

  traceSelector(selector, result) {
    if (!this.enabled) return;
    console.log(`[JSONX] selector: ${selector} ->`, result);
  },

  traceExpr(expr, result) {
    if (!this.enabled) return;
    console.log(`[JSONX] expr: ${expr} ->`, result);
  },

  traceTemplate(name, node) {
    if (!this.enabled) return;
    console.log(`[JSONX] apply template: ${name}`, node);
  },
};
