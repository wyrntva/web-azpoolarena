from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.api import auth, users, roles, receipt_types, receipts, revenues, exchanges, safes, debts, inventories, units, categories
from app.api.inventory_transactions import router_in, router_out
from app.api import attendances, work_schedules, wifi_configs, internal_dashboard, payroll, expense_report, attendance_settings
from app.api.qr_access import internal_router as qr_access_internal, public_router as qr_access_public
from app.core.config import settings

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="AZ POOLARENA API",
    description="Financial Management System API",
    version="1.0.0"
)

# 1. CORS Middleware (Add early)
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]
# Ensure localhost variant for development
if "http://localhost:5173" not in origins:
    origins.append("http://localhost:5173")
if "http://127.0.0.1:5173" not in origins:
    origins.append("http://127.0.0.1:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Rate Limiter Setup
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 3. Include Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(roles.router)
app.include_router(receipt_types.router)
app.include_router(receipts.router)
app.include_router(revenues.router)
app.include_router(exchanges.router)
app.include_router(safes.router)
app.include_router(debts.router)
app.include_router(categories.router)
app.include_router(inventories.router)
app.include_router(units.router)
app.include_router(router_in)
app.include_router(router_out)
app.include_router(attendances.router)
app.include_router(work_schedules.router)
app.include_router(wifi_configs.router)
app.include_router(attendance_settings.router)
app.include_router(internal_dashboard.router)
app.include_router(payroll.router)
app.include_router(expense_report.router)
app.include_router(qr_access_internal)
app.include_router(qr_access_public)

@app.get("/")
def root():
    return {
        "message": "Welcome to AZ POOLARENA API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
