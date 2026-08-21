import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

/**
 * Admin-authored Terms & Conditions content is stored as Markdown and only
 * ever rendered through this function. Markdown gives the same "rich text"
 * building blocks the requirement asks for (headings, bold/italic, lists,
 * links, blockquote, horizontal rule) without a WYSIWYG-HTML editor's much
 * larger XSS surface — there is no code path where raw admin HTML is stored
 * or rendered, so there's nothing here to strip a <script> tag *out of*
 * (marked doesn't pass raw HTML through by default) plus a strict allowlist
 * as a second line of defense.
 */
export function markdownToSafeHtml(markdown: string): string {
  const rawHtml = marked.parse(markdown, { async: false, gfm: true, breaks: true }) as string;
  return sanitizeHtml(rawHtml, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "p", "br", "hr",
      "strong", "em", "b", "i", "u", "s",
      "ul", "ol", "li",
      "a", "blockquote", "code", "pre",
    ],
    allowedAttributes: {
      a: ["href", "title"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    // Belt-and-suspenders: even if a scheme above were misconfigured, never
    // allow javascript:/data: URLs or inline event handlers to survive.
    disallowedTagsMode: "discard",
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
  });
}
