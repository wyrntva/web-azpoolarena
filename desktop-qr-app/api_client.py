"""
API Client for communicating with backend server
"""
import requests
from typing import Optional, Dict, Any
from config import config


class APIClient:
    def __init__(self):
        self.base_url = config.API_BASE_URL
        self.api_key = config.INTERNAL_API_KEY
        self.headers = {
            "X-Internal-API-Key": self.api_key,
            "Content-Type": "application/json"
        }

    def create_qr_token(
        self,
        device_id: str,
        purpose: str = "attendance_access",
        ttl_seconds: int = 60
    ) -> Optional[Dict[str, Any]]:
        """
        Create one-time access token

        Returns:
            {
                "success": True,
                "access_token": "uuid",
                "expires_at": "2026-01-12T08:05:00Z",
                "qr_url": "http://...",
                "ttl_seconds": 60
            }
        """
        url = f"{self.base_url}/api/internal/qr-access/create"
        payload = {
            "device_id": device_id,
            "purpose": purpose,
            "ttl_seconds": ttl_seconds
        }

        try:
            print(f"[API] Calling: {url}")
            print(f"[API] Payload: {payload}")
            print(f"[API] Headers: {self.headers}")

            response = requests.post(
                url,
                json=payload,
                headers=self.headers,
                timeout=10
            )

            print(f"[API] Status Code: {response.status_code}")
            print(f"[API] Response: {response.text}")

            if response.status_code == 200:
                return response.json()
            else:
                error_detail = response.json().get("detail", "Unknown error")
                raise Exception(f"API Error [{response.status_code}]: {error_detail}")

        except requests.exceptions.ConnectionError as e:
            raise Exception(f"Cannot connect to server at {self.base_url}. Backend not running?")
        except requests.exceptions.Timeout:
            raise Exception("Request timeout. Server is not responding.")
        except Exception as e:
            raise Exception(f"Failed to create token: {str(e)}")

    def get_device_stats(self, device_id: str) -> Optional[Dict[str, Any]]:
        """
        Get device statistics

        Returns:
            {
                "device_id": "PC-QR-01",
                "device_name": "...",
                "is_active": True,
                "total_tokens": 100,
                "used_tokens": 95,
                "active_tokens": 2
            }
        """
        url = f"{self.base_url}/api/internal/qr-access/device/{device_id}/stats"

        try:
            response = requests.get(
                url,
                headers=self.headers,
                timeout=10
            )

            if response.status_code == 200:
                return response.json()
            else:
                return None

        except Exception:
            return None

    def validate_token(self, access_token: str) -> Optional[Dict[str, Any]]:
        """
        Validate token (for testing)

        Returns:
            {
                "valid": True,
                "message": "...",
                "redirect_url": "...",
                "expires_in_seconds": 45
            }
        """
        url = f"{self.base_url}/api/qr-access/validate"
        payload = {"access_token": access_token}

        try:
            response = requests.post(
                url,
                json=payload,
                timeout=10
            )

            if response.status_code == 200:
                return response.json()
            else:
                return None

        except Exception:
            return None
