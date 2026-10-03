from fastapi import APIRouter, Depends
from typing import List
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.services.pos_service import POSService
from app.models.invoice import InvoiceHeader

router = APIRouter()

class InvoiceItemSchema(BaseModel):
    product_id: str
    quantity: int
    model_config = ConfigDict(from_attributes=True)

class CreateInvoiceRequest(BaseModel):
    customer_id: str = None
    items: List[InvoiceItemSchema]
    payment_mode: str
    discount_amount: float = 0
    idempotency_key: str
    model_config = ConfigDict(from_attributes=True)

@router.post("/invoices", status_code=201)
def create_invoice(request: CreateInvoiceRequest, db: Session = Depends(get_db), user = Depends(require_role("Cashier", "Business_Owner"))):
    return POSService(db).create_invoice(request.model_dump(), str(user.user_id), str(user.branch_id))

@router.get("/invoices")
def get_invoices(db: Session = Depends(get_db), user = Depends(require_role("Cashier", "Business_Owner"))):
    invoices = db.query(InvoiceHeader).filter_by(branch_id=user.branch_id).limit(10).all()
    return invoices

@router.get("/invoices/{invoice_id}")
def get_invoice(invoice_id: str, db: Session = Depends(get_db), user = Depends(require_role("Cashier", "Business_Owner"))):
    return db.query(InvoiceHeader).filter_by(invoice_id=invoice_id).first()

@router.get("/invoices/profit-summary")
def get_profit_summary(db: Session = Depends(get_db), user = Depends(require_role("Business_Owner"))):
    return {"status": "success", "profit": 5000}
