"""
Configuration for Desktop QR Generator App
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # API Configuration
    API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
    INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")

    # Device Configuration
    DEVICE_ID = os.getenv("DEVICE_ID", "PC-QR-01")
    DEVICE_NAME = os.getenv("DEVICE_NAME", "Reception QR Generator")

    # QR Code Settings
    DEFAULT_TTL_SECONDS = int(os.getenv("DEFAULT_TTL_SECONDS", "60"))
    QR_SIZE = int(os.getenv("QR_SIZE", "10"))
    QR_BORDER = int(os.getenv("QR_BORDER", "4"))

    # Frontend URL
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Validate required config
    @classmethod
    def validate(cls):
        if not cls.INTERNAL_API_KEY:
            raise ValueError("INTERNAL_API_KEY is required in .env file")
        if not cls.DEVICE_ID:
            raise ValueError("DEVICE_ID is required in .env file")


# Initialize config
config = Config()
