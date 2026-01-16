from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.dependencies.permissions import get_current_user
from app.models import User, WiFiConfig
from app.schemas.attendance import WiFiConfigCreate, WiFiConfigUpdate, WiFiConfigResponse
from typing import List

router = APIRouter(prefix="/api/wifi-configs", tags=["WiFi Configurations"])


@router.post("", response_model=WiFiConfigResponse, status_code=status.HTTP_201_CREATED)
def create_wifi_config(
    config: WiFiConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create WiFi configurations"
        )

    db_config = WiFiConfig(**config.model_dump())
    db.add(db_config)
    db.commit()
    db.refresh(db_config)

    return WiFiConfigResponse.model_validate(db_config)


@router.get("", response_model=List[WiFiConfigResponse])
def get_wifi_configs(
    is_active: bool = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view WiFi configurations"
        )

    query = db.query(WiFiConfig)

    if is_active is not None:
        query = query.filter(WiFiConfig.is_active == is_active)

    configs = query.order_by(WiFiConfig.created_at.desc()).all()

    return [WiFiConfigResponse.model_validate(c) for c in configs]


@router.get("/approved", response_model=List[dict])
def get_approved_wifi_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    configs = db.query(WiFiConfig).filter(WiFiConfig.is_active == True).all()

    return [
        {
            "id": config.id,
            "ssid": config.ssid,
            "description": config.description
        }
        for config in configs
    ]


@router.get("/{config_id}", response_model=WiFiConfigResponse)
def get_wifi_config(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view WiFi configurations"
        )

    config = db.query(WiFiConfig).filter(WiFiConfig.id == config_id).first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="WiFi configuration not found"
        )

    return WiFiConfigResponse.model_validate(config)


@router.put("/{config_id}", response_model=WiFiConfigResponse)
def update_wifi_config(
    config_id: int,
    config_update: WiFiConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update WiFi configurations"
        )

    config = db.query(WiFiConfig).filter(WiFiConfig.id == config_id).first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="WiFi configuration not found"
        )

    update_data = config_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(config, field, value)

    db.commit()
    db.refresh(config)

    return WiFiConfigResponse.model_validate(config)


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_wifi_config(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete WiFi configurations"
        )

    config = db.query(WiFiConfig).filter(WiFiConfig.id == config_id).first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="WiFi configuration not found"
        )

    db.delete(config)
    db.commit()

    return None
