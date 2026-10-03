const mongoose = require('mongoose');

const riskAuditLogSchema = new mongoose.Schema({
  log_id: { type: String, required: true, unique: true, index: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customer_name: { type: String },
  invoice_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  invoice_no: { type: String },
  anomaly_score: { type: Number, required: true },
  risk_score: { type: Number, required: true },
  risk_level: { type: String, enum: ['NORMAL', 'MEDIUM', 'HIGH_RISK'], default: 'NORMAL' },
  is_anomaly: { type: Boolean, default: false },
  decision_action: { type: String, required: true },
  status: { type: String, enum: ['ACTIVE', 'RESOLVED', 'OVERRIDDEN'], default: 'ACTIVE' },
  override_by: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffUser' },
  override_notes: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RiskAuditLog', riskAuditLogSchema);
