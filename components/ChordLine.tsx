"use client";
import React from "react";

type ChordAt = { index: number; chord: string };

function segmentGraphemes(text: string): string[] {
  // CJK/emoji-safe segmentation
  // @ts-ignore
  const Seg = (Intl as any).Segmenter
    ? // @ts-ignore
      new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;
  return Seg ? Array.from(Seg.segment(text), (s: any) => s.segment) : Array.from(text);
}

export default function ChordLine({ lyric, chords }: { lyric: string; chords: ChordAt[] }) {
  const cells = segmentGraphemes(lyric);
  const chordMap = new Map<number, string>();
  chords?.forEach(c => chordMap.set(c.index, c.chord));

  return (
    <div style={{ overflowX: "auto", marginBottom: 8 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(cells.length, 1)}, 1.2ch)`, // many narrow columns
          columnGap: "4px",
          fontFamily: "ui-monospace, monospace"
        }}
      >
        {/* Chord row */}
        {cells.map((_, i) => (
          <div key={`c-${i}`} style={{ textAlign: "center", fontWeight: 600, lineHeight: "1.1", height: 20 }}>
            {chordMap.get(i) ?? ""}
          </div>
        ))}
        {/* Lyric row */}
        {cells.map((g, i) => (
          <div key={`l-${i}`} style={{ textAlign: "center", lineHeight: "1.6" }}>
            {g === " " ? "\u00A0" : g}
          </div>
        ))}
      </div>
    </div>
  );
}
