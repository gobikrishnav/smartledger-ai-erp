const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  payment_no: { type: String, required: true, unique: true, index: true },
  invoice_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
  invoice_no: { type: String, required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customer_name: { type: String, required: true },
  amount_paid: { type: Number, required: true, min: 0 },
  payment_method: {
    type: String,
    enum: ['UPI', 'CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE'],
    default: 'UPI'
  },
  transaction_reference: { type: String }, // e.g. UTR number, UPI transaction ID
  status: {
    type: String,
    enum: ['SUCCESS', 'PENDING', 'FAILED', 'REVERSED'],
    default: 'SUCCESS'
  },
  notes: { type: String },
  recorded_by: { type: String, default: 'Authorized Staff' },
  payment_date: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('Payment', paymentSchema);
