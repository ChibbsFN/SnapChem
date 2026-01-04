# SnapChem (starter)

A scan-first chemical lookup webapp starter.

## What you get
- **Web (Next.js)**: QR scan (camera) + paste label text -> calls API -> shows matches and safety cards.
- **API (FastAPI)**: demo registry + `/identify` endpoint that extracts CAS/UN patterns and matches.

## Run locally

### 1) Backend (FastAPI)
```bash
cd api
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2) Frontend (Next.js)
```bash
cd web
npm install
# Optional: point to API
# export NEXT_PUBLIC_API_BASE=http://localhost:8000
npm run dev
```

Open http://localhost:3000

## Next steps
- Replace in-memory registry with Postgres.
- Add SDS upload + parsing pipeline.
- Generate printable QR labels for each chemical/inventory item.
- Add compatibility engine and location-aware warnings.
