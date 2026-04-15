from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    CORS_ORIGINS: List[str] = ["*"]
    
    class Config:
        env_file = ".env"

def get_settings():
    return Settings()

settings = get_settings()