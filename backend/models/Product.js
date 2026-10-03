const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku_barcode: { type: String, required: true, unique: true, trim: true, index: true },
  product_name: { type: String, required: true, trim: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', required: true },
  unit_price: { type: Number, required: true, min: 0 },
  cost_price: { type: Number, required: true, min: 0 },
  stock_quantity: { type: Number, default: 0 },
  reorder_level: { type: Number, default: 10 },
  batch_number: { type: String, default: 'BAT-2026-001' },
  expiry_date: { type: Date },
  supplier_name: { type: String, default: 'Universal Industrial Logistics' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
