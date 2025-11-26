// Built‑in functions for expr runtime

export const builtins = {
  concat: (...args) => args.map((v) => (v == null ? "" : String(v))).join(""),
  join: (arr, sep = ",") => (Array.isArray(arr) ? arr.join(sep) : ""),
  uppercase: (s) => (s == null ? s : String(s).toUpperCase()),
  lowercase: (s) => (s == null ? s : String(s).toLowerCase()),
  default: (v, d) => (v == null ? d : v),
  coalesce: (...args) => args.find((a) => a != null),
  length: (v) =>
    Array.isArray(v) || typeof v === "string"
      ? v.length
      : v && typeof v === "object"
      ? Object.keys(v).length
      : 0,
  formatDate: (value, fmt = "YYYY-MM-DD") => {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d)) return null;
    const pad = (n) => n.toString().padStart(2, "0");
    return fmt
      .replace("YYYY", d.getFullYear())
      .replace("MM", pad(d.getMonth() + 1))
      .replace("DD", pad(d.getDate()))
      .replace("hh", pad(d.getHours()))
      .replace("mm", pad(d.getMinutes()))
      .replace("ss", pad(d.getSeconds()));
  },
};
