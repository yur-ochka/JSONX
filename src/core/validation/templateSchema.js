export const templateSpecSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "JSONX Template Schema",
  type: "object",
  additionalProperties: false,
  properties: {
    templates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", minLength: 1 },
          match: { type: "string", minLength: 1 },
          output: {
            type: ["object", "array", "string", "number", "boolean", "null"],
          },
        },
        required: ["output"],
      },
    },
    root: {
      type: ["object", "array", "string", "number", "boolean", "null"],
    },
  },
  required: ["templates", "root"],

  definitions: {
    exprNode: {
      type: "object",
      properties: {
        expr: { type: "string" },
      },
      required: ["expr"],
      additionalProperties: false,
    },
    applyNode: {
      type: "object",
      properties: {
        apply: { type: "string" },
        from: { type: "string" },
      },
      required: ["apply"],
      additionalProperties: false,
    },
  },
};
