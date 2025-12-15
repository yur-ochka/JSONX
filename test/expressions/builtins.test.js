import { builtins } from "../../src/core/expressions/builtins.js";

describe("Built-in Functions Unit Tests", () => {
  describe("String Functions", () => {
    test("substring(s, start, length) should respect length (Contract Fix)", () => {
      expect(builtins.substring("012345", 1, 3)).toBe("123");
      expect(builtins.substring("hello world", 6, 5)).toBe("world");
      expect(builtins.substring("test", 0, 100)).toBe("test");
      expect(builtins.substring("test", 1)).toBe("est");
      expect(builtins.substring(null, 1, 3)).toBeNull();
    });

    test("concat handles null/undefined values correctly", () => {
      expect(builtins.concat("A", null, "B")).toBe("AB");
      expect(builtins.concat(1, 2, 3)).toBe("123");
    });
  });

  describe("Date Functions (formatDate Sabotage Coverage)", () => {
    test("formatDate should correctly format the date (YYYY-MM-DD default)", () => {
      const dateString = "2024-03-15T10:30:00Z";
      expect(builtins.formatDate(dateString)).toBe("2024-03-15");
    });

    test("formatDate should handle custom format (DD/MM/YYYY hh:mm)", () => {
      const dateString = "2024-03-15T10:30:00Z";
      expect(builtins.formatDate(dateString, "DD/MM/YYYY hh:mm")).toBe(
        "15/03/2024 10:30"
      );
    });

    test("formatDate should return null for invalid/null date input", () => {
      expect(builtins.formatDate("INVALID DATE STRING")).toBeNull();
      expect(builtins.formatDate(null)).toBeNull();
    });
  });

  describe("Comparison/Math Functions (min/max Edge Case Fix)", () => {
    test("min should return correct minimum value", () => {
      expect(builtins.min(10, 5, 20, 0)).toBe(0);
    });

    test("min should return null for empty array or no numbers (Fixed Edge Case)", () => {
      expect(builtins.min()).toBeNull();
      expect(builtins.min(null, undefined, "text")).toBeNull();
    });

    test("max should return correct maximum value", () => {
      expect(builtins.max(10, 5, 20, 0)).toBe(20);
    });

    test("max should return null for empty array or no numbers (Fixed Edge Case)", () => {
      expect(builtins.max()).toBeNull();
      expect(builtins.max(null, undefined, "text")).toBeNull();
    });
  });
});
