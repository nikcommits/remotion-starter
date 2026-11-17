// Approved GoldShort design. Keep future clip-specific content out of this file.
export const GOLD_SHORT_STYLE = {
  width: 1080,
  height: 1920,
  fps: 30,
  fontName: "GoldShortArial",
  fontFamily: "GoldShortArial, Arial, sans-serif",
  fontFile: "wisam-arial-bold.ttf",
  colors: {
    highlight: "#f3cf83",
    text: "#ffffff",
    activeText: "#17201f",
    background: "#101817",
  },
  captions: {
    top: 1310,
    left: 76,
    width: 850,
    minHeight: 210,
    fontSize: 76,
    lineHeight: 1.25,
    maxWords: 4,
    maxCharacters: 36,
    breakOnSilenceMs: 420,
    holdAfterWordMs: 280,
  },
  badge: { top: 335, left: 84, fontSize: 30 },
  steps: { rowTop: 1120, gridTop: 1095, gridWidth: 900, fontSize: 52, gap: 20 },
  zoom: { amount: 0.07, drift: 0.015, originY: 32 },
  topics: { top: 165, left: 84, width: 830, kickerSize: 26, titleSize: 55 },
  overlay:
    "linear-gradient(180deg, rgba(0,0,0,0.48) 0%, transparent 27%, transparent 56%, rgba(0,0,0,0.2) 66%, rgba(0,0,0,0.72) 87%, rgba(0,0,0,0.85) 100%)",
} as const;
