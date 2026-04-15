from sqlalchemy import Column, Integer, String, Boolean, JSON
from app.database import Base

class Command(Base):
    __tablename__ = "commands"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False) # Display name: "DNS Lookup"
    command_key = Column(String, unique=True, nullable=False) # Internal ID: "dns_lookup"
    command_template = Column(JSON, nullable=False) # The safe command list
    description = Column(String)
    is_active = Column(Boolean, default=True)