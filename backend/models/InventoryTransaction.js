const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  transaction_id: { type: String, required: true, unique: true, index: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  product_sku: { type: String, required: true },
  product_name: { type: String, required: true },
  invoice_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  invoice_no: { type: String },
  purchase_order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  transaction_type: {
    type: String,
    enum: ['SALE', 'RESTOCK', 'GRN', 'ADJUSTMENT', 'RETURN'],
    required: true,
    index: true
  },
  quantity_delta: { type: Number, required: true }, // Negative for sales, positive for restocks
  previous_stock: { type: Number, required: true },
  new_stock: { type: Number, required: true },
  unit_cost: { type: Number, default: 0 },
  batch_number: { type: String },
  notes: { type: String },
  performed_by: { type: String, default: 'SYSTEM' },
  timestamp: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
