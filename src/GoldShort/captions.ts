import { GOLD_SHORT_STYLE } from "./style";

export type Word = { text: string; startMs: number; endMs: number };
export type Page = { words: Word[]; startMs: number; endMs: number };

export const makePages = (words: Word[], clipEndMs: number): Page[] => {
  const groups: Word[][] = [];
  let group: Word[] = [];
  for (const word of words) {
    if (word.startMs >= clipEndMs) break;
    const previous = group[group.length - 1];
    // Segensformel (ﷺ) bleibt immer an dem Wort davor, nie allein am Zeilenanfang.
    const attachToPrevious = /^[\uFDFA]/.test(word.text.trim());
    const length = [...group, word].map((w) => w.text.trim()).join(" ").length;
    if (
      previous &&
      !attachToPrevious &&
      (group.length >= GOLD_SHORT_STYLE.captions.maxWords ||
        length > GOLD_SHORT_STYLE.captions.maxCharacters ||
        word.startMs - previous.endMs >
          GOLD_SHORT_STYLE.captions.breakOnSilenceMs ||
        /[,;:.!?]$/.test(previous.text))
    ) {
      groups.push(group);
      group = [];
    }
    group.push(word);
  }
  if (group.length) groups.push(group);
  return groups.map((g, i) => ({
    words: g,
    startMs: g[0].startMs,
    endMs: Math.min(
      g[g.length - 1].endMs + GOLD_SHORT_STYLE.captions.holdAfterWordMs,
      groups[i + 1]?.[0].startMs ?? clipEndMs,
      clipEndMs,
    ),
  }));
};
