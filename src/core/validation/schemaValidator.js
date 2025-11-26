// Small strict JSON Schema validator
// Returns { valid: boolean, errors: Array<{path, message}> }

function pushErr(errors, path, message) {
  errors.push({ path: path || "$", message });
}

function isObject(x) {
  return x && typeof x === "object" && !Array.isArray(x);
}

function checkType(value, expected) {
  if (expected === "null") return value === null;
  if (expected === "array") return Array.isArray(value);
  if (expected === "integer") return Number.isInteger(value);
  return typeof value === expected;
}

function matchFormat(format, value) {
  if (typeof value !== "string") return false;
  switch (format) {
    case "date-time":
      return !Number.isNaN(Date.parse(value));
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case "uri":
      try {
        new URL(value);
        return true;
      } catch (e) {
        return false;
      }
    default:
      return true;
  }
}

export function validateSchema(schema, data, opts = {}) {
  const errors = [];
  const rootSchema = schema || {};
  const mode = opts.mode || "strict";
  const allowUnknownFormats = opts.allowUnknownFormats === true;

  function validate(schemaNode, value, path) {
    if (schemaNode && schemaNode.nullable && value === null) return;

    if (typeof schemaNode === "boolean") {
      if (schemaNode === false)
        pushErr(errors, path, "Schema explicitly forbids this value");
      return;
    }
    if (!schemaNode || typeof schemaNode !== "object") return;

    if (schemaNode.type) {
      const expected = schemaNode.type;
      if (Array.isArray(expected)) {
        const ok = expected.some((t) => checkType(value, t));
        if (!ok)
          pushErr(
            errors,
            path,
            `Type mismatch: expected one of [${expected.join(", ")}]`
          );
      } else {
        if (!checkType(value, expected)) {
          pushErr(errors, path, `Type mismatch: expected ${expected}`);
          return;
        }
      }
    }

    if (schemaNode.enum) {
      const ok = schemaNode.enum.some((e) => {
        return e === value;
      });
      if (!ok)
        pushErr(
          errors,
          path,
          `Value not in enum: ${JSON.stringify(schemaNode.enum)}`
        );
    }

    if (typeof value === "string") {
      if (schemaNode.minLength != null && value.length < schemaNode.minLength) {
        pushErr(
          errors,
          path,
          `String shorter than minLength ${schemaNode.minLength}`
        );
      }
      if (schemaNode.maxLength != null && value.length > schemaNode.maxLength) {
        pushErr(
          errors,
          path,
          `String longer than maxLength ${schemaNode.maxLength}`
        );
      }
      if (schemaNode.pattern) {
        const re = new RegExp(schemaNode.pattern);
        if (!re.test(value))
          pushErr(
            errors,
            path,
            `String does not match pattern ${schemaNode.pattern}`
          );
      }
      if (schemaNode.format) {
        if (!allowUnknownFormats && !matchFormat(schemaNode.format, value)) {
          pushErr(
            errors,
            path,
            `String does not match format ${schemaNode.format}`
          );
        } else if (
          allowUnknownFormats &&
          schemaNode.format &&
          !matchFormat(schemaNode.format, value)
        ) {
        }
      }
    }

    if (typeof value === "number") {
      if (schemaNode.minimum != null && value < schemaNode.minimum) {
        pushErr(errors, path, `Number less than minimum ${schemaNode.minimum}`);
      }
      if (schemaNode.maximum != null && value > schemaNode.maximum) {
        pushErr(
          errors,
          path,
          `Number greater than maximum ${schemaNode.maximum}`
        );
      }
      if (
        schemaNode.exclusiveMinimum != null &&
        value <= schemaNode.exclusiveMinimum
      ) {
        pushErr(
          errors,
          path,
          `Number <= exclusiveMinimum ${schemaNode.exclusiveMinimum}`
        );
      }
      if (
        schemaNode.exclusiveMaximum != null &&
        value >= schemaNode.exclusiveMaximum
      ) {
        pushErr(
          errors,
          path,
          `Number >= exclusiveMaximum ${schemaNode.exclusiveMaximum}`
        );
      }
      if (
        schemaNode.multipleOf != null &&
        value % schemaNode.multipleOf !== 0
      ) {
        pushErr(
          errors,
          path,
          `Number is not a multipleOf ${schemaNode.multipleOf}`
        );
      }
    }

    if (Array.isArray(value)) {
      if (schemaNode.minItems != null && value.length < schemaNode.minItems) {
        pushErr(
          errors,
          path,
          `Array has fewer items than minItems ${schemaNode.minItems}`
        );
      }
      if (schemaNode.maxItems != null && value.length > schemaNode.maxItems) {
        pushErr(
          errors,
          path,
          `Array has more items than maxItems ${schemaNode.maxItems}`
        );
      }
      if (schemaNode.uniqueItems) {
        const seen = new Set();
        for (const it of value) {
          const key = JSON.stringify(it);
          if (seen.has(key)) {
            pushErr(
              errors,
              path,
              "Array has duplicate items but uniqueItems is true"
            );
            break;
          }
          seen.add(key);
        }
      }
      if (schemaNode.items) {
        if (Array.isArray(schemaNode.items)) {
          for (let i = 0; i < schemaNode.items.length; i++) {
            validate(schemaNode.items[i], value[i], `${path}[${i}]`);
          }
          if (
            schemaNode.additionalItems === false &&
            value.length > schemaNode.items.length
          ) {
            pushErr(errors, path, "Additional array items are not allowed");
          } else if (isObject(schemaNode.additionalItems)) {
            for (let i = schemaNode.items.length; i < value.length; i++) {
              validate(schemaNode.additionalItems, value[i], `${path}[${i}]`);
            }
          }
        } else {
          for (let i = 0; i < value.length; i++) {
            validate(schemaNode.items, value[i], `${path}[${i}]`);
          }
        }
      }
    }

    if (isObject(value)) {
      const props = schemaNode.properties || {};
      const required = schemaNode.required || [];
      for (const req of required) {
        if (!(req in value))
          pushErr(
            errors,
            path ? `${path}.${req}` : req,
            "Required property missing"
          );
      }
      for (const [k, v] of Object.entries(props)) {
        if (k in value) {
          validate(v, value[k], path ? `${path}.${k}` : k);
        }
      }

      if (schemaNode.patternProperties) {
        for (const [pat, sch] of Object.entries(schemaNode.patternProperties)) {
          const re = new RegExp(pat);
          for (const key of Object.keys(value)) {
            if (re.test(key))
              validate(sch, value[key], path ? `${path}.${key}` : key);
          }
        }
      }

      if (schemaNode.additionalProperties === false) {
        for (const key of Object.keys(value)) {
          if (!(key in props)) {
            let allowed = false;
            if (schemaNode.patternProperties) {
              for (const pat of Object.keys(schemaNode.patternProperties)) {
                if (new RegExp(pat).test(key)) {
                  allowed = true;
                  break;
                }
              }
            }
            if (!allowed)
              pushErr(
                errors,
                path ? `${path}.${key}` : key,
                "Additional property not allowed"
              );
          }
        }
      } else if (isObject(schemaNode.additionalProperties)) {
        for (const key of Object.keys(value)) {
          if (!(key in props))
            validate(
              schemaNode.additionalProperties,
              value[key],
              path ? `${path}.${key}` : key
            );
        }
      }
    }

    if (schemaNode.oneOf && Array.isArray(schemaNode.oneOf)) {
      let matchCount = 0;
      const prevErrors = errors.length;
      for (const sub of schemaNode.oneOf) {
        const snapshot = errors.length;
        validate(sub, value, path);
        if (errors.length === snapshot) matchCount++;
        errors.length = snapshot;
      }
      if (matchCount !== 1)
        pushErr(
          errors,
          path,
          `Value must match exactly one schema in oneOf (matched ${matchCount})`
        );
    }

    if (schemaNode.anyOf && Array.isArray(schemaNode.anyOf)) {
      let matched = false;
      const snapshot = errors.length;
      for (const sub of schemaNode.anyOf) {
        const before = errors.length;
        validate(sub, value, path);
        if (errors.length === before) {
          matched = true;
          break;
        }
        errors.length = before;
      }
      if (!matched)
        pushErr(errors, path, "Value must match at least one schema in anyOf");
    }

    if (schemaNode.allOf && Array.isArray(schemaNode.allOf)) {
      for (const sub of schemaNode.allOf) validate(sub, value, path);
    }
  }

  validate(rootSchema, data, "");

  return { valid: errors.length === 0, errors };
}
