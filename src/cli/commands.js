import fs from "fs";
import path from "path";
import { createTransformer, compileTemplate } from "../index.js";

export function resolvePath(p) {
  return path.resolve(process.cwd(), p);
}

export function loadJSON(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export async function cmdTransform(args) {
  const template = loadJSON(args.template);
  const input = loadJSON(args.input);

  const transformer = createTransformer({ mode: args.mode || "permissive" });
  const compiled = compileTemplate(template);
  const output = await transformer.transform(input, compiled, args);

  const outStr = JSON.stringify(output, null, 2);

  if (args.output) {
    fs.writeFileSync(args.output, outStr, "utf8");
    console.log(`✔ Output saved to: ${args.output}`);
  } else {
    console.log(outStr);
  }
}

export function cmdValidate(args) {
  try {
    const template = loadJSON(args.template);
    compileTemplate(template);
    console.log("✔ Template is valid");
  } catch (e) {
    console.error("❌ Template validation error:", e.message);
    process.exit(1);
  }
}

export function cmdCompile(args) {
  const template = loadJSON(args.template);
  const compiled = compileTemplate(template);
  const outStr = JSON.stringify(compiled, null, 2);

  if (args.output) {
    fs.writeFileSync(args.output, outStr, "utf8");
    console.log(`✔ Compiled template saved to: ${args.output}`);
  } else {
    console.log(outStr);
  }
}

export async function cmdDebug(args) {
  console.log("🔧 Debug mode enabled");

  const template = loadJSON(args.template);
  const input = loadJSON(args.input);

  const transformer = createTransformer({ mode: "strict" });
  const compiled = compileTemplate(template);

  console.log("--- TEMPLATE ---");
  console.log(JSON.stringify(template, null, 2));

  console.log("--- INPUT ---");
  console.log(JSON.stringify(input, null, 2));

  console.log("--- OUTPUT ---");
  const output = await transformer.transform(input, compiled, {
    mode: "strict",
  });
  console.log(JSON.stringify(output, null, 2));
}
