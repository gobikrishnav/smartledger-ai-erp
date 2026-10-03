const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  supplier_id: { type: String, required: true, unique: true, index: true },
  supplier_name: { type: String, required: true, trim: true },
  gstin: { type: String, required: true, trim: true },
  state_code: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, default: 'Industrial Area, India' },
  lead_time_days: { type: Number, default: 7 },
  payment_terms: { type: String, default: 'Net 30' },
  reliability_score: { type: Number, default: 4.8, min: 1, max: 5 },
  risk_level: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
  total_spend: { type: Number, default: 0 },
  active_pos_count: { type: Number, default: 0 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'FLAGGED'], default: 'ACTIVE' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Supplier', supplierSchema);
