"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Chemical = { id: string; name: string; cas?: string | null; un?: string | null };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export default function Inventory() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Chemical[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch(`${API_BASE}/chemicals?q=${encodeURIComponent(q)}`);
    const data = await r.json();
    setItems(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Inventory (demo registry)</div>
          <div style={{ opacity: 0.8, marginTop: 6 }}>Search chemicals and open their safety cards.</div>
        </div>
        <Link href="/" style={{
          textDecoration: "none",
          color: "#0b0b0c",
          background: "#f2f2f3",
          padding: "10px 14px",
          borderRadius: 12,
          fontWeight: 800
        }}>
          ← Scan
        </Link>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, CAS, UN..."
          style={{
            flex: 1,
            minWidth: 260,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "#f2f2f3",
            padding: "10px 12px",
            fontSize: 14,
            outline: "none",
          }}
        />
        <button onClick={load} disabled={loading} style={{
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "#f2f2f3",
          color: "#0b0b0c",
          padding: "10px 12px",
          borderRadius: 12,
          fontWeight: 900,
        }}>
          {loading ? "Loading..." : "Search"}
        </button>
      </div>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {items.map((it) => (
          <Link key={it.id} href={`/chemical/${it.id}`} style={{
            textDecoration: "none",
            color: "#f2f2f3",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            padding: 14,
            borderRadius: 16,
          }}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>{it.name}</div>
            <div style={{ opacity: 0.8, marginTop: 6, fontSize: 13 }}>
              {it.cas ? `CAS ${it.cas}` : "CAS —"} {it.un ? ` • ${it.un}` : ""}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
