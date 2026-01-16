from sqlalchemy.orm import Session
from app.models import WiFiConfig
from typing import Optional
import ipaddress


def is_ip_in_range(ip: str, ip_range: str) -> bool:
    try:
        ip_obj = ipaddress.ip_address(ip)
        network = ipaddress.ip_network(ip_range, strict=False)
        return ip_obj in network
    except ValueError:
        return False


def validate_wifi_connection(
    db: Session,
    ssid: str = None,
    bssid: Optional[str] = None,
    ip_address: Optional[str] = None
) -> tuple[bool, str]:
    """
    Validate WiFi connection by checking:
    1. SSID or BSSID (if provided and configured)
    2. IP address subnet

    Both checks must pass for validation to succeed.
    """
    if not ip_address:
        return False, "Không thể xác định địa chỉ IP của bạn"

    # Get all active WiFi configs
    wifi_configs = db.query(WiFiConfig).filter(
        WiFiConfig.is_active == True
    ).all()

    if not wifi_configs:
        return False, "Chưa có cấu hình WiFi nào được thiết lập. Vui lòng liên hệ quản trị viên"

    # Check if IP, SSID, or BSSID matches any approved config
    approved_subnets = []
    matched_configs = []

    # Check if client sent real SSID (not "auto-detected" placeholder)
    has_real_ssid = ssid and ssid != "auto-detected"
    has_real_bssid = bssid and bssid != "auto-detected"

    for config in wifi_configs:
        # Prefer ip_subnet (new field), fallback to ip_range (old field)
        subnet = config.ip_subnet or config.ip_range

        if subnet:
            approved_subnets.append(subnet)

            # Check IP first (required)
            ip_match = is_ip_in_range(ip_address, subnet)
            if not ip_match:
                continue

            # Check SSID if both config has SSID and client sent real SSID
            if config.ssid and has_real_ssid:
                ssid_match = config.ssid.lower() == ssid.lower()
                if not ssid_match:
                    continue

            # Check BSSID if both config has BSSID and client sent real BSSID
            if config.bssid and has_real_bssid:
                bssid_match = config.bssid.upper() == bssid.upper()
                if not bssid_match:
                    continue

            # If we reach here, all required checks passed
            matched_configs.append(config)

    if matched_configs:
        config = matched_configs[0]
        return True, f"Đã xác thực kết nối mạng công ty (SSID: {config.ssid}, IP: {ip_address})"

    if not approved_subnets:
        return False, "Chưa có dải IP nào được cấu hình. Vui lòng liên hệ quản trị viên để thiết lập IP Subnet"

    # Provide detailed error message
    if ssid:
        return False, f"Không thể xác thực kết nối. WiFi '{ssid}' hoặc IP {ip_address} không được phép. Vui lòng kết nối WiFi công ty"
    else:
        return False, f"Địa chỉ IP {ip_address} không nằm trong mạng công ty được phê duyệt"


def get_approved_wifi_list(db: Session) -> list[dict]:
    wifi_configs = db.query(WiFiConfig).filter(WiFiConfig.is_active == True).all()
    return [
        {
            "id": config.id,
            "ssid": config.ssid,
            "description": config.description
        }
        for config in wifi_configs
    ]
