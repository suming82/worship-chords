"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Auth, ThemeMinimal } from "@supabase/auth-ui-react";

function PdfUploader() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setMsg("Please upload a PDF (.pdf).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMsg("Max file size is 5MB.");
      return;
    }

    setBusy(true);
    setMsg("Uploading...");
    const path = `test/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage.from("song-files").upload(path, file, { upsert: false });
    setBusy(false);

    if (error) setMsg(`Upload failed: ${error.message}`);
    else setMsg(`Uploaded OK → ${path}`);
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
      <h3>Quick test: upload a PDF to Supabase</h3>
      <input type="file" accept="application/pdf" onChange={onPick} disabled={busy} />
      <p style={{ color: "#666" }}>{msg}</p>
    </div>
  );
}

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserEmail(user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (!userEmail) {
    return (
      <div>
        <p>Sign in to test your Supabase connection:</p>
        <Auth supabaseClient={supabase} appearance={{ theme: ThemeMinimal }} providers={[]} />
      </div>
    );
  }

  return (
    <div>
      <p>Signed in as <b>{userEmail}</b></p>
      <button onClick={signOut} style={{ marginBottom: 16 }}>Sign out</button>
      <PdfUploader />
      <p style={{ marginTop: 12, color: "#666" }}>
        Try uploading: (1) a valid PDF under 5MB → should succeed; (2) a non-PDF → should fail;
        (3) a PDF &gt; 5MB → should fail with “File too large”.
      </p>
    </div>
  );
}
