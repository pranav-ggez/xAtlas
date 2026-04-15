from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.core.config import settings
from app.api.endpoints import tools, security

# Create Database Tables
Base.metadata.create_all(bind=engine)

# Initialize App
app = FastAPI(title="xAtlas Security Platform")

# CORS (Allow Frontend to talk to Backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(tools.router)
app.include_router(security.router)

@app.get("/")
def read_root():
    return {"status": "online", "message": "xAtlas API Ready"}