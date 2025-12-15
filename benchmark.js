import { transformDirect } from "./src/index.js";
import fs from "fs";
import path from "path";

function generateData(count) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push({
      id: i,
      firstName: "User",
      lastName: i.toString().padStart(5, "0"),
      email: `user${i}@example.com`,
      registrationDate: new Date(Date.now() - i * 86400000).toISOString(),
      price: Math.floor(Math.random() * 1000),
    });
  }
  return { users, total: count };
}

const benchmarkTemplate = {
  templates: [
    {
      name: "userItem",
      output: {
        id: "$.id",
        fullName: { expr: "concat($.firstName, ' ', $.lastName)" },
        normalizedEmail: { expr: "lowercase($.email)" },
        joinDate: { expr: "formatDate($.registrationDate, 'YYYY-MM-DD')" },
        discountPrice: { expr: "subtract($.price, 10)" },
      },
    },
  ],
  root: {
    total: "$.total",
    transformedUsers: { apply: "userItem", from: "$.users" },
  },
};

const DATA_SIZES = [1000, 10000, 100000];
const CSV_FILE = path.join(process.cwd(), "benchmark_results.csv");

async function runBenchmark() {
  const results = [];
  console.log("Starting JSONX performance benchmark...");

  results.push(["Data Size", "Time (ms)", "Heap Used (MB)", "Heap Total (MB)"]);

  for (const size of DATA_SIZES) {
    const data = generateData(size);

    if (global.gc) global.gc();

    const startMemory = process.memoryUsage();
    const startTime = process.hrtime.bigint();

    try {
      await transformDirect(data, benchmarkTemplate, { mode: "permissive" });
    } catch (error) {
      console.error(`Error running benchmark for size ${size}:`, error.message);
      continue;
    }

    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();

    const durationMs = Number(endTime - startTime) / 1000000;
    const heapUsedMB = (endMemory.heapUsed / 1024 / 1024).toFixed(2);
    const heapTotalMB = (endMemory.heapTotal / 1024 / 1024).toFixed(2);

    console.log(
      `✅ Size: ${size} | Time: ${durationMs.toFixed(
        2
      )}ms | Mem Used: ${heapUsedMB}MB`
    );
    results.push([size, durationMs.toFixed(2), heapUsedMB, heapTotalMB]);
  }

  const csvContent = results.map((row) => row.join(",")).join("\n");
  fs.writeFileSync(CSV_FILE, csvContent, "utf8");
  console.log(`\nBenchmark complete. Results written to ${CSV_FILE}`);
}

runBenchmark();
