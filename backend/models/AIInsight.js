const mongoose = require('mongoose');

const aiInsightSchema = new mongoose.Schema({
  insight_id: { type: String, required: true, unique: true, index: true },
  module: {
    type: String,
    enum: ['CASH_FLOW', 'INVENTORY', 'CREDIT_RISK', 'MARKET_BASKET'],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'CRITICAL'],
    default: 'INFO',
    index: true
  },
  title: { type: String, required: true },
  explanation: { type: String, required: true },
  impact_metric: { type: String }, // e.g. "Estimated impact: -₹1,20,000"
  recommended_action: { type: String, required: true },
  action_route: { type: String, default: '/dashboard' }, // e.g. "/warehouse", "/pos", "/owner"
  action_payload: { type: mongoose.Schema.Types.Mixed },
  status: {
    type: String,
    enum: ['ACTIVE', 'DISMISSED', 'RESOLVED'],
    default: 'ACTIVE',
    index: true
  },
  confidence_score: { type: Number, default: 0.9, min: 0, max: 1 },
  generated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AIInsight', aiInsightSchema);
