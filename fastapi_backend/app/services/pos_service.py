from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.invoice import InvoiceHeader, InvoiceLineItem
from app.models.inventory import InventoryStorage
from app.models.product import ProductCatalog
from app.services.ledger_service import LedgerService
from app.ai.celery_tasks import analyze_invoice_fraud

class POSService:
    def __init__(self, db: Session):
        self.db = db

    def create_invoice(self, data: dict, cashier_id: str, branch_id: str) -> dict:
        existing = self.db.query(InvoiceHeader).filter_by(idempotency_key=data['idempotency_key']).first()
        if existing:
            return {"invoice_id": str(existing.invoice_id), "invoice_number": existing.invoice_number, "status": "DUPLICATE"}
        
        with self.db.begin_nested():
            seq = self.db.query(InvoiceHeader).count() + 1
            invoice_num = f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{seq:05d}"
            
            subtotal = 0
            cgst_total = 0
            sgst_total = 0
            igst_total = 0
            items_to_add = []
            
            for item in data['items']:
                product = self.db.query(ProductCatalog).filter_by(product_id=item['product_id']).first()
                inventory = self.db.query(InventoryStorage).filter_by(product_id=product.product_id, branch_id=branch_id).with_for_update().first()
                if not inventory or inventory.stock_quantity < item['quantity']:
                    raise HTTPException(status_code=400, detail={"type": "StockError", "title": f"Insufficient stock for {product.product_name}"})
                
                inventory.stock_quantity -= item['quantity']
                line_total = product.base_price * item['quantity']
                subtotal += line_total
                
                tax_rate = product.tax_rate_pct
                cgst_rate = tax_rate / 2
                sgst_rate = tax_rate / 2
                cgst_amt = line_total * (cgst_rate / 100)
                sgst_amt = line_total * (sgst_rate / 100)
                cgst_total += cgst_amt
                sgst_total += sgst_amt
                
                items_to_add.append(InvoiceLineItem(
                    product_id=product.product_id,
                    quantity=item['quantity'],
                    unit_price=product.base_price,
                    cost_price=product.cost_price,
                    cgst_rate=cgst_rate,
                    sgst_rate=sgst_rate,
                    cgst_amount=cgst_amt,
                    sgst_amount=sgst_amt,
                    line_total=line_total + cgst_amt + sgst_amt
                ))
            
            discount = data.get('discount_amount', 0)
            grand_total = subtotal + cgst_total + sgst_total - discount
            
            invoice = InvoiceHeader(
                invoice_number=invoice_num,
                branch_id=branch_id,
                cashier_id=cashier_id,
                customer_id=data.get('customer_id'),
                subtotal=subtotal,
                cgst_amount=cgst_total,
                sgst_amount=sgst_total,
                igst_amount=0,
                discount_amount=discount,
                grand_total=grand_total,
                payment_status='PAID',
                payment_mode=data['payment_mode'],
                idempotency_key=data['idempotency_key']
            )
            self.db.add(invoice)
            self.db.flush()
            
            for line_item in items_to_add:
                line_item.invoice_id = invoice.invoice_id
                self.db.add(line_item)
                
            LedgerService.post_invoice_entries(invoice, items_to_add, self.db)
            
        self.db.commit()
        analyze_invoice_fraud.delay(str(invoice.invoice_id))
        
        return {"invoice_id": str(invoice.invoice_id), "invoice_number": invoice_num, "status": "CREATED"}
