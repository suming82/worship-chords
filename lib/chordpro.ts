// Parse a single ChordPro line -> {lyric, chords[]}, mapping [C] into index positions
export function parseChordProLine(line: string) {
  const chords: { index: number; chord: string }[] = [];
  let out = "";
  let i = 0;
  while (i < line.length) {
    if (line[i] === "[" ) {
      const j = line.indexOf("]", i+1);
      if (j > i) {
        const chord = line.slice(i+1, j).trim();
        // index is at current grapheme length of out
        const index = Array.from(out).length; // safe-ish for most cases
        if (chord) chords.push({ index, chord });
        i = j + 1;
        continue;
      }
    }
    out += line[i++];
  }
  return { lyric: out, chords };
}

export function chordProToSections(text: string) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const sections: any[] = [{ type: "verse", lines: [] as any[] }];
  for (const ln of lines) {
    if (!ln.trim()) { sections.push({ type: "verse", lines: [] }); continue; }
    const parsed = parseChordProLine(ln);
    sections[sections.length - 1].lines.push(parsed);
  }
  // remove empty trailing sections
  return { sections: sections.filter(s => s.lines.length > 0) };
}
