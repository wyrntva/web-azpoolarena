from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.core.jwt import decode_token
from app.models import User, WiFiConfig
from typing import List
import json
import ipaddress

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )

    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token"
        )

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

    user = db.query(User).options(joinedload(User.role)).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )

    return user


def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        # Check if user is admin (including superuser ID 1)
        if current_user.is_admin:
            return current_user
            
        if not current_user.role or current_user.role.name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def require_accountant_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.is_admin:
        return current_user
        
    if not current_user.role or current_user.role.name != "Thu ngân":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accountant or Admin access required"
        )
    return current_user


def get_user_permissions(user: User) -> List[str]:
    """Get list of permissions for a user based on their role"""
    if not user.role or not user.role.permissions:
        return []

    try:
        permissions = json.loads(user.role.permissions)
        return permissions if isinstance(permissions, list) else []
    except:
        return []


def require_permission(required_permission: str):
    """Check if user has a specific permission"""
    def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        # Admin always has all permissions
        if current_user.is_admin:
            return current_user

        user_permissions = get_user_permissions(current_user)
        if required_permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required permission: {required_permission}"
            )
        return current_user
    return permission_checker


def require_any_permission(required_permissions: List[str]):
    """Check if user has at least one of the specified permissions"""
    def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        # Admin always has all permissions
        if current_user.is_admin:
            return current_user

        user_permissions = get_user_permissions(current_user)
        if not any(perm in user_permissions for perm in required_permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required one of: {', '.join(required_permissions)}"
            )
        return current_user
    return permission_checker


def get_current_user_from_whitelisted_ip(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency để kiểm tra xem IP của request có nằm trong whitelist hay không.

    Chức năng:
    - Lấy remote IP của request từ request.client.host
    - Query tất cả WiFiConfig có is_active = True
    - Kiểm tra xem IP của client có nằm trong bất kỳ ip_subnet nào không
    - Nếu có → trả về current_user
    - Nếu không → raise HTTPException 403

    Args:
        request: FastAPI Request object chứa thông tin client IP
        db: Database session
        current_user: User object từ JWT authentication

    Returns:
        User: Current user nếu IP được phép

    Raises:
        HTTPException: 403 nếu IP không nằm trong whitelist
    """
    # Lấy IP address của client
    client_ip = request.client.host if request.client else None

    if not client_ip:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot determine client IP address"
        )

    # Query tất cả WiFiConfig có is_active = True và có ip_subnet
    active_configs = db.query(WiFiConfig).filter(
        WiFiConfig.is_active == True,
        WiFiConfig.ip_subnet.isnot(None),
        WiFiConfig.ip_subnet != ""
    ).all()

    # Nếu không có config nào active → từ chối truy cập
    if not active_configs:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: No approved WiFi networks configured. You must connect from an approved network."
        )

    # Kiểm tra xem client IP có nằm trong bất kỳ subnet nào không
    is_allowed = False
    allowed_subnets = []

    try:
        client_ip_obj = ipaddress.ip_address(client_ip)

        for config in active_configs:
            try:
                # Parse subnet (ví dụ: "192.168.10.0/24")
                subnet = ipaddress.ip_network(config.ip_subnet, strict=False)
                allowed_subnets.append(str(subnet))

                # Kiểm tra IP có nằm trong subnet này không
                if client_ip_obj in subnet:
                    is_allowed = True
                    break

            except (ValueError, TypeError) as e:
                # Subnet không hợp lệ, bỏ qua và log warning
                print(f"Warning: Invalid subnet format in WiFiConfig {config.id}: {config.ip_subnet} - {str(e)}")
                continue

    except ValueError:
        # Client IP không hợp lệ
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Invalid client IP address: {client_ip}"
        )

    # Nếu IP không được phép → từ chối truy cập
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Your IP ({client_ip}) is not in the approved network range. "
                   f"You must connect from an approved WiFi network. "
                   f"Allowed subnets: {', '.join(allowed_subnets)}"
        )

    # IP được phép → trả về current_user
    return current_user
