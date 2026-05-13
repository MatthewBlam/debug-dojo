// Debug Dojo design tokens — deep ink + cream + gold (palette 1).
// Sourced verbatim from the Claude Design handoff in project/tokens.jsx.

export const T = {
  bg: "#0d1117",
  panel: "#161b22",
  panel2: "#1b2129",
  panel3: "#21262d",
  editor: "#0a0e14",
  console: "#0e1218",

  line: "#21262d",
  lineSoft: "#1a1f26",
  lineStrong: "#2f3640",

  text: "#e6e1d6",
  textDim: "#a8a499",
  textMute: "#6e7681",
  textFaint: "#4a525d",

  gold: "#d4a857",
  goldDim: "rgba(212,168,87,0.18)",
  sage: "#7c9f6a",
  sageDim: "rgba(124,159,106,0.16)",
  red: "#c25b56",
  redDim: "rgba(194,91,86,0.16)",
  blue: "#7da9c9",
  blueDim: "rgba(125,169,201,0.14)",
  purple: "#b89cc9",

  syn: {
    kw: "#c89aca",
    fn: "#d4a857",
    str: "#9bb88a",
    num: "#d8a86a",
    cmt: "#5a6470",
    op: "#a8a499",
    self: "#c25b56",
    var: "#e6e1d6",
    cls: "#7da9c9",
    dec: "#c89858",
  },

  sans: '"Geist", "Manrope", -apple-system, sans-serif',
  mono: '"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace',
  serif: '"Instrument Serif", "Cormorant Garamond", Georgia, serif',
} as const;

export type DifficultyLevel = "Easy" | "Medium" | "Hard";
