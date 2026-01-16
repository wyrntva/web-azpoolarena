# AZ POOLARENA Backend API

FastAPI-based backend for the AZ POOLARENA financial management system.

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the database credentials:

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/azpoolarena
SECRET_KEY=your-secret-key-here
```

### 3. Create Database

Create a PostgreSQL database named `azpoolarena`:

```sql
CREATE DATABASE azpoolarena;
```

### 4. Run Migrations & Seed Data

```bash
python seed.py
```

This will:
- Drop existing tables
- Create all tables
- Seed initial data (roles, users, sample transactions)

### 5. Start Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

## Default Accounts

After seeding, you can log in with:

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Accountant Account:**
- Username: `accountant`
- Password: `accountant123`

**Staff Accounts:**
- Username: `staff1` / `staff2`
- Password: `staff123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Users (Admin only)
- `POST /api/users` - Create user
- `GET /api/users` - List users
- `GET /api/users/{id}` - Get user
- `PATCH /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Receipt Types (Accountant/Admin)
- `POST /api/receipt-types` - Create receipt type
- `GET /api/receipt-types` - List receipt types
- `GET /api/receipt-types/{id}` - Get receipt type
- `PATCH /api/receipt-types/{id}` - Update receipt type
- `DELETE /api/receipt-types/{id}` - Delete receipt type

### Receipts (Accountant/Admin)
- `POST /api/receipts` - Create receipt
- `GET /api/receipts` - List receipts (with filters)
- `GET /api/receipts/{id}` - Get receipt
- `PATCH /api/receipts/{id}` - Update receipt
- `DELETE /api/receipts/{id}` - Delete receipt

### Revenues (Accountant/Admin)
- `POST /api/revenues` - Create revenue
- `GET /api/revenues` - List revenues
- `GET /api/revenues/{id}` - Get revenue
- `GET /api/revenues/by-date/{date}` - Get revenue by date
- `PATCH /api/revenues/{id}` - Update revenue
- `DELETE /api/revenues/{id}` - Delete revenue

### Exchanges (Accountant/Admin)
- `POST /api/exchanges` - Create exchange
- `GET /api/exchanges` - List exchanges
- `GET /api/exchanges/{id}` - Get exchange
- `PATCH /api/exchanges/{id}` - Update exchange
- `DELETE /api/exchanges/{id}` - Delete exchange

## Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app entry point
│   ├── core/
│   │   ├── config.py          # Configuration settings
│   │   ├── security.py        # Password hashing
│   │   └── jwt.py             # JWT token management
│   ├── db/
│   │   ├── base.py            # SQLAlchemy base
│   │   └── session.py         # Database session
│   ├── models/
│   │   └── __init__.py        # Database models
│   ├── schemas/
│   │   ├── auth.py            # Auth schemas
│   │   ├── user.py            # User schemas
│   │   ├── receipt.py         # Receipt schemas
│   │   ├── revenue.py         # Revenue schemas
│   │   └── exchange.py        # Exchange schemas
│   ├── api/
│   │   ├── auth.py            # Auth endpoints
│   │   ├── users.py           # User endpoints
│   │   ├── receipt_types.py   # Receipt type endpoints
│   │   ├── receipts.py        # Receipt endpoints
│   │   ├── revenues.py        # Revenue endpoints
│   │   └── exchanges.py       # Exchange endpoints
│   └── dependencies/
│       └── permissions.py      # Auth & permission dependencies
├── alembic/                    # Database migrations
├── seed.py                     # Database seeding script
├── requirements.txt            # Python dependencies
└── .env                        # Environment variables
```

## Role-Based Access Control

- **Admin**: Full access to all endpoints
- **Accountant**: Access to financial modules (receipts, revenues, exchanges)
- **Staff**: Limited read-only access

## Technologies

- **FastAPI**: Modern web framework
- **SQLAlchemy**: ORM for database operations
- **PostgreSQL**: Production database
- **Alembic**: Database migrations
- **JWT**: Authentication tokens
- **Pydantic**: Data validation
