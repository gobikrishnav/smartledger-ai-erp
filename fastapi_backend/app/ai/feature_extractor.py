from typing import List
import numpy as np
from sqlalchemy.orm import Session
from app.models.invoice import InvoiceHeader, InvoiceLineItem

def extract_features(invoice: InvoiceHeader, items: List[InvoiceLineItem], db: Session) -> np.ndarray:
    """
    Returns 6-dimensional feature vector for Isolation Forest:
    [invoice_amount, discount_pct, items_count, time_delta_hours, hour_of_day, deviation_from_avg]
    """
    invoice_amount = float(invoice.grand_total)
    discount_pct = float(invoice.discount_amount) / float(invoice.subtotal) if invoice.subtotal > 0 else 0
    items_count = len(items)
    
    # Calculate time delta hours (stubbed to 1 for simplicity if no prev invoice)
    time_delta_hours = 1.0 
    
    hour_of_day = invoice.invoice_date.hour
    
    # Deviation from customer avg
    customer_avg_invoice = 1000.0  # Placeholder for avg calculation
    deviation_from_avg = (invoice_amount - customer_avg_invoice) / max(1, customer_avg_invoice)
    
    return np.array([invoice_amount, discount_pct, items_count, time_delta_hours, hour_of_day, deviation_from_avg]).reshape(1, -1)
