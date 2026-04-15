from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float
from sqlalchemy.sql import func
from app.database import Base

class Tool(Base):
    __tablename__ = "tools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    category = Column(String, nullable=False) 
    description = Column(String)
    license_type = Column(String)
    proprietary_alternative = Column(String)
    migration_difficulty = Column(String) 
    official_link = Column(String)
    
    # Security Metrics
    cve_count = Column(Integer, default=0)
    signed_releases = Column(Boolean, default=False)
    trust_score = Column(Integer, default=50) 
    
    # LOCATION DATA (For the Globe)
    lat = Column(Float, default=0.0)
    lng = Column(Float, default=0.0)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())