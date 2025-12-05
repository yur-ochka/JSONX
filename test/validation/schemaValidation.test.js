import { compileTemplate } from "../../src/index.js";
import { validateSchema } from "../../src/core/validation/schemaValidator.js";
import { templateSpecSchema } from "../../src/core/validation/templateSchema.js";

describe("Schema Validation Tests", () => {
  test("valid template passes validation", () => {
    const template = {
      templates: [
        {
          name: "user",
          output: {
            id: "$.id",
            name: "$.name",
          },
        },
      ],
      root: {
        users: { apply: "user", from: "$.users" },
      },
    };

    const result = validateSchema(templateSpecSchema, template);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("template with expression node", () => {
    const template = {
      templates: [
        {
          name: "user",
          output: {
            fullName: { expr: "concat($.firstName, ' ', $.lastName)" },
          },
        },
      ],
      root: {},
    };

    const result = validateSchema(templateSpecSchema, template);
    expect(result.valid).toBe(true);
  });

  test("template with apply node", () => {
    const template = {
      templates: [
        {
          name: "address",
          output: {
            city: "$.city",
          },
        },
        {
          name: "user",
          output: {
            address: { apply: "address", from: "$.address" },
          },
        },
      ],
      root: {},
    };

    const result = validateSchema(templateSpecSchema, template);
    expect(result.valid).toBe(true);
  });

  test("invalid template type", () => {
    const result = validateSchema(templateSpecSchema, "not an object");
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain("Type mismatch");
  });

  test("template missing required fields", () => {
    const template = {
      // Missing templates and root
    };

    const result = validateSchema(templateSpecSchema, template);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("Required"))).toBe(
      true
    );
  });

  test("template with additional properties", () => {
    const template = {
      templates: [],
      root: {},
      extraProperty: "should not be allowed",
    };

    const result = validateSchema(templateSpecSchema, template);
    expect(result.valid).toBe(false);
  });

  test("template item validation", () => {
    const template = {
      templates: [
        {
          name: 123, // Invalid: should be string
          output: {},
        },
      ],
      root: {},
    };

    const result = validateSchema(templateSpecSchema, template);
    expect(result.valid).toBe(false);
  });

  test("compileTemplate validates schema", () => {
    const validTemplate = {
      templates: [
        {
          name: "test",
          output: {},
        },
      ],
      root: {},
    };

    expect(() => compileTemplate(validTemplate)).not.toThrow();

    const invalidTemplate = {
      // Missing required fields
    };

    expect(() => compileTemplate(invalidTemplate)).toThrow();
  });
});
