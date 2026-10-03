const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  business_name: { type: String, required: true, default: 'SmartLedger Industrial Solutions Pvt Ltd' },
  legal_name: { type: String, default: 'SmartLedger Industrial Solutions Private Limited' },
  gstin: { type: String, required: false, default: '' },
  pan_number: { type: String, default: '' },
  state_code: { type: String, required: true, default: '29' },
  state_name: { type: String, default: 'Karnataka' },
  email: { type: String, default: 'finance@smartledger.ai' },
  phone: { type: String, default: '+91 80 4123 8900' },
  address: {
    line1: { type: String, default: 'Plot 42, Electronic City Phase 1' },
    city: { type: String, default: 'Bangalore' },
    state: { type: String, default: 'Karnataka' },
    pincode: { type: String, default: '560100' },
    country: { type: String, default: 'India' }
  },
  currency: { type: String, default: 'INR' },
  currency_symbol: { type: String, default: '₹' },
  industry: { type: String, default: 'General Trade' },
  is_onboarded: { type: Boolean, default: false },
  invoice_prefix: { type: String, default: 'INV-2026-' },
  default_payment_terms: { type: String, default: 'Net 30' },
  tax_configuration: {
    hsn_default_rate: { type: Number, default: 18 },
    enable_composition_scheme: { type: Boolean, default: false },
    round_off_totals: { type: Boolean, default: true }
  },
  ai_alert_thresholds: {
    low_stock_buffer_days: { type: Number, default: 7 },
    payment_delay_variance_days: { type: Number, default: 14 },
    min_market_basket_lift: { type: Number, default: 1.2 },
    cashflow_runway_warning_months: { type: Number, default: 2 }
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Business', businessSchema);
