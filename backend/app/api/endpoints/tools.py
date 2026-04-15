from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.tool import Tool
from app.services.trust_score import calculate_trust_score

router = APIRouter(prefix="/api/tools", tags=["tools"])

@router.get("")
def list_tools(db: Session = Depends(get_db)):
    """Get all active tools"""
    tools = db.query(Tool).filter(Tool.is_active == True).all()
    
    result = []
    for t in tools:
        # Convert SQLAlchemy object to dict
        t_dict = {c.name: getattr(t, c.name) for c in t.__table__.columns}
        # Calculate live trust score
        t_dict["trust_score"] = calculate_trust_score(t_dict)
        result.append(t_dict)
        
    return result