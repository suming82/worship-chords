// lib/twoline.ts

// Normalize Word paste: CRLF -> LF, tabs -> 8 spaces, NBSP/full-width -> normal space
export function normalizeWordPaste(input: string) {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, "        ")   // 8 spaces for each tab
    .replace(/\u00A0/g, " ")      // non-breaking space
    .replace(/\u3000/g, " ");     // full-width ideographic space
}


// Measure "visual columns" in a string after normalization (each char = 1 col)
function tokenStartColumns(line: string) {
  // After normalizeWordPaste, every char is 1 column (no tabs).
  // We’ll return a function that maps string indices to column counts.
  const cols: number[] = new Array(line.length + 1);
  for (let i = 0; i <= line.length; i++) cols[i] = i;
  return (idx: number) => cols[Math.max(0, Math.min(idx, line.length))];
}

// Convert pairs of lines (chords row above lyric row) -> ChordPro
export function twoLineToChordPro(block: string) {
  const text = normalizeWordPaste(block);
  const lines = text.split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; ) {
    const chordRow = (lines[i] ?? "");
    const lyricRow = (lines[i + 1] ?? "");

    // If we don’t have a proper pair, just push what we have and advance sensibly
    if (!chordRow.trim() || i === lines.length - 1 || !lyricRow.trim()) {
      if (lyricRow) out.push(lyricRow);
      else if (chordRow) out.push(chordRow);
      i += lyricRow.trim() ? 2 : 1;
      continue;
    }

    // Find chord tokens (conservative regex that matches common chord forms)
    const tokens = [...chordRow.matchAll(
      /[A-G](?:#|b)?(?:maj7|m7b5|m7|maj9|add9|sus2|sus4|dim|aug|m|7|9|11|13)?(?:\/[A-G](?:#|b)?)?/g
    )];

    // Map token start (string index) -> visual column (post-normalization)
    const colAt = tokenStartColumns(chordRow);

    // Prepare to inject [Chord] tags into lyricRow by grapheme index
    const graphemes = Array.from(lyricRow);

    // Insert from right to left so earlier insertions don’t shift later indices
    tokens
      .filter(t => (t.index ?? -1) >= 0)
      .map(t => ({ chord: t[0], col: colAt(t.index!) }))
      .sort((a, b) => b.col - a.col)
      .forEach(({ chord, col }) => {
        const idx = Math.min(graphemes.length, Math.max(0, col));
        graphemes.splice(idx, 0, `[${chord}]`);
      });

    out.push(graphemes.join(""));
    i += 2;
  }
  return out.join("\n");
}
