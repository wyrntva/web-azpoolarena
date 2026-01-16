from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # QR Access System
    INTERNAL_API_KEY: str = ""  # Set in .env for Desktop App authentication
    FRONTEND_URL: str = "http://localhost:5173"  # Frontend URL for QR code generation

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()
