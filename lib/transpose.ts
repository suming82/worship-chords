// Simple, enharmonic-aware chord transposer

const SHARPS = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const FLATS  = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];

const FLAT_KEYS = new Set([
  "F","Bb","Eb","Ab","Db","Gb",
  "Dm","Gm","Cm","Fm","Bbm","Ebm","Abm","Dbm","Gbm"
]);

function pickScale(key: string) {
  return FLAT_KEYS.has(key) ? FLATS : SHARPS;
}

function splitChord(chord: string): [string, string] {
  const m = chord.match(/^([A-G](?:#|b)?)(.*)$/);
  return m ? [m[1], m[2] ?? ""] : [chord, ""];
}

function noteIndex(note: string, scale: string[]) {
  const i = scale.indexOf(note);
  if (i >= 0) return i;
  // enharmonics
  const map: Record<string,string> = { Db:"C#", Eb:"D#", Gb:"F#", Ab:"G#", Bb:"A#" };
  const enh = map[note];
  return enh ? scale.indexOf(enh) : -1;
}

export function transposeChord(chord: string, fromKey: string, toKey: string) {
  const [root, suffix] = splitChord(chord);
  const fromScale = pickScale(fromKey);
  const toScale   = pickScale(toKey);

  const rootIdx = noteIndex(root, fromScale);
  if (rootIdx < 0) return chord;

  // compare by major letter (strip trailing 'm' for relative-minor keys)
  const fromIdx = noteIndex(fromKey.replace(/m$/,""), fromScale);
  const toIdx   = noteIndex(toKey.replace(/m$/,""), toScale);
  if (fromIdx < 0 || toIdx < 0) return chord;

  const delta = (toIdx - fromIdx + 12) % 12;
  const newRoot = toScale[(rootIdx + delta) % 12];
  return `${newRoot}${suffix}`;
}

// Deep-copy transpose for our body_json format
export function transposeBody(body: any, fromKey: string, toKey: string) {
  if (fromKey === toKey) return body;
  const next = JSON.parse(JSON.stringify(body));
  next.sections?.forEach((s: any) =>
    s.lines?.forEach((ln: any) =>
      ln.chords?.forEach((c: any) => { c.chord = transposeChord(c.chord, fromKey, toKey); })
    )
  );
  return next;
}
