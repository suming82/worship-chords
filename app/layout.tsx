export const metadata = { title: "Worship Chords", description: "Chord sheets for worship team" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div style={{ maxWidth: 840, margin: "24px auto", padding: "0 16px" }}>
          <h1>Worship Chords</h1>
          {children}
        </div>
      </body>
    </html>
  );
}
