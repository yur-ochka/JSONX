// src/core/errors/errorSystem.js

export class JSONXError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = "JSONXError";
    this.code = code;
    this.context = context;
  }
}

export class SelectorError extends JSONXError {
  constructor(message, selector, path) {
    super(message, "SELECTOR_ERROR", { selector, path });
    this.name = "SelectorError";
  }
}

export class TemplateError extends JSONXError {
  constructor(message, templateName, node) {
    super(message, "TEMPLATE_ERROR", { templateName, node });
    this.name = "TemplateError";
  }
}

export class ExpressionError extends JSONXError {
  constructor(message, expression, context) {
    super(message, "EXPRESSION_ERROR", { expression, context });
    this.name = "ExpressionError";
  }
}

export class ValidationError extends JSONXError {
  constructor(message, schemaErrors = []) {
    super(message, "VALIDATION_ERROR", { schemaErrors });
    this.name = "ValidationError";
  }
}

// Error collector for permissive mode
export class ErrorCollector {
  constructor() {
    this.errors = [];
  }

  addError(error) {
    this.errors.push({
      message: error.message,
      code: error.code,
      context: error.context,
      stack: error.stack,
    });
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  getErrors() {
    return this.errors;
  }

  clear() {
    this.errors = [];
  }
}
