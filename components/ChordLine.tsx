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
  chords?.forEach((c) => chordMap.set(c.index, c.chord));

  return (
    <div className="w-full overflow-x-auto">
      <div
        className="grid gap-x-1"
        style={{ gridTemplateColumns: `repeat(${Math.max(cells.length, 1)}, minmax(0, 1fr))` }}
      >
        {cells.map((_, i) => (
          <div key={`c-${i}`} className="text-center text-sm font-semibold leading-4 h-5">
            {chordMap.get(i) ?? ""}
          </div>
        ))}
        {cells.map((g, i) => (
          <div key={`l-${i}`} className="text-center leading-6">
            {g === " " ? "\u00A0" : g}
          </div>
        ))}
      </div>
    </div>
  );
}
