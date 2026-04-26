from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")
    
    CORS_ORIGINS: List[str] = ["*"]

def get_settings():
    return Settings()

settings = get_settings()