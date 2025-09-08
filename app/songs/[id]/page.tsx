"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import ChordLine from "../../../components/ChordLine";

type Song = {
  id: string;
  title: string;
  artist: string | null;
  original_key: string;
  body_json: any;
};

export default function SongViewer() {
  const params = useParams();
  const [song, setSong] = useState<Song | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    supabase
      .from("songs")
      .select("*")
      .eq("id", params.id)
      .single()
      .then(({ data, error }) => {
        if (error) console.error(error);
        else setSong(data as Song);
      });
  }, [params?.id]);

  if (!song) return <p>Loading...</p>;

  return (
    <div>
      <h2>{song.title}</h2>
      {song.artist && <p>{song.artist}</p>}
      <p>Original Key: {song.original_key}</p>

      <div style={{ marginTop: 24 }}>
        {song.body_json?.sections?.map((s: any, si: number) => (
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
