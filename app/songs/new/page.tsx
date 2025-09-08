"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import ChordLine from "../../../components/ChordLine";
import { chordProToSections } from "../../../lib/chordpro";
import { twoLineToChordPro } from "../../../lib/twoline";




type BodyJson = {
  sections: { type: string; lines: { lyric: string; chords: { index: number; chord: string }[] }[] }[];
};

export default function NewSongPage() {
  const [mode, setMode] = useState<"chordpro"|"twoline">("twoline");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [language, setLanguage] = useState<"en"|"zh"|"mix">("mix");
  const [originalKey, setOriginalKey] = useState("G");
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<BodyJson | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  function makeJson(): BodyJson {
    const chordPro = mode === "twoline" ? twoLineToChordPro(raw) : raw;
    const body = chordProToSections(chordPro);
    return { ...body } as BodyJson;
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
    if (!userId) { setMsg("Please sign in first."); return; }
    if (!title.trim()) { setMsg("Title required."); return; }
    try {
      setBusy(true);
      const body_json = makeJson();
      const { error } = await supabase.from("songs").insert({
        title, artist, language, original_key: originalKey, body_json, created_by: userId
      });
      setBusy(false);
      if (error) { setMsg("Save failed: " + error.message); return; }
      setMsg("Saved ✅");
      setRaw(""); setPreview(null);
    } catch (e: any) {
      setBusy(false);
      setMsg("Error: " + e.message);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>New Song</h2>
      <div style={{ display: "grid", gap: 8 }}>
        <label>Title <input value={title} onChange={e=>setTitle(e.target.value)} /></label>
        <label>Artist <input value={artist} onChange={e=>setArtist(e.target.value)} /></label>
        <label>Language
          <select value={language} onChange={e=>setLanguage(e.target.value as any)}>
            <option value="en">English</option>
            <option value="zh">Chinese</option>
            <option value="mix">Mix</option>
          </select>
        </label>
        <label>Original Key
          <input value={originalKey} onChange={e=>setOriginalKey(e.target.value)} placeholder="e.g., G, F#m, Eb" />
        </label>
        <label>Input mode
          <select value={mode} onChange={e=>setMode(e.target.value as any)}>
            <option value="twoline">Two-line (chords over lyrics)</option>
            <option value="chordpro">ChordPro ([C] inline)</option>
          </select>
        </label>
        <textarea
          rows={14}
          placeholder={mode==="twoline"
            ? "Paste chord row above lyric row.\nExample:\nG     D/F#   Em\n主你真美\n\nC     G/B    Am7   D7\nJesus, You are beautiful"
            : "Paste ChordPro with [G] markers inline"}
          value={raw} onChange={e=>setRaw(e.target.value)}
          style={{ width: "100%", fontFamily: "ui-monospace, monospace" }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onPreview}>Preview</button>
          <button onClick={onSave} disabled={busy}>Save to Supabase</button>
        </div>
        {msg && <p style={{ color: "#666" }}>{msg}</p>}
      </div>

      {preview && (
        <div style={{ borderTop: "1px solid #eee", paddingTop: 12 }}>
          <h3>Preview</h3>
          {preview.sections.map((s, si) => (
            <div key={si} style={{ marginBottom: 12 }}>
              {s.lines.map((ln, li) => (
                <ChordLine key={li} lyric={ln.lyric} chords={ln.chords} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
