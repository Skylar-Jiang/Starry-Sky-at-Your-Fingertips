import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

describe("paper textarea layout", () => {
  test("uses inset-based width instead of inheriting the global textarea width", () => {
    const css = readFileSync("src/styles.css", "utf8");
    const rule = css.match(/\.paper-textarea\s*\{(?<body>[^}]+)\}/)?.groups?.body || "";

    expect(rule).toContain("inset: 24% 12% 30% 13%");
    expect(rule).toContain("width: auto");
    expect(rule).toContain("overflow-wrap: anywhere");
  });
});
