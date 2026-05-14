import { describe, expect, test } from "vitest";
import { countMeaningfulLetterCharacters, hasEnoughLetterContent } from "../utils/letterContent";

describe("letter content length", () => {
  test("counts Chinese, English, and numbers as meaningful content", () => {
    expect(countMeaningfulLetterCharacters("今天有一点开心")).toBe(7);
    expect(countMeaningfulLetterCharacters("I feel calm today 2026")).toBe(18);
    expect(hasEnoughLetterContent("I wrote a long letter about feeling calm today")).toBe(true);
  });

  test("ignores punctuation, spaces, and symbols for the short-content gate", () => {
    expect(hasEnoughLetterContent("......     !!!")).toBe(false);
    expect(hasEnoughLetterContent("hi")).toBe(false);
  });
});
