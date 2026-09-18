"use client";

/**
 * Last-resort error boundary (replaces the root layout when it fails).
 * Must render its own <html> and <body>.
 */
export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#f6f9fc", color: "#0f172a" }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 480, textAlign: "center" }}>
            <h1 style={{ fontSize: 28, marginBottom: 12 }}>Something went wrong</h1>
            <p style={{ color: "#475569", lineHeight: 1.6 }}>
              An unexpected error occurred while loading the site. Please try again.
            </p>
            {error?.digest && <p style={{ color: "#94a3b8", fontSize: 12 }}>Reference: {error.digest}</p>}
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: 20,
                padding: "12px 24px",
                borderRadius: 999,
                border: 0,
                background: "#156aa6",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
