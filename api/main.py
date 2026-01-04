from __future__ import annotations

import re
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="SnapChem API", version="0.1.0")

# Allow local dev with Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Demo in-memory "chemical registry" ---
# Replace with Postgres + SDS parsing later.
CHEMICALS = [
    {
        "id": "chem-acetone",
        "name": "Acetone",
        "synonyms": ["Propanone", "Dimethyl ketone"],
        "cas": "67-64-1",
        "un": "UN1090",
        "pictograms": ["GHS02", "GHS07"],
        "where_to_use": ["Cleaning / degreasing", "Solvent for resins and adhesives"],
        "when_not_to_use": ["Near ignition sources", "With strong oxidizers"],
        "how_to_use": [
            "Use in well-ventilated area or fume hood",
            "Wear splash goggles and suitable gloves",
            "Keep container tightly closed; ground/bond when transferring",
        ],
        "ppe": ["Goggles", "Gloves", "Lab coat"],
        "storage": ["Flammables cabinet", "Keep away from heat/sparks/open flames"],
        "first_aid": ["Fresh air if inhaled", "Rinse skin with water", "Rinse eyes for several minutes"],
    },
    {
        "id": "chem-h2o2-30",
        "name": "Hydrogen peroxide 30%",
        "synonyms": ["H2O2 30%", "Peroxide solution"],
        "cas": "7722-84-1",
        "un": "UN2014",
        "pictograms": ["GHS03", "GHS05", "GHS07"],
        "where_to_use": ["Oxidizing agent", "Disinfection (industrial protocols)"],
        "when_not_to_use": ["With organics/solvents", "With metals/contaminants", "In closed container after contamination"],
        "how_to_use": [
            "Wear face shield or goggles, chemical-resistant gloves",
            "Use secondary containment; keep away from combustibles",
            "Do not return unused solution to original container",
        ],
        "ppe": ["Goggles/face shield", "Chemical-resistant gloves", "Apron"],
        "storage": ["Cool, vented area", "Away from combustibles and reducing agents"],
        "first_aid": ["Flush eyes/skin with water", "Seek medical attention for exposure"],
    },
    {
        "id": "chem-naoh",
        "name": "Sodium hydroxide",
        "synonyms": ["Caustic soda", "Lye"],
        "cas": "1310-73-2",
        "un": "UN1823",
        "pictograms": ["GHS05"],
        "where_to_use": ["pH adjustment", "Cleaning (alkaline)"],
        "when_not_to_use": ["With acids (violent heat)", "With aluminum (hydrogen gas)"],
        "how_to_use": [
            "Add NaOH to water slowly (never water to NaOH) when dissolving",
            "Wear eye protection and gloves",
            "Use corrosion-resistant containers",
        ],
        "ppe": ["Goggles", "Gloves", "Lab coat"],
        "storage": ["Corrosives cabinet", "Keep container dry and sealed"],
        "first_aid": ["Rinse immediately with water; remove contaminated clothing", "Get medical advice"],
    },
]

CAS_RE = re.compile(r"\b\d{2,7}-\d{2}-\d\b")
UN_RE = re.compile(r"\bUN\s?\d{4}\b", re.IGNORECASE)

class Chemical(BaseModel):
    id: str
    name: str
    cas: Optional[str] = None
    un: Optional[str] = None
    pictograms: List[str] = []
    where_to_use: List[str] = []
    when_not_to_use: List[str] = []
    how_to_use: List[str] = []
    ppe: List[str] = []
    storage: List[str] = []
    first_aid: List[str] = []

class IdentifyRequest(BaseModel):
    text: str

class IdentifyResponse(BaseModel):
    extracted: Dict[str, Any]
    matches: List[Chemical]

def score_match(text: str, chem: dict) -> int:
    t = text.lower()
    score = 0
    if chem.get("cas") and chem["cas"] in t:
        score += 100
    if chem.get("un") and chem["un"].lower() in t:
        score += 80
    # name / synonyms
    if chem["name"].lower() in t:
        score += 60
    for s in chem.get("synonyms", []):
        if s.lower() in t:
            score += 30
    return score

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/chemicals", response_model=list[Chemical])
def chemicals(q: str = ""):
    ql = q.strip().lower()
    if not ql:
        return [Chemical(**c) for c in CHEMICALS[:50]]
    out = []
    for c in CHEMICALS:
        hay = " ".join([c["name"], *c.get("synonyms", []), c.get("cas",""), c.get("un","")]).lower()
        if ql in hay:
            out.append(Chemical(**c))
    return out

@app.post("/identify", response_model=IdentifyResponse)
def identify(payload: IdentifyRequest):
    text = payload.text or ""
    extracted = {
        "cas": CAS_RE.findall(text),
        "un": [u.upper().replace(" ", "") for u in UN_RE.findall(text)],
    }
    scored = []
    for c in CHEMICALS:
        s = score_match(text, c)
        if s > 0:
            scored.append((s, c))
    scored.sort(key=lambda x: x[0], reverse=True)
    matches = [Chemical(**c) for _, c in scored[:5]]
    return IdentifyResponse(extracted=extracted, matches=matches)

@app.post("/identify-photo")
async def identify_photo(file: UploadFile = File(...)):
    # Placeholder endpoint for later OCR pipeline.
    # For now, we just return a message.
    return {
        "message": "Photo received. Add OCR (e.g., Tesseract) server-side later, or run OCR in the browser.",
        "filename": file.filename,
        "content_type": file.content_type,
    }
