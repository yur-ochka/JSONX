// TypeScript declaration file for JSONX public API

declare module "jsonx" {
  export interface TransformOptions {
    mode?: "permissive" | "strict";
    context?: Record<string, any>;
    start?: string;
  }

  export interface TemplateSpec {
    templates?: Array<{
      name?: string;
      match?: string;
      output: any;
    }>;
    root?: any;
  }

  export interface Transformer {
    registerFn(name: string, fn: (...args: any[]) => any): void;
    unregisterFn(name: string): void;
    transform(
      input: any,
      compiled: TemplateSpec,
      opts?: TransformOptions
    ): Promise<any>;
  }

  export function createTransformer(options?: TransformOptions): Transformer;
  export function compileTemplate(spec: TemplateSpec): TemplateSpec;
  export interface ParsedSelectorToken {
    type: "prop" | "index" | "wildcard";
    key?: string;
    index?: number;
  }

  export interface ParsedExprNode {
    type: "number" | "string" | "selector" | "identifier" | "call" | "pipe";
    value?: any;
    name?: string;
    args?: ParsedExprNode[];
    steps?: ParsedExprNode[];
  }

  export interface RuntimeContext {
    mode: "permissive" | "strict";
    registerFn(name: string, fn: (...args: any[]) => any): void;
    unregisterFn(name: string): void;
    getFn(name: string): any;
    evaluateExprString(expr: string, node: any, root: any): any;
  }

  export interface Template {
    name?: string;
    match?: string;
    output: any;
  }
}
