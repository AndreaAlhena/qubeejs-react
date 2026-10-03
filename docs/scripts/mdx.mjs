/**
 * Escape markdown for MDX.
 *
 * Outside inline code and fenced blocks, `<`, `>`, `{` and `}` become character
 * references, so prose from JSDoc or the changelog — "`<QubeeProvider>` wraps
 * the tree", "returns { uri, headers }" — reads as text instead of being parsed
 * as JSX or an expression.
 *
 * @param {string} markdown - Markdown from a comment or the changelog
 * @returns {string} The same markdown, safe to embed in an .mdx page
 */
export function mdx(markdown) {
  return markdown
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((part, index) =>
      index % 2 === 1 ? part : part.replace(/[<>{}]/g, (character) => `&#${character.charCodeAt(0)};`)
    )
    .join('');
}
