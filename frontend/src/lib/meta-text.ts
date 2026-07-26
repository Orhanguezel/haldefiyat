function normalized(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function compactMetaText(value: string, maxLength: number): string {
  const text = normalized(value);
  if (text.length <= maxLength) return text;

  const sentence = text.slice(0, maxLength + 1).match(/^(.{1,})([.!?])(?:\s|$)/u);
  if (sentence && sentence[0].length >= Math.floor(maxLength * 0.65)) {
    return sentence[0].trim();
  }

  const clipped = text.slice(0, maxLength - 1);
  const wordBoundary = clipped.lastIndexOf(" ");
  const body = wordBoundary >= Math.floor(maxLength * 0.65)
    ? clipped.slice(0, wordBoundary)
    : clipped;
  return `${body.replace(/[\s,;:—-]+$/u, "")}…`;
}

export function compactMetaTitle(value: string): string {
  return compactMetaText(value, 60);
}

export function compactMetaDescription(value: string): string {
  return compactMetaText(value, 160);
}
