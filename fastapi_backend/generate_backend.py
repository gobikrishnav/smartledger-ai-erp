import os
from pathlib import Path

base_dir = r"c:\Users\GOBI KRISHNA V\Downloads\smartledger-ai-mern-stack\fastapi_backend"

files = {
    "requirements.txt": """fastapi==0.115.0
uvicorn[standard]==0.30.6
sqlalchemy==2.0.35
alembic==1.13.3
psycopg2-binary==2.9.10
python-jose[cryptography]==3.3.0
passlib[argon2]==1.7.4
python-multipart==0.0.12
pydantic-settings==2.5.2
pydantic==2.9.2
celery==5.4.0
redis==5.1.1
scikit-learn==1.5.2
numpy==1.26.4
pandas==2.2.3
joblib==1.4.2
httpx==0.27.2
pytest==8.3.3
pytest-asyncio==0.24.0
python-dotenv==1.0.1
websockets==13.1
argon2-cffi==23.1.0""",
    
    ".env.example": """DATABASE_URL=postgresql://smartledger:smartledger123@localhost:5432/smartledger_erp
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=smartledger_enterprise_ultra_secure_jwt_key_2026_production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
AI_MODEL_PATH=./ai_models/isolation_forest.joblib
ENVIRONMENT=development""",

    "Dockerfile": """FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends build-essential libpq-dev && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]""",

    "app/__init__.py": "",
    "app/core/__init__.py": "",
    "app/models/__init__.py": "",
    "app/services/__init__.py": "",
    "app/ai/__init__.py": "",
    "app/api/__init__.py": "",
    "app/api/v1/__init__.py": "",
    "app/websockets/__init__.py": "",
    "tests/__init__.py": "",

    "app/core/config.py": """from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://smartledger:smartledger123@localhost:5432/smartledger_erp"
    REDIS_URL: str = "redis://localhost:6379/0"
    JWT_SECRET_KEY: str = "smartledger_enterprise_ultra_secure_jwt_key_2026_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"
    AI_MODEL_PATH: str = "./ai_models/isolation_forest.joblib"
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()""",

    "app/core/database.py": """from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()""",

    "app/core/security.py": """from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError
from fastapi import HTTPException
from app.core.config import settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail={"type": "AuthenticationError", "title": "Invalid token"})""",

    "app/core/dependencies.py": """from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import UserAccount

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserAccount:
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail={"type": "AuthenticationError", "title": "Invalid token payload"})
    user = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail={"type": "AuthenticationError", "title": "User not found or inactive"})
    return user

class RoleChecker:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, user: UserAccount = Depends(get_current_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(status_code=403, detail={"type": "AuthorizationError", "title": "Insufficient permissions"})
        return user

def require_role(*roles: str):
    return Depends(RoleChecker(list(roles)))""",

    "app/models/user.py": """from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from uuid import uuid4
from app.core.database import Base

class UserAccount(Base):
    __tablename__ = 'user_account'
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(500), nullable=False)
    full_name = Column(String(200), nullable=False)
    phone = Column(String(20))
    role = Column(Enum('Business_Owner', 'Warehouse_Manager', 'Cashier', name='user_role'), nullable=False)
    branch_id = Column(UUID(as_uuid=True), ForeignKey('store_branch.branch_id'), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)""",

    "app/models/branch.py": """from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from uuid import uuid4
from app.core.database import Base

class StoreBranch(Base):
    __tablename__ = 'store_branch'
    branch_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    branch_code = Column(String(50), unique=True, nullable=False)
    branch_name = Column(String(255), nullable=False)
    address = Column(String(500))
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(20))
    business_owner_id = Column(UUID(as_uuid=True), ForeignKey('user_account.user_id'))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)""",

    "app/models/customer.py": """from sqlalchemy import Column, String, Numeric, Integer, Float, Enum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from uuid import uuid4
from app.core.database import Base

class CustomerMaster(Base):
    __tablename__ = 'customer_master'
    customer_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    customer_name = Column(String(255), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    email = Column(String(255))
    pincode = Column(String(20))
    gstin = Column(String(50))
    loyalty_points = Column(Integer, default=0)
    credit_limit = Column(Numeric(12, 2), default=0)
    outstanding_balance = Column(Numeric(12, 2), default=0)
    risk_score = Column(Float, default=0.0)
    risk_status = Column(Enum('NORMAL', 'FLAGGED', name='customer_risk_status'), default='NORMAL')
    created_at = Column(DateTime, default=datetime.utcnow)""",

    "app/models/product.py": """from sqlalchemy import Column, String, Numeric, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from uuid import uuid4
from app.core.database import Base

class ProductCategory(Base):
    __tablename__ = 'product_category'
    category_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    category_name = Column(String(100), unique=True, nullable=False)
    description = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

class ProductCatalog(Base):
    __tablename__ = 'product_catalog'
    product_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    sku_code = Column(String(50), unique=True, nullable=False)
    barcode = Column(String(100), unique=True)
    product_name = Column(String(255), nullable=False)
    description = Column(String(1000))
    category_id = Column(UUID(as_uuid=True), ForeignKey('product_category.category_id'))
    base_price = Column(Numeric(12, 2), nullable=False)
    cost_price = Column(Numeric(12, 2), nullable=False)
    tax_rate_pct = Column(Numeric(5, 2), nullable=False)
    hsn_sac_code = Column(String(50))
    reorder_level = Column(Integer, default=10)
    supplier_name = Column(String(255))
    warehouse_manager_id = Column(UUID(as_uuid=True), ForeignKey('user_account.user_id'))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)""",

    "app/models/inventory.py": """from sqlalchemy import Column, String, Integer, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from uuid import uuid4
from app.core.database import Base

class InventoryStorage(Base):
    __tablename__ = 'inventory_storage'
    storage_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey('product_catalog.product_id'), nullable=False)
    branch_id = Column(UUID(as_uuid=True), ForeignKey('store_branch.branch_id'), nullable=False)
    aisle_number = Column(String(50))
    bin_location = Column(String(50))
    stock_quantity = Column(Integer, default=0)
    batch_number = Column(String(100))
    expiry_date = Column(Date, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    __table_args__ = (UniqueConstraint('product_id', 'branch_id', 'batch_number', name='uix_inventory'),)""",

    "app/models/invoice.py": """from sqlalchemy import Column, String, Numeric, Integer, Enum, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from uuid import uuid4
from app.core.database import Base

class InvoiceHeader(Base):
    __tablename__ = 'invoice_header'
    invoice_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    invoice_number = Column(String(50), unique=True, nullable=False)
    branch_id = Column(UUID(as_uuid=True), ForeignKey('store_branch.branch_id'), nullable=False)
    cashier_id = Column(UUID(as_uuid=True), ForeignKey('user_account.user_id'), nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey('customer_master.customer_id'), nullable=True)
    invoice_date = Column(DateTime, default=datetime.utcnow)
    subtotal = Column(Numeric(14, 2), default=0)
    cgst_amount = Column(Numeric(12, 2), default=0)
    sgst_amount = Column(Numeric(12, 2), default=0)
    igst_amount = Column(Numeric(12, 2), default=0)
    discount_amount = Column(Numeric(12, 2), default=0)
    grand_total = Column(Numeric(14, 2), default=0)
    payment_status = Column(Enum('PAID', 'PENDING', 'VOID', name='payment_status_enum'), default='PAID')
    payment_mode = Column(Enum('CASH', 'CARD', 'UPI', 'SPLIT', name='payment_mode_enum'), default='CASH')
    idempotency_key = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class InvoiceLineItem(Base):
    __tablename__ = 'invoice_line_item'
    item_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey('invoice_header.invoice_id', ondelete='CASCADE'), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey('product_catalog.product_id'), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    cost_price = Column(Numeric(12, 2), nullable=False)
    cgst_rate = Column(Numeric(5, 2), default=0)
    sgst_rate = Column(Numeric(5, 2), default=0)
    cgst_amount = Column(Numeric(10, 2), default=0)
    sgst_amount = Column(Numeric(10, 2), default=0)
    line_total = Column(Numeric(14, 2), nullable=False)""",

    "app/models/ledger.py": """from sqlalchemy import Column, String, Numeric, Enum, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from uuid import uuid4
from app.core.database import Base

class GeneralLedgerEntry(Base):
    __tablename__ = 'general_ledger_entry'
    entry_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey('invoice_header.invoice_id'), nullable=True)
    entry_date = Column(DateTime, default=datetime.utcnow)
    account_type = Column(Enum('ACCOUNTS_RECEIVABLE', 'SALES_REVENUE', 'TAX_PAYABLE', 'COGS', 'INVENTORY_ASSET', name='account_type_enum'), nullable=False)
    debit_amount = Column(Numeric(14, 2), default=0)
    credit_amount = Column(Numeric(14, 2), default=0)
    description = Column(String(500))
    branch_id = Column(UUID(as_uuid=True), ForeignKey('store_branch.branch_id'), nullable=False)""",

    "app/models/ai_audit.py": """from sqlalchemy import Column, String, Boolean, Float, Text, Enum, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from uuid import uuid4
from app.core.database import Base

class AIFraudAuditLog(Base):
    __tablename__ = 'ai_fraud_audit_log'
    audit_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey('invoice_header.invoice_id'), unique=True, nullable=False)
    risk_score = Column(Float, nullable=False)
    anomaly_detected = Column(Boolean, default=False)
    feature_vector_json = Column(JSON, nullable=False)
    model_version = Column(String(50), nullable=False)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey('user_account.user_id'), nullable=True)
    review_status = Column(Enum('PENDING', 'OVERRIDDEN', 'CONFIRMED', name='audit_status_enum'), default='PENDING')
    review_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    review_timestamp = Column(DateTime, nullable=True)""",

    "app/models/shift.py": """from sqlalchemy import Column, Integer, Numeric, Date, Time, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from app.core.database import Base

class CashierShiftAssignment(Base):
    __tablename__ = 'cashier_shift_assignment'
    assignment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    cashier_id = Column(UUID(as_uuid=True), ForeignKey('user_account.user_id'), nullable=False)
    branch_id = Column(UUID(as_uuid=True), ForeignKey('store_branch.branch_id'), nullable=False)
    counter_number = Column(Integer, nullable=False)
    shift_date = Column(Date, nullable=False)
    shift_start = Column(Time, nullable=False)
    shift_end = Column(Time, nullable=True)
    opening_cash = Column(Numeric(12, 2), nullable=False)
    closing_cash = Column(Numeric(12, 2), nullable=True)
    status = Column(Enum('ACTIVE', 'CLOSED', name='shift_status_enum'), default='ACTIVE')""",

    "app/main.py": """from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.websockets.router import ws_router
from app.core.database import engine, Base

# Import all models to ensure they are registered with Base
from app.models.user import UserAccount
from app.models.branch import StoreBranch
from app.models.customer import CustomerMaster
from app.models.product import ProductCategory, ProductCatalog
from app.models.inventory import InventoryStorage
from app.models.invoice import InvoiceHeader, InvoiceLineItem
from app.models.ledger import GeneralLedgerEntry
from app.models.ai_audit import AIFraudAuditLog
from app.models.shift import CashierShiftAssignment

def create_application() -> FastAPI:
    app = FastAPI(
        title='Smart Ledger AI — Enterprise ERP',
        description='Production-grade RBAC ERP with real-time fraud detection',
        version='2.0.0',
        docs_url='/docs',
        redoc_url='/redoc'
    )
    app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

    @app.on_event('startup')
    async def startup():
        Base.metadata.create_all(bind=engine)

    app.include_router(api_router, prefix="/api/v1")
    app.include_router(ws_router)

    @app.get('/api/health')
    def health():
        return {'status': 'ONLINE', 'system': 'Smart Ledger AI Enterprise ERP', 'version': '2.0.0'}

    return app

app = create_application()""",

    "app/api/v1/router.py": """from fastapi import APIRouter
from app.api.v1 import auth, pos, inventory, analytics, anomalies, customers, branches

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(pos.router, prefix="/pos", tags=["POS"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(anomalies.router, prefix="/ai/anomalies", tags=["AI Anomalies"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customers"])
api_router.include_router(branches.router, prefix="/branches", tags=["Branches"])""",

    "app/api/v1/auth.py": """from fastapi import APIRouter
router = APIRouter()""",
    "app/api/v1/pos.py": """from fastapi import APIRouter
router = APIRouter()""",
    "app/api/v1/inventory.py": """from fastapi import APIRouter
router = APIRouter()""",
    "app/api/v1/analytics.py": """from fastapi import APIRouter
router = APIRouter()""",
    "app/api/v1/anomalies.py": """from fastapi import APIRouter
router = APIRouter()""",
    "app/api/v1/customers.py": """from fastapi import APIRouter
router = APIRouter()""",
    "app/api/v1/branches.py": """from fastapi import APIRouter
router = APIRouter()""",
    "app/websockets/router.py": """from fastapi import APIRouter, WebSocket
router = APIRouter()""",
    "app/celery_config.py": """from celery import Celery
from app.core.config import settings

celery_app = Celery(
    'smartledger',
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=['app.ai.celery_tasks']
)
celery_app.conf.update(
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='Asia/Kolkata',
    enable_utc=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)"""
}

for rel_path, content in files.items():
    full_path = Path(base_dir) / rel_path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

print(f"Generated {len(files)} files.")
