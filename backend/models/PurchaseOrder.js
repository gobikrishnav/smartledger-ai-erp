const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  sku_barcode: { type: String, required: true },
  product_name: { type: String, required: true },
  quantity_ordered: { type: Number, required: true, min: 1 },
  unit_cost: { type: Number, required: true },
  total_cost: { type: Number, required: true }
});

const purchaseOrderSchema = new mongoose.Schema({
  po_id: { type: String, required: true, unique: true, index: true },
  supplier_name: { type: String, required: true },
  supplier_email: { type: String, default: 'procurement@supplier.com' },
  warehouse_mgr_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffUser' },
  warehouse_mgr_name: { type: String, default: 'Warehouse Manager' },
  branch_id: { type: String, default: 'WH-MAIN-01' },
  items: [poItemSchema],
  status: { 
    type: String, 
    enum: ['DRAFT', 'DISPATCHED', 'RECEIVED'], 
    default: 'DISPATCHED' 
  },
  total_estimated_cost: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  dispatched_at: { type: Date, default: Date.now },
  received_at: { type: Date }
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
