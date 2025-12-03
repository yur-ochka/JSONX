// Validates a template spec (object) against schema.json.

const path = require("path");
const fs = require("fs");
let Ajv;
try {
  Ajv = require("ajv");
} catch (e) {
  throw new Error(
    'Missing dependency "ajv". Install with: npm install ajv --save\n' +
      "validateTemplate requires Ajv to run JSON Schema validation."
  );
}

const schemaPath = path.join(__dirname, "schema.json");
const raw = fs.readFileSync(schemaPath, "utf8");
const schema = JSON.parse(raw);

// Create Ajv instance
const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  removeAdditional: false,
});

const validate = ajv.compile(schema);

function validateTemplate(spec) {
  const valid = validate(spec);
  if (valid) {
    return { valid: true, errors: null };
  }

  // Normalize errors into friendly objects
  const errors = (validate.errors || []).map((err) => {
    return {
      message: err.message,
      instancePath: err.instancePath,
      schemaPath: err.schemaPath,
      params: err.params,
    };
  });

  return { valid: false, errors };
}

module.exports = { validateTemplate };
