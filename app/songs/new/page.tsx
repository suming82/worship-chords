"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import ChordLine from "../../../components/ChordLine";
import { chordProToSections } from "../../../lib/chordpro";
import { normalizeWordPaste, twoLineToChordPro } from "../../../lib/twoline";

type BodyJson = {
  sections: {
    type: string;
    lines: { lyric: string; chords: { index: number; chord: string }[] }[];
  }[];
};

export default function NewSongPage() {
  const [mode, setMode] = useState<"chordpro" | "twoline">("twoline");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [language, setLanguage] = useState<"en" | "zh" | "mix">("mix");
  const [originalKey, setOriginalKey] = useState("G");
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<BodyJson | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [tabSize, setTabSize] = useState(8); // default 8 spaces per tab

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);
  useEffect(() => {
    if (!raw.trim()) { setPreview(null); return; }
    try {
      const json = makeJson();   // uses current mode + tabSize
      setPreview(json);
      setMsg(null);
    } catch (e: any) {
      setMsg("Parse error: " + e.message);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, mode, tabSize]);


  function makeJson(): BodyJson {
    const chordPro =
      mode === "twoline" ? twoLineToChordPro(raw, tabSize) : raw;
    const body = chordProToSections(chordPro);
    return body as BodyJson;
  }

  function onPreview() {
    try {
      const json = makeJson();
      setPreview(json);
      setMsg("Preview generated");
    } catch (e: any) {
      setMsg("Parse error: " + e.message);
    }
  }

  async function onSave() {
    if (!userId) {
      setMsg("Please sign in first.");
      return;
    }
    if (!title.trim()) {
      setMsg("Title required.");
      return;
    }
    try {
      setBusy(true);
      const body_json = makeJson();
      const { error } = await supabase.from("songs").insert({
        title,
        artist,
        language,
        original_key: originalKey,
        body_json,
        created_by: userId,
      });
      setBusy(false);
      if (error) {
        setMsg("Save failed: " + error.message);
        return;
      }
      setMsg("Saved ✅");
      setRaw("");
      setPreview(null);
    } catch (e: any) {
      setBusy(false);
      setMsg("Error: " + e.message);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
  e.preventDefault();
  const text = e.clipboardData.getData("text");
  // use your current tabSize so textarea & preview use the same spacing
  const cleaned = normalizeWordPaste(text, tabSize);

  const { selectionStart, selectionEnd, value } = e.currentTarget;
  const next =
    value.slice(0, selectionStart) + cleaned + value.slice(selectionEnd);

  setRaw(next);
}


  // ---------- RENDER ----------
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>New Song</h2>

      <div style={{ display: "grid", gap: 8 }}>
        <label>
          Title{" "}
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <label>
          Artist{" "}
          <input value={artist} onChange={(e) => setArtist(e.target.value)} />
        </label>

        <label>
          Language{" "}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
          >
            <option value="en">English</option>
            <option value="zh">Chinese</option>
            <option value="mix">Mix</option>
          </select>
        </label>

        <label>
          Original Key{" "}
          <input
            value={originalKey}
            onChange={(e) => setOriginalKey(e.target.value)}
            placeholder="e.g., G, F#m, Eb"
          />
        </label>

        <label>
          Input mode{" "}
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
          >
            <option value="twoline">Two-line (chords over lyrics)</option>
            <option value="chordpro">ChordPro ([C] inline)</option>
          </select>
        </label>

        <label>
          Tab width{" "}
          <input
            type="number"
            min={2}
            max={12}
            value={tabSize}
            onChange={(e) => setTabSize(Number(e.target.value) || 8)}
            style={{ width: 60, marginLeft: 8 }}
          />
        </label>

        <textarea
          rows={14}
          placeholder={
            mode === "twoline"
              ? "Paste chord row above lyric row.\nExample:\nG     D/F#   Em\n主你真美\n\nC     G/B    Am7   D7\nJesus, You are beautiful"
              : "Paste ChordPro with [G] markers inline"
          }
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onPaste={handlePaste}
          style={{
            width: "100%",
            fontFamily: "ui-monospace, monospace",
            whiteSpace: "pre",
          }}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onPreview}>Preview</button>
          <button onClick={onSave} disabled={busy}>
            Save to Supabase
          </button>
          <button
            onClick={() => setRaw((prev) => normalizeWordPaste(prev, tabSize))}
            type="button"
          >
            Cleanup (Word paste)
          </button>
        </div>

        {msg && <p style={{ color: "#666" }}>{msg}</p>}
      </div>

      {preview && (
        <div style={{ borderTop: "1px solid #eee", paddingTop: 12 }}>
          <h3>Preview (tab width = {tabSize})</h3>
          <div style={{ overflowX: "auto", whiteSpace: "nowrap" }}>
            {preview.sections.map((s, si) => (
              <div key={si} style={{ marginBottom: 24 }}>
                {s.lines.map((ln, li) => (
                  <ChordLine key={li} lyric={ln.lyric} chords={ln.chords} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
