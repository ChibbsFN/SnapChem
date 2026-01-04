"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Html5QrcodeScanner } from "html5-qrcode";

type Chemical = {
  id: string;
  name: string;
  cas?: string | null;
  un?: string | null;
  pictograms: string[];
  where_to_use: string[];
  when_not_to_use: string[];
  how_to_use: string[];
  ppe: string[];
  storage: string[];
  first_aid: string[];
};

type IdentifyResponse = {
  extracted: { cas: string[]; un: string[] };
  matches: Chemical[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 16,
      padding: 16,
      background: "rgba(255,255,255,0.04)",
      boxShadow: "0 8px 20px rgba(0,0,0,0.35)"
    }}>
      <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<"scan" | "text">("scan");
  const [scannerReady, setScannerReady] = useState(false);

  const [scanResult, setScanResult] = useState<string>("");
  const [text, setText] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<IdentifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== "scan") return;
    // Mount the scanner when tab is scan
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 240, height: 240 } },
      false
    );

    scanner.render(
      (decodedText) => {
        setScanResult(decodedText);
        setText(decodedText);
        setTab("text"); // move to results tab for confirm/search
        scanner.clear().catch(() => {});
      },
      () => {}
    );

    setScannerReady(true);

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [tab]);

  async function identify(payloadText: string) {
    setLoading(true);
    setError(null);
    setResp(null);
    try {
      const r = await fetch(`${API_BASE}/identify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: payloadText }),
      });
      if (!r.ok) throw new Error(`API error: ${r.status}`);
      const data = (await r.json()) as IdentifyResponse;
      setResp(data);
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const bestMatch = useMemo(() => resp?.matches?.[0] ?? null, [resp]);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.4 }}>SnapChem</div>
          <div style={{ opacity: 0.8, marginTop: 6 }}>
            Camera-first chemical lookup (starter). Scan QR → extract identifiers → show “Where / When / How”.
          </div>
        </div>
        <Link href="/inventory" style={{
          textDecoration: "none",
          color: "#0b0b0c",
          background: "#f2f2f3",
          padding: "10px 14px",
          borderRadius: 12,
          fontWeight: 700
        }}>
          Inventory →
        </Link>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button onClick={() => setTab("scan")} style={btn(tab==="scan")}>Scan</button>
        <button onClick={() => setTab("text")} style={btn(tab==="text")}>Text / Results</button>
      </div>

      {tab === "scan" && (
        <div style={{ marginTop: 16 }}>
          <Card title="Scan a QR code / barcode label">
            <div id="qr-reader" style={{ width: "100%" }} />
            <div style={{ marginTop: 12, opacity: 0.8, fontSize: 13 }}>
              Tip: For fastest experience in real deployments, print your own QR labels that encode an internal chemical ID.
            </div>
            {scannerReady && scanResult && (
              <div style={{ marginTop: 12, fontSize: 13 }}>
                Last scan: <span style={{ opacity: 0.9 }}>{scanResult}</span>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "text" && (
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          <Card title="Paste label text or use last scan value">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Example: Acetone CAS 67-64-1 UN1090 ..."
              style={{
                width: "100%",
                minHeight: 120,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.25)",
                color: "#f2f2f3",
                padding: 12,
                fontSize: 14,
                outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <button onClick={() => identify(text)} disabled={!text.trim() || loading} style={btnPrimary(!text.trim() || loading)}>
                {loading ? "Identifying..." : "Identify"}
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(text)}
                disabled={!text.trim()}
                style={btn( false, !text.trim())}
              >
                Copy text
              </button>
              <button
                onClick={() => { setText(""); setResp(null); setError(null); }}
                style={btn(false)}
              >
                Clear
              </button>
            </div>
            {error && <div style={{ marginTop: 10, color: "#ffb4b4" }}>{error}</div>}
          </Card>

          {resp && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Card title="Extracted identifiers">
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                  <div><b>CAS</b>: {resp.extracted.cas.length ? resp.extracted.cas.join(", ") : "—"}</div>
                  <div><b>UN</b>: {resp.extracted.un.length ? resp.extracted.un.join(", ") : "—"}</div>
                </div>
              </Card>

              <Card title="Matches">
                {resp.matches.length === 0 ? (
                  <div style={{ opacity: 0.8 }}>No matches in demo registry yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {resp.matches.map((m) => (
                      <a key={m.id} href={`/chemical/${m.id}`} style={matchRow}>
                        <div style={{ fontWeight: 800 }}>{m.name}</div>
                        <div style={{ opacity: 0.8, fontSize: 13 }}>
                          {m.cas ? `CAS ${m.cas}` : ""}{m.un ? ` • ${m.un}` : ""}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </Card>

              {bestMatch && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <Card title={`Best match preview: ${bestMatch.name}`}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      <MiniList title="Where to use" items={bestMatch.where_to_use} />
                      <MiniList title="When NOT to use" items={bestMatch.when_not_to_use} />
                      <MiniList title="How to use safely" items={bestMatch.how_to_use} />
                    </div>
                    <div style={{ marginTop: 12, opacity: 0.8, fontSize: 13 }}>
                      Next step: Click the match above to open the full chemical record page.
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 22, opacity: 0.7, fontSize: 12 }}>
        Starter only: demo chemical registry is in <code>api/main.py</code>. Replace with Postgres + SDS importer later.
      </div>
    </div>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6, fontSize: 14 }}>
        {(items || []).slice(0, 6).map((x, i) => <li key={i}>{x}</li>)}
      </ul>
    </div>
  );
}

function btn(active?: boolean, disabled?: boolean) {
  return {
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    border: "1px solid rgba(255,255,255,0.14)",
    background: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
    color: "#f2f2f3",
    padding: "10px 12px",
    borderRadius: 12,
    fontWeight: 700 as const,
  };
}

function btnPrimary(disabled?: boolean) {
  return {
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "#f2f2f3",
    color: "#0b0b0c",
    padding: "10px 12px",
    borderRadius: 12,
    fontWeight: 900 as const,
  };
}

const matchRow: any = {
  textDecoration: "none",
  color: "#f2f2f3",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  padding: 12,
  borderRadius: 12,
};
