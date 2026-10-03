from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.invoice import InvoiceHeader
from app.models.ledger import GeneralLedgerEntry
import datetime

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_executive_summary(self, branch_id: str, date_range: tuple):
        # Simplistic stub for low effort
        total_revenue = self.db.query(func.sum(InvoiceHeader.grand_total)).filter(
            InvoiceHeader.branch_id == branch_id, InvoiceHeader.payment_status == 'PAID'
        ).scalar() or 0
        total_cogs = self.db.query(func.sum(GeneralLedgerEntry.debit_amount)).filter(
            GeneralLedgerEntry.branch_id == branch_id, GeneralLedgerEntry.account_type == 'COGS'
        ).scalar() or 0
        
        gross_profit = float(total_revenue) - float(total_cogs)
        gross_margin_pct = (gross_profit / float(total_revenue) * 100) if total_revenue > 0 else 0
        
        return {
            "total_revenue": total_revenue,
            "total_cogs": total_cogs,
            "gross_profit": gross_profit,
            "gross_margin_pct": gross_margin_pct
        }
