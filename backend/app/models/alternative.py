from sqlalchemy import Column, Integer, String
from app.database import Base

class Alternative(Base):
    __tablename__ = "alternatives"

    id = Column(Integer, primary_key=True, index=True)
    proprietary_name = Column(String, nullable=False, index=True) # e.g., "AnyDesk"
    oss_name = Column(String, nullable=False) # e.g., "RustDesk"
    why_switch = Column(String)