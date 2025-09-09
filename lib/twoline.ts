// lib/twoline.ts

// Normalize Word paste: CRLF -> LF, tabs -> N spaces, NBSP/full-width -> normal space
export function normalizeWordPaste(input: string, tabSize = 8) {
  const tabSpaces = " ".repeat(Math.max(1, tabSize));
  return input
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, tabSpaces)   // big jumps become consistent columns
    .replace(/\u00A0/g, " ")     // NBSP
    .replace(/\u3000/g, " ");    // full-width ideographic space
}

// Compute start columns after normalization (every char = 1 column)
function colAtIndex(line: string) {
  return (idx: number) => Math.max(0, Math.min(idx, line.length));
}

// Convert pairs: chord-row above lyric-row -> ChordPro with [Chord] inline
export function twoLineToChordPro(block: string, tabSize = 8) {
  const text = normalizeWordPaste(block, tabSize);
  const lines = text.split("\n");
  const out: string[] = [];

  for (let i = 0; i < lines.length; ) {
    const chordRow = lines[i] ?? "";
    const lyricRaw = lines[i + 1] ?? "";

    // If we don't have a proper pair, push what's there and advance
    if (!chordRow.trim() || i === lines.length - 1 || !lyricRaw.trim()) {
      if (lyricRaw) out.push(lyricRaw);
      else if (chordRow) out.push(chordRow);
      i += lyricRaw.trim() ? 2 : 1;
      continue;
    }

    // Trim trailing spaces from lyric so chords can snap to the last real char (e.g., 里)
    const lyricRow = lyricRaw.replace(/\s+$/, "");
    const graphemes = Array.from(lyricRow);

    // Find chord tokens
    const tokens = [...chordRow.matchAll(
      /[A-G](?:#|b)?(?:maj7|m7b5|m7|maj9|add9|sus2|sus4|dim|aug|m|7|9|11|13)?(?:\/[A-G](?:#|b)?)?/g
    )];

    const col = colAtIndex(chordRow);

    // Insert from right to left so earlier indices don't shift
    tokens
      .filter(t => (t.index ?? -1) >= 0)
      .map(t => ({ chord: t[0], col: col(t.index!) }))
      .sort((a, b) => b.col - a.col)
      .forEach(({ chord, col }) => {
        // Clamp to last non-space grapheme index
        const lastIdx = Math.max(0, graphemes.length - 1);
        const idx = Math.max(0, Math.min(col, lastIdx));
        graphemes.splice(idx, 0, `[${chord}]`);
      });

    out.push(graphemes.join(""));
    i += 2;
  }

  return out.join("\n");
}
