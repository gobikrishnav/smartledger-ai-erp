const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

// GET /api/products - list all products with enriched aliases
router.get('/', verifyToken, async (req, res) => {
  try {
    const products = await Product.find().populate('category_id').sort({ product_name: 1 });
    const enriched = products.map(p => {
      const obj = p.toObject();
      obj.sku = p.sku_barcode;
      obj.productName = p.product_name;
      obj.unitPrice = p.unit_price;
      obj.costPrice = p.cost_price;
      obj.stockQty = p.stock_quantity;
      obj.reorderPoint = p.reorder_level;
      obj.category = p.category_id?.category_name || 'General Goods';
      obj.hsnSacCode = p.category_id?.hsn_code || '8471';
      return obj;
    });
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id - single product
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category_id');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const obj = product.toObject();
    obj.sku = product.sku_barcode;
    obj.productName = product.product_name;
    obj.unitPrice = product.unit_price;
    obj.costPrice = product.cost_price;
    obj.stockQty = product.stock_quantity;
    obj.reorderPoint = product.reorder_level;
    obj.category = product.category_id?.category_name || 'General Goods';
    obj.hsnSacCode = product.category_id?.hsn_code || '8471';
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products - create product
router.post('/', verifyToken, authorizeRoles('WAREHOUSE_MGR', 'BUSINESS_OWNER'), async (req, res) => {
  try {
    const {
      sku,
      sku_barcode,
      productName,
      product_name,
      unitPrice,
      unit_price,
      costPrice,
      cost_price,
      stockQty,
      stock_quantity,
      reorderPoint,
      reorder_level,
      category,
      category_id,
      hsnSacCode,
      batch_number,
      expiry_date,
      supplier_name
    } = req.body;

    const finalSku = sku || sku_barcode;
    const finalName = productName || product_name;
    const finalUnitPrice = Number(unitPrice || unit_price || 0);
    const finalCostPrice = Number(costPrice || cost_price || finalUnitPrice * 0.65);
    const finalStock = Number(stockQty || stock_quantity || 0);
    const finalReorder = Number(reorderPoint || reorder_level || 10);

    if (!finalSku || !finalName || isNaN(finalUnitPrice)) {
      return res.status(400).json({ error: 'SKU/Barcode, Product Name, and Unit Price are required.' });
    }

    const existing = await Product.findOne({ sku_barcode: finalSku });
    if (existing) {
      return res.status(400).json({ error: `Product with SKU '${finalSku}' already exists.` });
    }

    let finalCatId = category_id;
    if (!finalCatId) {
      const catName = category || 'General Merchandise';
      let catDoc = await ProductCategory.findOne({ category_name: catName });
      if (!catDoc) {
        catDoc = new ProductCategory({
          category_name: catName,
          hsn_code: hsnSacCode || '8471',
          gst_rate: 18,
          description: 'Standard product category'
        });
        await catDoc.save();
      }
      finalCatId = catDoc._id;
    }

    const product = new Product({
      sku_barcode: finalSku,
      product_name: finalName,
      category_id: finalCatId,
      unit_price: finalUnitPrice,
      cost_price: finalCostPrice,
      stock_quantity: finalStock,
      reorder_level: finalReorder,
      batch_number: batch_number || `BAT-${new Date().getFullYear()}-001`,
      expiry_date: expiry_date ? new Date(expiry_date) : undefined,
      supplier_name: supplier_name || 'Universal Industrial Logistics'
    });

    await product.save();
    const populated = await Product.findById(product._id).populate('category_id');
    const obj = populated.toObject();
    obj.sku = populated.sku_barcode;
    obj.productName = populated.product_name;
    obj.unitPrice = populated.unit_price;
    obj.costPrice = populated.cost_price;
    obj.stockQty = populated.stock_quantity;
    obj.reorderPoint = populated.reorder_level;
    obj.category = populated.category_id?.category_name || 'General Goods';
    obj.hsnSacCode = populated.category_id?.hsn_code || '8471';

    res.status(201).json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id - update product
router.put('/:id', verifyToken, authorizeRoles('WAREHOUSE_MGR', 'BUSINESS_OWNER'), async (req, res) => {
  try {
    const updateData = {};
    if (req.body.productName || req.body.product_name) updateData.product_name = req.body.productName || req.body.product_name;
    if (req.body.unitPrice || req.body.unit_price) updateData.unit_price = Number(req.body.unitPrice || req.body.unit_price);
    if (req.body.costPrice || req.body.cost_price) updateData.cost_price = Number(req.body.costPrice || req.body.cost_price);
    if (req.body.stockQty !== undefined || req.body.stock_quantity !== undefined) {
      updateData.stock_quantity = Number(req.body.stockQty ?? req.body.stock_quantity);
    }
    if (req.body.reorderPoint !== undefined || req.body.reorder_level !== undefined) {
      updateData.reorder_level = Number(req.body.reorderPoint ?? req.body.reorder_level);
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('category_id');
    if (!updated) return res.status(404).json({ error: 'Product not found' });

    const obj = updated.toObject();
    obj.sku = updated.sku_barcode;
    obj.productName = updated.product_name;
    obj.unitPrice = updated.unit_price;
    obj.costPrice = updated.cost_price;
    obj.stockQty = updated.stock_quantity;
    obj.reorderPoint = updated.reorder_level;
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', verifyToken, authorizeRoles('ADMIN', 'BUSINESS_OWNER'), async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
