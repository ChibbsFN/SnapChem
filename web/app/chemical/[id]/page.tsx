"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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

export default function ChemicalPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [chem, setChem] = useState<Chemical | null>(null);

  useEffect(() => {
    async function load() {
      // simple fetch from /chemicals list; in real app you'd have /chemicals/{id}
      const r = await fetch(`${API_BASE}/chemicals?q=${encodeURIComponent(id)}`);
      const data = await r.json();
      // fallback: find exact id client-side by fetching all
      if (!Array.isArray(data) || data.length === 0) {
        const r2 = await fetch(`${API_BASE}/chemicals?q=`);
        const all = await r2.json();
        const found = (all || []).find((x: any) => x.id === id) || null;
        setChem(found);
      } else {
        const found = (data || []).find((x: any) => x.id === id) || data[0] || null;
        setChem(found);
      }
    }
    if (id) load();
  }, [id]);

  if (!chem) {
    return (
      <div style={{ maxWidth: 980, margin: "0 auto", padding: 20 }}>
        <div style={{ opacity: 0.8 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900 }}>{chem.name}</div>
          <div style={{ opacity: 0.8, marginTop: 6, fontSize: 13 }}>
            {chem.cas ? `CAS ${chem.cas}` : "CAS —"} {chem.un ? ` • ${chem.un}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/inventory" style={topBtn}>Inventory</Link>
          <Link href="/" style={topBtn}>Scan</Link>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Card title="Where to use">
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {chem.where_to_use?.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </Card>
        <Card title="When NOT to use">
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {chem.when_not_to_use?.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </Card>
        <Card title="How to use safely">
          <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {chem.how_to_use?.map((x, i) => <li key={i}>{x}</li>)}
          </ol>
        </Card>
      </div>

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Card title="PPE">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(chem.ppe || []).map((p, i) => <span key={i} style={pill}>{p}</span>)}
          </div>
        </Card>
        <Card title="Storage">
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {chem.storage?.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </Card>
        <Card title="First aid (quick)">
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {chem.first_aid?.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </Card>
      </div>

      <div style={{ marginTop: 18, opacity: 0.7, fontSize: 12 }}>
        Note: This is a starter “safety card”. In production, these sections should be derived from your SDS + EHS rules and show sources.
      </div>
    </div>
  );
}

const topBtn: any = {
  textDecoration: "none",
  color: "#0b0b0c",
  background: "#f2f2f3",
  padding: "10px 12px",
  borderRadius: 12,
  fontWeight: 900
};

const pill: any = {
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.08)",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 13
};
