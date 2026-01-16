"""
Script to create QR Access Device
Run this once to register your Desktop App device
"""
import sys
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.core.qr_access_manager import create_qr_access_device

sys.stdout.reconfigure(encoding='utf-8')

# Device configuration
DEVICE_ID = "PC-QR-01"
DEVICE_NAME = "Reception QR Generator - PC-01"
API_KEY = "azpoolarena-internal-qr-2026"  # Change this to a secure random key

db: Session = SessionLocal()
try:
    device = create_qr_access_device(
        db=db,
        device_id=DEVICE_ID,
        device_name=DEVICE_NAME,
        api_key=API_KEY
    )

    print(f'[SUCCESS] QR Access Device created!')
    print(f'  - Device ID: {device.device_id}')
    print(f'  - Device Name: {device.device_name}')
    print(f'  - Is Active: {device.is_active}')
    print(f'  - Created At: {device.created_at}')
    print('')
    print('IMPORTANT: Save this information for Desktop App configuration!')
    print(f'  DEVICE_ID: {DEVICE_ID}')
    print(f'  API_KEY: {API_KEY}')
    print('')
    print('Add to backend .env file:')
    print(f'  INTERNAL_API_KEY={API_KEY}')
    print('')
    print('Add to Desktop App config:')
    print(f'  DEVICE_ID={DEVICE_ID}')
    print(f'  API_KEY={API_KEY}')

except ValueError as e:
    print(f'[ERROR] {e}')
    print('Device might already exist. Check the database or use a different device_id.')
except Exception as e:
    db.rollback()
    print(f'[ERROR] {e}')
finally:
    db.close()
