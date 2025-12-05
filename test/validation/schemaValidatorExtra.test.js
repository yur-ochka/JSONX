import { validateSchema } from "../../src/core/validation/schemaValidator.js";

function run(schema, data, opts = {}) {
  return validateSchema(schema, data, opts);
}

describe("Extra coverage for schemaValidator", () => {
  test("boolean schema === false inside properties", () => {
    const schema = {
      type: "object",
      properties: {
        x: false,
      },
    };

    const result = run(schema, { x: 123 });

    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain("forbids");
  });

  test("nullable allows null", () => {
    const schema = { type: "string", nullable: true };
    expect(run(schema, null).valid).toBe(true);
  });

  test("type array supports multiple types", () => {
    const schema = { type: ["string", "number"] };
    expect(run(schema, 42).valid).toBe(true);
    expect(run(schema, "hi").valid).toBe(true);
    expect(run(schema, true).valid).toBe(false);
  });

  test("enum mismatch", () => {
    const schema = { enum: ["a", "b"] };
    expect(run(schema, "c").valid).toBe(false);
  });

  test("string min/max length and pattern", () => {
    expect(run({ type: "string", minLength: 3 }, "ab").valid).toBe(false);
    expect(run({ type: "string", maxLength: 3 }, "abcd").valid).toBe(false);
    expect(run({ type: "string", pattern: "^\\d+$" }, "abc").valid).toBe(false);
  });

  test("string formats", () => {
    expect(run({ type: "string", format: "email" }, "bad@").valid).toBe(false);
    expect(run({ type: "string", format: "date-time" }, "notdate").valid).toBe(
      false
    );
    expect(run({ type: "string", format: "uri" }, "::::").valid).toBe(false);
  });

  test("allowUnknownFormats skips validation", () => {
    const schema = { type: "string", format: "custom" };
    const res = run(schema, "value", { allowUnknownFormats: true });
    expect(res.valid).toBe(true);
  });

  test("number constraints", () => {
    expect(run({ type: "number", minimum: 5 }, 4).valid).toBe(false);
    expect(run({ type: "number", maximum: 5 }, 6).valid).toBe(false);
    expect(run({ type: "number", exclusiveMinimum: 10 }, 10).valid).toBe(false);
    expect(run({ type: "number", exclusiveMaximum: 10 }, 10).valid).toBe(false);
    expect(run({ type: "number", multipleOf: 3 }, 10).valid).toBe(false);
  });

  test("array constraints", () => {
    expect(run({ type: "array", minItems: 2 }, [1]).valid).toBe(false);
    expect(run({ type: "array", maxItems: 1 }, [1, 2]).valid).toBe(false);
    expect(run({ type: "array", uniqueItems: true }, [1, 1]).valid).toBe(false);
  });

  test("array additionalItems false", () => {
    const schema = {
      type: "array",
      items: [{ type: "number" }],
      additionalItems: false,
    };
    expect(run(schema, [1, 2]).valid).toBe(false);
  });

  test("array additionalItems schema", () => {
    const schema = {
      type: "array",
      items: [{ type: "string" }],
      additionalItems: { type: "number" },
    };
    expect(run(schema, ["ok", "bad"]).valid).toBe(false);
  });

  test("object required", () => {
    const schema = {
      type: "object",
      properties: { a: { type: "string" } },
      required: ["a", "b"],
    };
    expect(run(schema, { a: "test" }).valid).toBe(false);
  });

  test("patternProperties validation", () => {
    const schema = {
      type: "object",
      patternProperties: {
        "^x_": { type: "number" },
      },
    };
    expect(run(schema, { x_test: "nope" }).valid).toBe(false);
  });

  test("additionalProperties false", () => {
    const schema = {
      type: "object",
      properties: { a: { type: "string" } },
      additionalProperties: false,
    };
    expect(run(schema, { a: "ok", b: 1 }).valid).toBe(false);
  });

  test("additionalProperties schema", () => {
    const schema = {
      type: "object",
      properties: { a: { type: "string" } },
      additionalProperties: { type: "number" },
    };
    expect(run(schema, { a: "ok", b: "bad" }).valid).toBe(false);
  });

  test("oneOf mismatch", () => {
    const schema = {
      oneOf: [{ type: "string" }, { type: "number" }],
    };
    expect(run(schema, []).valid).toBe(false);
  });

  test("oneOf multiple matches", () => {
    const schema = {
      oneOf: [{ type: "object" }, { type: "object" }],
    };
    expect(run(schema, {}).valid).toBe(false);
  });

  test("anyOf mismatch", () => {
    const schema = {
      anyOf: [{ type: "string" }, { type: "number" }],
    };
    expect(run(schema, []).valid).toBe(false);
  });

  test("allOf combines failures", () => {
    const schema = {
      allOf: [{ type: "number" }, { minimum: 10 }],
    };
    expect(run(schema, 5).valid).toBe(false);
  });
});
