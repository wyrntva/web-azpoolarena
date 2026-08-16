"""
Configuration for Desktop QR Generator App
Supports both development (python main.py) and packaged (.exe) modes
"""
import os
import sys
from dotenv import load_dotenv


def get_base_path():
    """Get base path - works for both dev and PyInstaller bundled exe"""
    if getattr(sys, 'frozen', False):
        # Running as compiled .exe
        # Look for .env next to the .exe file, not in the temp extract folder
        return os.path.dirname(sys.executable)
    else:
        # Running as script
        return os.path.dirname(os.path.abspath(__file__))


# Load .env from the correct location
env_path = os.path.join(get_base_path(), '.env')
load_dotenv(env_path)


def normalize_url(url: str, default_scheme: str = "https") -> str:
    """Normalize and fix malformed URLs like 'http:cms.poolarena.vn' or 'cms.poolarena.vn'"""
    if not url:
        return ""
    url = url.strip().rstrip("/")
    
    # Fix missing double slashes after scheme, e.g. "http:domain.com" -> "http://domain.com"
    if url.startswith("http:") and not url.startswith("http://"):
        url = "http://" + url[5:].lstrip("/")
    elif url.startswith("https:") and not url.startswith("https://"):
        url = "https://" + url[6:].lstrip("/")
    elif not url.startswith("http://") and not url.startswith("https://"):
        url = f"{default_scheme}://" + url
        
    return url


class Config:
    # API Configuration
    raw_api_url = os.getenv("API_BASE_URL", "http://localhost:8000")
    API_BASE_URL = normalize_url(raw_api_url, default_scheme="https")
    
    INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")

    # Device Configuration
    DEVICE_ID = os.getenv("DEVICE_ID", "PC-QR-01")
    DEVICE_NAME = os.getenv("DEVICE_NAME", "Reception QR Generator")

    # QR Code Settings
    DEFAULT_TTL_SECONDS = int(os.getenv("DEFAULT_TTL_SECONDS", "60"))
    QR_SIZE = int(os.getenv("QR_SIZE", "10"))
    QR_BORDER = int(os.getenv("QR_BORDER", "4"))

    # Frontend URL
    raw_frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    FRONTEND_URL = normalize_url(raw_frontend_url, default_scheme="https")

    # Validate required config
    @classmethod
    def validate(cls):
        if not cls.INTERNAL_API_KEY:
            raise ValueError("INTERNAL_API_KEY is required in .env file")
        if not cls.DEVICE_ID:
            raise ValueError("DEVICE_ID is required in .env file")


# Initialize config
config = Config()

