const mongoose = require('mongoose');

const productCategorySchema = new mongoose.Schema({
  category_name: { type: String, required: true, unique: true, trim: true },
  gst_rate: { type: Number, required: true, min: 0, max: 28 }, // e.g. 0, 5, 12, 18, 28
  hsn_sac_code: { type: String, required: true, trim: true },
  description: { type: String },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ProductCategory', productCategorySchema);
