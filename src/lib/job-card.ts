export function jobCardExcerpt(description: string, maxLength = 190) {
  const clean = description
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
  const roleStart = clean.search(
    /\b(about the role|the opportunity|we(?:['’]re| are) looking for|what you['’]ll do|what you will do)\b/i,
  );
  const focused = roleStart > 80 ? clean.slice(roleStart) : clean;
  if (focused.length <= maxLength) return focused;

  const preview = focused.slice(0, maxLength + 1);
  const sentenceEnd = Math.max(
    preview.lastIndexOf(". "),
    preview.lastIndexOf("! "),
    preview.lastIndexOf("? "),
  );
  const wordEnd = preview.lastIndexOf(" ");
  const cutAt =
    sentenceEnd >= Math.floor(maxLength * 0.5) ? sentenceEnd + 1 : wordEnd;
  return `${preview.slice(0, Math.max(cutAt, 1)).trim()}…`;
}
