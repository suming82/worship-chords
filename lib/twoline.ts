// lib/twoline.ts

// 1) Normalize Word paste: CRLF->LF, tabs->N spaces, NBSP/full-width->space
function normalizeWordPasteLine(line: string, tabSize: number) {
  const tabSpaces = " ".repeat(Math.max(1, tabSize));
  return line
    .replace(/\u00A0/g, " ") // NBSP
    .replace(/\u3000/g, " ") // full-width space
    .replace(/\t/g, tabSpaces);
}

// Conservative chord token regex (covers common forms)
const CHORD_RE =
  /[A-G](?:#|b)?(?:maj7|m7b5|m7|maj9|add9|sus2|sus4|dim|aug|m|7|9|11|13)?(?:\/[A-G](?:#|b)?)?/g;

// Compute an effective tabSize so that THE LAST chord aligns to the LAST non-space lyric grapheme.
// Falls back to defaultTab if there are no tabs before the last chord.
function autoTabSizeForLine(chordRaw: string, lyric: string, defaultTab: number) {
  // trim trailing spaces so "last" means last visible char (e.g., 里)
  const lyricTrimmed = lyric.replace(/\s+$/, "");
  const lastLyricIdx = Math.max(0, Array.from(lyricTrimmed).length - 1);

  const tokens = [...chordRaw.matchAll(CHORD_RE)];
  if (tokens.length === 0) return defaultTab;

  const lastTok = tokens[tokens.length - 1];
  const pos = lastTok.index ?? 0;
  const before = chordRaw.slice(0, pos);
  const tabsBefore = (before.match(/\t/g) || []).length;
  const baseCharsBefore = before.length - tabsBefore; // count all non-tab chars

  if (tabsBefore <= 0) return defaultTab;

  // Solve: base + tabs*t = lastLyricIdx  =>  t ~= (lastLyricIdx - base) / tabs
  const est = Math.round((lastLyricIdx - baseCharsBefore) / tabsBefore);
  // Clamp to a reasonable range
  return Math.min(12, Math.max(3, isFinite(est) ? est : defaultTab));
}

// Map a chord column (after tab expansion) to a lyric grapheme index using proportional scaling.
// scale = lastLyricIdx / lastChordCol  (so last chord hits last lyric)
function mapColToIndexFactory(chordLine: string, lyric: string) {
  const lyricTrimmed = lyric.replace(/\s+$/, "");
  const G = Array.from(lyricTrimmed);
  const lastLyricIdx = Math.max(0, G.length - 1);

  const matches = [...chordLine.matchAll(CHORD_RE)];
  const last = matches[matches.length - 1];
  const lastCol = (last?.index ?? 0);

  const scale = lastCol > 0 ? lastLyricIdx / lastCol : 1;

  return (col: number) => {
    const idx = Math.round(col * scale);
    return Math.max(0, Math.min(lastLyricIdx, idx));
  };
}

// PUBLIC: Convert pairs of lines (chord row above lyric row) -> ChordPro text
export function twoLineToChordPro(block: string, defaultTab = 8) {
  const text = block.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n");
  const out: string[] = [];

  for (let i = 0; i < lines.length; ) {
    const chordRaw = lines[i] ?? "";
    const lyricRaw = lines[i + 1] ?? "";

    // Not a proper pair? Push what's there and advance.
    if (!chordRaw.trim() || i === lines.length - 1 || !lyricRaw.trim()) {
      if (lyricRaw) out.push(lyricRaw);
      else if (chordRaw) out.push(chordRaw);
      i += lyricRaw.trim() ? 2 : 1;
      continue;
    }

    // 1) Pick an effective tab size for THIS line
    const tabSize = autoTabSizeForLine(chordRaw, lyricRaw, defaultTab);

    // 2) Normalize each line with that tab size
    const chordLine = normalizeWordPasteLine(chordRaw, tabSize);
    const lyricLine = normalizeWordPasteLine(lyricRaw, tabSize).replace(/\s+$/, "");
    const graphemes = Array.from(lyricLine);

    // 3) Prepare proportional mapping for this pair
    const colToIdx = mapColToIndexFactory(chordLine, lyricLine);

    // 4) Insert chords from right to left using proportional index mapping
    const tokens = [...chordLine.matchAll(CHORD_RE)];
    tokens
      .filter(t => (t.index ?? -1) >= 0)
      .sort((a, b) => (b.index ?? 0) - (a.index ?? 0))
      .forEach(t => {
        const col = t.index ?? 0;
        const idx = colToIdx(col);
        graphemes.splice(idx, 0, `[${t[0]}]`);
      });

    out.push(graphemes.join(""));
    i += 2;
  }

  return out.join("\n");
}

// Optional helper if you want a "Cleanup (Word paste)" button for the textarea preview-only:
export function normalizeWordPaste(input: string, tabSize = 8) {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map(line => normalizeWordPasteLine(line, tabSize))
    .join("\n");
}
