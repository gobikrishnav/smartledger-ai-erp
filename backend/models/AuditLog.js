const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  log_id: { type: String, required: true, unique: true, index: true },
  user_id: { type: String, default: 'SYSTEM' },
  user_name: { type: String, default: 'System Operator' },
  user_role: { type: String, default: 'Admin' },
  action: {
    type: String,
    enum: [
      'LOGIN',
      'LOGOUT',
      'INVOICE_CREATE',
      'INVOICE_FINALIZE',
      'INVOICE_CANCEL',
      'CUSTOMER_CREATE',
      'PRODUCT_UPDATE',
      'ROLE_CHANGE',
      'TAX_CONFIG_CHANGE',
      'PAYMENT_RECORD',
      'INVENTORY_RESTOCK',
      'SECURITY_ALERT'
    ],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['SECURITY', 'INVOICING', 'INVENTORY', 'ANOMALY', 'COMPLIANCE', 'RBAC'],
    default: 'INVOICING'
  },
  entity: { type: String, required: true }, // e.g. 'Invoice', 'Customer', 'Product'
  entity_id: { type: String },
  previous_value: { type: mongoose.Schema.Types.Mixed },
  new_value: { type: mongoose.Schema.Types.Mixed },
  ip_address: { type: String, default: '127.0.0.1' },
  severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], default: 'INFO' },
  status: { type: String, enum: ['SUCCESS', 'FLAGGED', 'BLOCKED', 'ALERT'], default: 'SUCCESS' },
  timestamp: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
