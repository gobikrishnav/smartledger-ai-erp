const mongoose = require('mongoose');

const mlModelMetricSchema = new mongoose.Schema({
  model_name: {
    type: String,
    enum: ['Stacked-Bi-LSTM', 'Isolation-Forest', 'Apriori-FPGrowth', 'Inventory-Velocity'],
    required: true,
    unique: true,
    index: true
  },
  model_type: { type: String, required: true }, // e.g. 'Deep Learning Time-Series', 'Unsupervised Anomaly Detector'
  version: { type: String, default: 'v2.4.0' },
  status: { type: String, enum: ['ONLINE', 'TRAINING', 'IDLE', 'DEGRADED'], default: 'ONLINE' },
  rmse: { type: Number },
  mae: { type: Number },
  f1_score: { type: Number },
  precision: { type: Number },
  recall: { type: Number },
  accuracy_percent: { type: Number, default: 95.0 },
  average_latency_ms: { type: Number, default: 18.5 },
  rules_mined_count: { type: Number, default: 0 },
  training_records_count: { type: Number, default: 2400 },
  last_trained_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MLModelMetric', mlModelMetricSchema);
