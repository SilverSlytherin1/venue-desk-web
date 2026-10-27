export type BodyPart = { text: string } | { url: string };

// Trailing punctuation belongs to the sentence, not to the link.
const URL_PATTERN = /(https?:\/\/[^\s<>"]*[^\s<>".,;:!?)])/;

/**
 * Splits a plain text message body into text and links, so a link can be rendered as an anchor
 * while everything else stays text. Nothing is ever interpreted as HTML.
 */
export function linkify(body: string): BodyPart[] {
  // With a capture group, `split` keeps each match as its own part.
  return body
    .split(URL_PATTERN)
    .filter((part) => part !== '')
    .map((part) => (URL_PATTERN.test(part) ? { url: part } : { text: part }));
}
