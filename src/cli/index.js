import {
  resolvePath,
  cmdTransform,
  cmdValidate,
  cmdCompile,
  cmdDebug,
} from "./commands.js";

function printHelp() {
  console.log(`
JSONX Transformer CLI
Usage:
  jsonx transform --template t.json --input data.json [--output out.json]
  jsonx validate --template t.json
  jsonx compile --template t.json --output compiled.json
  jsonx debug --template t.json --input data.json

Flags:
  --template <file>   Path to template JSON
  --input <file>      Path to input JSON
  --output <file>     Path to output JSON
  --strict            Strict mode
  --help              Show this help
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const cmd = args.shift();

  const out = { command: cmd };

  while (args.length) {
    const a = args.shift();
    if (a === "--template") out.template = resolvePath(args.shift());
    else if (a === "--input") out.input = resolvePath(args.shift());
    else if (a === "--output") out.output = resolvePath(args.shift());
    else if (a === "--strict") out.mode = "strict";
    else if (a === "--help") out.help = true;
  }
  return out;
}

async function main() {
  const args = parseArgs();

  if (!args.command || args.help) return printHelp();

  try {
    switch (args.command) {
      case "transform":
        return await cmdTransform(args);
      case "validate":
        return cmdValidate(args);
      case "compile":
        return cmdCompile(args);
      case "debug":
        return await cmdDebug(args);
      default:
        console.error(`Unknown command: ${args.command}`);
        printHelp();
    }
  } catch (e) {
    console.error("❌ JSONX CLI Error:", e.message);
    process.exit(1);
  }
}

main();
