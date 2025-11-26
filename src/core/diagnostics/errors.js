// Custom error classes for diagnostics and strict mode

export class SelectorError extends Error {
  constructor(message, selector) {
    super(message);
    this.name = "SelectorError";
    this.selector = selector;
  }
}

export class TemplateError extends Error {
  constructor(message, templateName) {
    super(message);
    this.name = "TemplateError";
    this.templateName = templateName;
  }
}

export class ExprError extends Error {
  constructor(message, expr) {
    super(message);
    this.name = "ExprError";
    this.expr = expr;
  }
}
