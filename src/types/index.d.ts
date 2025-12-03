// types/index.d.ts

export interface TransformOptions {
  mode?: "permissive" | "strict";
  context?: Record<string, any>;
  start?: string;
}

export interface CompiledTemplate {
  // Internal structure, but exported for TypeScript
  _compiled: true;
}

export interface Transformer {
  registerFn(name: string, fn: (...args: any[]) => any): void;
  unregisterFn(name: string): void;
  transform(
    input: any,
    compiled: CompiledTemplate | object,
    opts?: TransformOptions
  ): Promise<any>;
}

export interface TemplateSpec {
  templates?: Array<{
    name?: string;
    match?: string;
    output: any;
  }>;
  root: any;
}

export interface ExpressionNode {
  expr: string;
}

export interface ApplyNode {
  apply: string;
  from?: string;
}

// Main API
export function createTransformer(options?: {
  mode?: "permissive" | "strict";
}): Transformer;
export function compileTemplate(spec: TemplateSpec): CompiledTemplate;
export function transform(
  input: any,
  templateSpec: TemplateSpec | CompiledTemplate,
  opts?: TransformOptions
): Promise<any>;

// Built-in functions
export const builtins: {
  concat: (...args: any[]) => string;
  join: (arr: any[], sep?: string) => string;
  uppercase: (s: string) => string;
  lowercase: (s: string) => string;
  default: (v: any, d: any) => any;
  coalesce: (...args: any[]) => any;
  length: (v: any) => number;
  formatDate: (value: any, format?: string) => string | null;
};
