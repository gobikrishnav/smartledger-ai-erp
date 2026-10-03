const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  invoice_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku_barcode: { type: String, required: true },
  product_name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit_price: { type: Number, required: true, min: 0 },
  cost_price: { type: Number, default: 0 },
  taxable_amount: { type: Number, required: true },
  gst_rate: { type: Number, required: true }, // e.g. 18
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  line_total: { type: Number, required: true }
});

module.exports = mongoose.model('InvoiceItem', invoiceItemSchema);
