import sanitizeHtml from "sanitize-html";

const allowedTags = [
  ...sanitizeHtml.defaults.allowedTags,
  "article",
  "aside",
  "caption",
  "figure",
  "figcaption",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "img",
  "section",
  "span",
  "style",
  "svg",
  "path",
  "circle",
  "rect",
  "line",
  "polyline",
  "polygon",
  "g",
  "defs",
  "linearGradient",
  "stop",
  "text",
];

const allowedAttributes: sanitizeHtml.IOptions["allowedAttributes"] = {
  ...sanitizeHtml.defaults.allowedAttributes,
  "*": ["class", "id", "aria-label", "aria-hidden", "role"],
  a: ["href", "name", "target", "rel", "title"],
  img: ["src", "srcset", "alt", "title", "width", "height", "loading"],
  svg: ["viewBox", "width", "height", "fill", "stroke", "xmlns"],
  path: ["d", "fill", "stroke", "stroke-width", "opacity"],
  circle: ["cx", "cy", "r", "fill", "stroke", "opacity"],
  rect: ["x", "y", "width", "height", "rx", "fill", "stroke", "opacity"],
  line: ["x1", "y1", "x2", "y2", "stroke", "stroke-width", "opacity"],
  polyline: ["points", "fill", "stroke", "stroke-width", "opacity"],
  polygon: ["points", "fill", "stroke", "stroke-width", "opacity"],
  g: ["fill", "stroke", "opacity", "transform"],
  linearGradient: ["id", "x1", "y1", "x2", "y2"],
  stop: ["offset", "stop-color", "stop-opacity"],
  text: ["x", "y", "dx", "dy", "fill", "transform", "text-anchor", "dominant-baseline"],
};

export function sanitizeCmsHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes,
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
    },
    parser: {
      // SVG attributes are case-sensitive. In particular, lower-casing viewBox
      // makes sanitize-html drop it and leaves charts in the browser's default
      // 300x150 viewport.
      lowerCaseAttributeNames: false,
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}
