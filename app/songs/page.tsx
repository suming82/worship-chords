"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

type Song = {
  id: string;
  title: string;
  artist: string | null;
  original_key: string;
};

export default function SongListPage() {
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    supabase
      .from("songs")
      .select("id, title, artist, original_key")
      .order("title")
      .then(({ data, error }) => {
        if (error) console.error(error);
        else setSongs(data || []);
      });
  }, []);

  return (
    <div>
      <h2>Song Library</h2>
      <ul style={{ lineHeight: "1.8" }}>
        {songs.map((s) => (
          <li key={s.id}>
            <Link href={`/songs/${s.id}`}>
              {s.title} ({s.original_key})
            </Link>{" "}
            {s.artist && <span style={{ color: "#666" }}>– {s.artist}</span>}
          </li>
        ))}
      </ul>
      {songs.length === 0 && <p>No songs yet.</p>}
    </div>
  );
}
