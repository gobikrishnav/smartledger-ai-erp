const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  full_name: { type: String, required: true, trim: true },
  phone_number: { type: String, required: true, unique: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  gstin: { type: String, trim: true },
  credit_limit: { type: Number, default: 50000 },
  current_balance: { type: Number, default: 0 },
  risk_status: { type: String, enum: ['SAFE', 'FLAGGED'], default: 'SAFE' },
  risk_score: { type: Number, default: 15.0 },
  overdue_days: { type: Number, default: 0 },
  avg_ticket_size: { type: Number, default: 15000 },
  transaction_frequency: { type: Number, default: 8 },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Customer', customerSchema);
