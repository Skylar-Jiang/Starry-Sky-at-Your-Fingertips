export const MIN_LETTER_CONTENT_LENGTH = 10;

export function countMeaningfulLetterCharacters(text = "") {
  return (String(text).match(/[\p{L}\p{N}]/gu) || []).length;
}

export function hasEnoughLetterContent(text = "") {
  return countMeaningfulLetterCharacters(text) >= MIN_LETTER_CONTENT_LENGTH;
}
