from sqlalchemy.orm import Session
from app.models.ledger import GeneralLedgerEntry
from datetime import datetime

class LedgerService:
    @staticmethod
    def post_invoice_entries(invoice, items, db: Session):
        entries = []
        entries.append(GeneralLedgerEntry(
            invoice_id=invoice.invoice_id,
            account_type='ACCOUNTS_RECEIVABLE',
            debit_amount=invoice.grand_total,
            credit_amount=0,
            description="Accounts Receivable",
            branch_id=invoice.branch_id
        ))
        entries.append(GeneralLedgerEntry(
            invoice_id=invoice.invoice_id,
            account_type='SALES_REVENUE',
            debit_amount=0,
            credit_amount=invoice.subtotal - invoice.discount_amount,
            description="Sales Revenue",
            branch_id=invoice.branch_id
        ))
        tax_total = invoice.cgst_amount + invoice.sgst_amount + invoice.igst_amount
        if tax_total > 0:
            entries.append(GeneralLedgerEntry(
                invoice_id=invoice.invoice_id,
                account_type='TAX_PAYABLE',
                debit_amount=0,
                credit_amount=tax_total,
                description="Tax Payable",
                branch_id=invoice.branch_id
            ))
        
        total_cogs = sum([item.cost_price * item.quantity for item in items])
        entries.append(GeneralLedgerEntry(
            invoice_id=invoice.invoice_id,
            account_type='COGS',
            debit_amount=total_cogs,
            credit_amount=0,
            description="Cost of Goods Sold",
            branch_id=invoice.branch_id
        ))
        entries.append(GeneralLedgerEntry(
            invoice_id=invoice.invoice_id,
            account_type='INVENTORY_ASSET',
            debit_amount=0,
            credit_amount=total_cogs,
            description="Inventory Asset",
            branch_id=invoice.branch_id
        ))
        db.add_all(entries)
