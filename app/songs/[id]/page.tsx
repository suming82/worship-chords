"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import ChordLine from "../../../components/ChordLine";
import { transposeBody } from "../../../lib/transpose";

type Song = {
  id: string;
  title: string;
  artist: string | null;
  original_key: string;
  body_json: any;
};

const KEYS = ["C","C#","Db","D","D#","Eb","E","F","F#","Gb","G","G#","Ab","A","A#","Bb","B"];

export default function SongViewer() {
  const params = useParams();
  const [song, setSong] = useState<Song | null>(null);
  const [targetKey, setTargetKey] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    supabase
      .from("songs")
      .select("*")
      .eq("id", params.id)
      .single()
      .then(({ data, error }) => {
        if (error) console.error(error);
        else {
          setSong(data as Song);
          setTargetKey((data as Song).original_key);
        }
      });
  }, [params?.id]);

  const renderedBody = useMemo(() => {
    if (!song || !targetKey) return null;
    return transposeBody(song.body_json, song.original_key, targetKey);
  }, [song, targetKey]);

  if (!song) return <p>Loading...</p>;

  return (
    <div>
      <h2>{song.title}</h2>
      {song.artist && <p>{song.artist}</p>}

      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "8px 0 16px" }}>
        <div>Original Key: <b>{song.original_key}</b></div>
        <label>
          Transpose to{" "}
          <select
            value={targetKey ?? song.original_key}
            onChange={(e) => setTargetKey(e.target.value)}
          >
            {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
        <button onClick={() => setTargetKey(song.original_key)}>Reset</button>
      </div>

      <div style={{ marginTop: 8 }}>
        {renderedBody?.sections?.map((s: any, si: number) => (
          <div key={si} style={{ marginBottom: 16 }}>
            {s.lines.map((ln: any, li: number) => (
              <ChordLine key={li} lyric={ln.lyric} chords={ln.chords} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
