// Complete built-in functions

export const builtins = {
  // String functions
  concat: (...args) => args.map((v) => (v == null ? "" : String(v))).join(""),
  join: (arr, sep = ",") =>
    Array.isArray(arr) ? arr.map(String).join(sep) : "",
  uppercase: (s) => (s == null ? s : String(s).toUpperCase()),
  lowercase: (s) => (s == null ? s : String(s).toLowerCase()),
  trim: (s) => (s == null ? s : String(s).trim()),
  substring: (s, start, length) =>
    s == null ? s : String(s).substring(start, length),

  // Math functions
  add: (a, b) => (a || 0) + (b || 0),
  subtract: (a, b) => (a || 0) - (b || 0),
  multiply: (a, b) => (a || 0) * (b || 0),
  divide: (a, b) => (a || 0) / (b || 0),
  round: (n, precision = 0) => {
    const factor = Math.pow(10, precision);
    return Math.round((n || 0) * factor) / factor;
  },

  // Logic functions
  default: (v, d) => (v == null ? d : v),
  coalesce: (...args) => args.find((a) => a != null),
  equals: (a, b) => a === b,
  not: (v) => !v,
  and: (...args) => args.every(Boolean),
  or: (...args) => args.some(Boolean),

  // Comparison functions
  greaterThan: (a, b) => a > b,
  lessThan: (a, b) => a < b,
  greaterThanOrEqual: (a, b) => a >= b,
  lessThanOrEqual: (a, b) => a <= b,

  max: (...args) => {
    const numbers = args.filter((a) => a != null && typeof a === "number");
    return numbers.length > 0 ? Math.max(...numbers) : 0;
  },
  min: (...args) => {
    const numbers = args.filter((a) => a != null && typeof a === "number");
    return numbers.length > 0 ? Math.min(...numbers) : 0;
  },

  // Array functions
  length: (v) => {
    if (v == null) return 0;
    if (Array.isArray(v)) return v.length;
    if (typeof v === "string") return v.length;
    if (typeof v === "object") return Object.keys(v).length;
    return 0;
  },
  map: (arr, fn) => (Array.isArray(arr) ? arr.map(fn) : []),
  filter: (arr, fn) => (Array.isArray(arr) ? arr.filter(fn) : []),
  find: (arr, fn) => (Array.isArray(arr) ? arr.find(fn) : null),

  // Date functions
  formatDate: (value, fmt = "YYYY-MM-DD") => {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;

    const pad = (n) => n.toString().padStart(2, "0");

    return fmt
      .replace("YYYY", d.getFullYear())
      .replace("MM", pad(d.getMonth() + 1))
      .replace("DD", pad(d.getDate()))
      .replace("hh", pad(d.getHours()))
      .replace("mm", pad(d.getMinutes()))
      .replace("ss", pad(d.getSeconds()));
  },
  now: () => new Date().toISOString(),

  // Type checking
  isArray: (v) => Array.isArray(v),
  isObject: (v) => v && typeof v === "object" && !Array.isArray(v),
  isString: (v) => typeof v === "string",
  isNumber: (v) => typeof v === "number" && !isNaN(v),
  isBoolean: (v) => typeof v === "boolean",
};
