// Convert pairs of lines: chord-row above lyric-row -> a single ChordPro line like "[G]主你真美"
export function twoLineToChordPro(block: string) {
  const lines = block.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; ) {
    const chordRow = lines[i] ?? "";
    const lyricRow = lines[i+1] ?? "";
    // if next line is empty or it's the last line, just push lyric
    if (i === lines.length - 1 || lyricRow.trim() === "" || chordRow.trim() === "") {
      out.push(lyricRow || chordRow);
      i += (lyricRow.trim() === "" ? 1 : 2);
      continue;
    }
    // Map chord tokens to character positions
    const tokens = [...chordRow.matchAll(/[A-G](?:#|b)?(?:m|maj7|m7|7|sus4|sus2|add9|dim|aug|m7b5|\/[A-G](?:#|b)?)*/g)];
    let line = lyricRow;
    // insert markers from right to left so indices remain stable
    const graphemes = Array.from(lyricRow);
    tokens
      .filter(t => t[0].trim().length > 0)
      .map(t => ({ chord: t[0], col: t.index ?? 0 }))
      .sort((a,b)=> b.col - a.col)
      .forEach(({ chord, col }) => {
        // find grapheme index closest to this column
        const idx = Math.min(graphemes.length, Math.max(0, col));
        graphemes.splice(idx, 0, `[${chord}]`);
      });
    line = graphemes.join("");
    out.push(line);
    i += 2;
  }
  return out.join("\n");
}
