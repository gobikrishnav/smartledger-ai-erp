const mongoose = require('mongoose');

const ledgerEntrySchema = new mongoose.Schema({
  entry_id: { type: String, required: true, unique: true, index: true },
  date: { type: Date, default: Date.now, index: true },
  reference_no: { type: String, required: true, index: true }, // e.g. INV-2026-00001, PAY-2026-0001
  reference_id: { type: mongoose.Schema.Types.ObjectId, index: true },
  transaction_type: {
    type: String,
    enum: ['INVOICE', 'PAYMENT', 'PURCHASE', 'EXPENSE', 'ADJUSTMENT', 'CANCELLATION'],
    required: true,
    index: true
  },
  account_name: { type: String, required: true }, // e.g. 'Accounts Receivable', 'Sales Revenue', 'Cash & Bank', 'Output GST'
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customer_name: { type: String },
  description: { type: String, required: true },
  debit: { type: Number, default: 0, min: 0 },
  credit: { type: Number, default: 0, min: 0 },
  running_balance: { type: Number, default: 0 },
  is_immutable: { type: Boolean, default: true },
  created_by: { type: String, default: 'SYSTEM' },
  created_at: { type: Date, default: Date.now }
});

// Guard against hard deletion of immutable ledger records
ledgerEntrySchema.pre('deleteOne', { document: true, query: false }, function (next) {
  if (this.is_immutable) {
    return next(new Error('Immutable Ledger Violation: Financial ledger entries cannot be deleted.'));
  }
  next();
});

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);
