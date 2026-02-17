/**
 * Strip markdown formatting symbols for plain text output.
 */
export function stripMarkdown(text: string): string {
  return text
    // Remove headings
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italic
    .replace(/\*{1,3}(.*?)\*{1,3}/g, "$1")
    .replace(/_{1,3}(.*?)_{1,3}/g, "$1")
    // Remove strikethrough
    .replace(/~~(.*?)~~/g, "$1")
    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, (match) => {
      return match.replace(/```\w*\n?/g, "").replace(/```/g, "");
    })
    // Remove links, keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    // Remove blockquotes
    .replace(/^>\s+/gm, "")
    // Remove unordered list markers
    .replace(/^\s*[-*+]\s+/gm, "")
    // Remove ordered list markers
    .replace(/^\s*\d+\.\s+/gm, "")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, "")
    .trim();
}
