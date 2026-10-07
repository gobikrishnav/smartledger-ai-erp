const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoice_no: { type: String, required: true, unique: true, index: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customer_name: { type: String, default: 'Retail Walk-in Customer' },
  customer_phone: { type: String },
  cashier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffUser', required: true },
  cashier_name: { type: String },
  branch_id: { type: String, default: 'BR-CENTRAL-01' },
  terminal_geo_token: {
    lat: { type: Number, default: 12.9716 },
    lng: { type: Number, default: 77.5946 },
    accuracy: { type: Number, default: 10.0 },
    verified: { type: Boolean, default: true }
  },
  subtotal: { type: Number, required: true, min: 0 },
  total_tax: { type: Number, required: true, min: 0 },
  cgst_total: { type: Number, default: 0 },
  sgst_total: { type: Number, default: 0 },
  igst_total: { type: Number, default: 0 },
  discount_amount: { type: Number, default: 0 },
  net_total: { type: Number, required: true, min: 0 },
  other_charges: { type: Number, default: 0 },
  packaging_charges: { type: Number, default: 0 },
  total_cases: { type: Number, default: 0 },
  transport_name: { type: String, default: '' },
  vehicle_number: { type: String, default: '' },
  amount_in_words: { type: String, default: '' },
  terms_conditions: { type: String, default: 'Thank you for doing business with us.' },
  received_amount: { type: Number, default: 0 },
  balance_amount: { type: Number, default: 0 },
  company_name: { type: String, default: 'VELAVAN CRACKERS' },
  crypto_hash: { type: String, required: true }, // SHA-256 Block Hash
  prev_hash: { type: String, default: '0000000000000000000000000000000000000000000000000000000000000000' },
  payment_method: { 
    type: String, 
    enum: ['CASH', 'CARD', 'UPI', 'CREDIT'], 
    default: 'UPI' 
  },
  payment_status: { 
    type: String, 
    enum: ['PAID', 'CREDIT_PENDING', 'VOID', 'DRAFT', 'PENDING'], 
    default: 'PAID' 
  },
  tax_payloads: [
    {
      type: { type: String, enum: ['CGST', 'SGST', 'IGST'] },
      rate_percentage: { type: Number, default: 0 },
      tax_amount: { type: Number, default: 0 }
    }
  ],
  invoice_timestamp: { type: Date, default: Date.now }
});

// Enforce Business Rule (Section 5.5): Finalized financial ledgers cannot be deleted
invoiceSchema.pre('deleteOne', { document: true, query: false }, function (next) {
  if (this.payment_status !== 'VOID') {
    return next(new Error('Immutable Ledger Rule Violation: Finalized invoices cannot be deleted. Issue a formal cancellation.'));
  }
  next();
});

invoiceSchema.pre('findOneAndDelete', function (next) {
  return next(new Error('Immutable Ledger Rule Violation: Finalized invoices cannot be deleted. Issue a formal cancellation.'));
});

module.exports = mongoose.model('Invoice', invoiceSchema);
