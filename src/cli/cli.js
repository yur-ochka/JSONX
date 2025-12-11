#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createTransformer, compileTemplate } from "../index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function showHelp() {
  console.log(`
JSONX CLI - XSLT-like JSON Transformer

Usage:
  jsonx transform --template <file> --input <file> [--output <file>] [--strict]
  jsonx validate --template <file>
  jsonx compile --template <file> [--output <file>]
  jsonx debug --template <file> --input <file>

Commands:
  transform   Transform input JSON using template
  validate    Validate template specification
  compile     Compile template and show compiled spec
  debug       Show debugging information for transformation

Options:
  --template, -t   Template specification file (JSON/JS)
  --input, -i      Input JSON file
  --output, -o     Output file (default: stdout)
  --strict         Enable strict mode (default: permissive)
  --help, -h       Show this help message

Examples:
  jsonx transform -t template.json -i data.json -o result.json
  jsonx validate -t template.json
  jsonx debug -t template.json -i data.json
  `);
}

function loadJSON(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse JSON file ${filePath}: ${error.message}`);
  }
}

function writeOutput(output, filePath) {
  const outputStr = JSON.stringify(output, null, 2);

  if (filePath) {
    fs.writeFileSync(filePath, outputStr, "utf8");
    console.log(`✅ Output written to: ${filePath}`);
  } else {
    console.log(outputStr);
  }
}

async function commandTransform(args) {
  if (!args.template || !args.input) {
    throw new Error("transform command requires --template and --input");
  }

  const template = loadJSON(args.template);
  const input = loadJSON(args.input);

  const transformer = createTransformer();
  const compiled = compileTemplate(template);

  const output = await transformer.transform(input, compiled, {
    mode: args.strict ? "strict" : "permissive",
  });

  writeOutput(output, args.output);
}

function commandValidate(args) {
  if (!args.template) {
    throw new Error("validate command requires --template");
  }

  const template = loadJSON(args.template);

  try {
    compileTemplate(template);
    console.log("✅ Template is valid");
  } catch (error) {
    console.error("❌ Template validation failed:", error.message);
    process.exit(1);
  }
}

function commandCompile(args) {
  if (!args.template) {
    throw new Error("compile command requires --template");
  }

  const template = loadJSON(args.template);
  const compiled = compileTemplate(template);

  writeOutput(compiled, args.output);
}

async function commandDebug(args) {
  if (!args.template || !args.input) {
    throw new Error("debug command requires --template and --input");
  }

  const template = loadJSON(args.template);
  const input = loadJSON(args.input);

  console.log("🔍 JSONX Debug Mode");
  console.log("==================\n");

  console.log("📋 Template Specification:");
  console.log(JSON.stringify(template, null, 2));

  console.log("\n📥 Input Data:");
  console.log(JSON.stringify(input, null, 2));

  const transformer = createTransformer();
  const compiled = compileTemplate(template);

  console.log("\n🛠️ Compiled Template:");
  console.log(JSON.stringify(compiled, null, 2));

  console.log("\n📤 Transformation Result:");
  try {
    const output = await transformer.transform(input, compiled, {
      mode: "strict",
    });
    console.log(JSON.stringify(output, null, 2));
  } catch (error) {
    console.error("❌ Transformation failed:", error.message);
    console.error("\nStack trace:", error.stack);
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    switch (arg) {
      case "transform":
      case "validate":
      case "compile":
      case "debug":
        if (!result.command) {
          result.command = arg;
        } else {
          throw new Error(
            `Multiple commands specified: ${result.command} and ${arg}`
          );
        }
        break;
      case "--template":
      case "-t":
        if (i + 1 >= args.length) {
          throw new Error(`Missing value for option: ${arg}`);
        }
        result.template = args[++i];
        break;
      case "--input":
      case "-i":
        if (i + 1 >= args.length) {
          throw new Error(`Missing value for option: ${arg}`);
        }
        result.input = args[++i];
        break;
      case "--output":
      case "-o":
        if (i + 1 >= args.length) {
          throw new Error(`Missing value for option: ${arg}`);
        }
        result.output = args[++i];
        break;
      case "--strict":
        result.strict = true;
        break;
      case "--help":
      case "-h":
        result.help = true;
        break;
      default:
        if (arg.startsWith("-")) {
          throw new Error(`Unknown option: ${arg}`);
        } else if (!result.command) {
          result.command = arg;
        } else {
          throw new Error(`Unexpected argument: ${arg}`);
        }
    }

    i++;
  }

  return result;
}

async function main() {
  try {
    const args = parseArgs();

    if (args.help || !args.command) {
      showHelp();
      return;
    }

    switch (args.command) {
      case "transform":
        await commandTransform(args);
        break;
      case "validate":
        commandValidate(args);
        break;
      case "compile":
        commandCompile(args);
        break;
      case "debug":
        await commandDebug(args);
        break;
      default:
        console.error(`Unknown command: ${args.command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { main };
