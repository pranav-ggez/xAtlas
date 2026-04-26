from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine, SessionLocal
from app.core.config import settings
from app.api.endpoints import tools, security
from app.models.tool import Tool
import hashlib
import aiohttp

Base.metadata.create_all(bind=engine)

app = FastAPI(title="xAtlas Security Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tools.router)
app.include_router(security.router)

@app.get("/api/tools/search")
def search_alternative(query: str):
    db = SessionLocal()
    try:
        query_lower = query.lower()
        
        results = db.query(Tool).filter(
            Tool.proprietary_alternative.ilike(f"%{query}%")
        ).limit(10).all()
        
        if not results:
            results = db.query(Tool).filter(
                Tool.name.ilike(f"%{query}%")
            ).limit(10).all()

        if results:
            data_payload = [{
                "id": t.id, "name": t.name, "category": t.category,
                "description": t.description, "license_type": t.license_type,
                "proprietary_alternative": t.proprietary_alternative,
                "migration_difficulty": t.migration_difficulty,
                "official_link": t.official_link,
                "signed_releases": t.signed_releases,
                "lat": t.lat, "lng": t.lng,
                "excuse": None
            } for t in results]
            return {"success": True, "data": data_payload, "count": len(data_payload)}
        
        excuse_msg = ""
        if "solidworks" in query_lower or "catia" in query_lower:
            excuse_msg = "Excuse: Proprietary file formats (.SLDPRT) and complex assembly engines have no direct OSS equivalent yet. FreeCAD is improving but not production-ready for enterprise aerospace/auto."
        elif "matlab" in query_lower and "simulink" in query_lower:
            excuse_msg = "Excuse: Core math is solved (Octave/Scilab), but specialized toolboxes (e.g., Simulink for specific hardware) lack certified OSS equivalents for safety-critical industries."
        elif "adobe" in query_lower and "acrobat" in query_lower:
            excuse_msg = "Excuse: While viewing is solved (SumatraPDF), advanced form creation, redaction, and pre-press validation remain proprietary to Adobe's closed ecosystem."
        elif "microsoft project" in query_lower or "ms project" in query_lower:
            excuse_msg = "Excuse: OpenProject exists, but deep integration with the wider MS Enterprise ecosystem (Teams, SharePoint, AD) creates a lock-in that is difficult to break."
        elif "autocad" in query_lower:
            excuse_msg = "Excuse: LibreCAD handles 2D, but complex 3D BIM workflows in AutoCAD/Revit rely on proprietary APIs and file formats with no full OSS parity."
        else:
            excuse_msg = f"No verified open-source alternative found for '{query}'. Migration risk is high due to potential feature gaps or proprietary format lock-in."

        return {
            "success": True,
            "data": [],
            "count": 0,
            "excuse": excuse_msg,
            "message": "No direct alternative found. See advisory."
        }

    except Exception as e:
        return {"success": False, "error": str(e), "data": []}
    finally:
        db.close()