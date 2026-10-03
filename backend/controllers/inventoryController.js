const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const { emitStockLowAlert } = require('../services/socketService');

// Get all products with batch & expiry telemetry
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('category_id').sort({ product_name: 1 });
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const enriched = products.map(p => {
      const pObj = p.toObject();
      let expiryStatus = 'SAFE';
      if (p.expiry_date) {
        if (p.expiry_date < now) {
          expiryStatus = 'EXPIRED';
        } else if (p.expiry_date <= thirtyDaysFromNow) {
          expiryStatus = 'NEAR_EXPIRY';
        }
      }
      pObj.expiry_status = expiryStatus;
      pObj.current_stock = p.stock_quantity;
      pObj.stock_quantity = p.stock_quantity;
      pObj.stockQty = p.stock_quantity;
      pObj.is_low_stock = p.stock_quantity <= p.reorder_level;
      pObj.sku = p.sku_barcode;
      pObj.productName = p.product_name;
      pObj.unitPrice = p.unit_price;
      pObj.costPrice = p.cost_price;
      pObj.reorderPoint = p.reorder_level;
      pObj.category = p.category_id?.category_name || 'General Goods';
      pObj.hsnSacCode = p.category_id?.hsn_code || '8471';
      return pObj;
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Restock inventory directly
exports.restockProduct = async (req, res) => {
  try {
    const { productId, product_id, quantity, notes } = req.body;
    const id = productId || product_id;
    const qty = Number(quantity);

    if (!id || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Valid Product ID and quantity greater than 0 are required.' });
    }

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    product.stock_quantity += qty;
    await product.save();

    res.json({
      status: 'success',
      message: `Restocked ${qty} units for '${product.product_name}'. New stock: ${product.stock_quantity}`,
      product
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add new Product SKU
exports.createProduct = async (req, res) => {
  try {
    const {
      sku_barcode,
      product_name,
      category_id,
      unit_price,
      cost_price,
      stock_quantity = 0,
      reorder_level = 10,
      batch_number = 'BAT-2026-001',
      expiry_date,
      supplier_name
    } = req.body;

    const existing = await Product.findOne({ sku_barcode });
    if (existing) {
      return res.status(400).json({ error: `Product with Barcode '${sku_barcode}' already exists.` });
    }

    const product = new Product({
      sku_barcode,
      product_name,
      category_id,
      unit_price: Number(unit_price),
      cost_price: Number(cost_price || (unit_price * 0.7)),
      stock_quantity: Number(stock_quantity),
      reorder_level: Number(reorder_level),
      batch_number,
      expiry_date: expiry_date ? new Date(expiry_date) : undefined,
      supplier_name: supplier_name || 'Universal Industrial Logistics'
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Inward Shipment Handling (GRN - Goods Received Note)
// Records delivery shipments from suppliers, increasing stock on hand
exports.recordInwardGRN = async (req, res) => {
  try {
    const { product_id, sku_barcode, quantity_received, inward_quantity, batch_number, expiry_date, unit_cost, supplier_name } = req.body;

    let product = null;
    if (product_id) {
      product = await Product.findById(product_id);
    } else if (sku_barcode) {
      product = await Product.findOne({ sku_barcode });
    }

    if (!product) {
      return res.status(404).json({ error: 'Product SKU not found for GRN restock.' });
    }

    const qty = Number(quantity_received || inward_quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Valid received quantity greater than zero is required.' });
    }

    // Increment physical inventory on hand
    product.stock_quantity += qty;
    if (batch_number) product.batch_number = batch_number;
    if (expiry_date) product.expiry_date = new Date(expiry_date);
    if (unit_cost) product.cost_price = Number(unit_cost);
    if (supplier_name) product.supplier_name = supplier_name;

    await product.save();

    res.json({
      status: 'success',
      message: `GRN Recorded: Added ${qty} units to '${product.product_name}'. New stock: ${product.stock_quantity}.`,
      product
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Low-Stock Threshold Alerts
exports.getLowStockAlerts = async (req, res) => {
  try {
    const lowStockItems = await Product.find({
      $expr: { $lte: ['$stock_quantity', '$reorder_level'] }
    }).populate('category_id');

    res.json(lowStockItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Batch & Expiry Date Audit
exports.getExpiryAudit = async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const criticalItems = await Product.find({
      expiry_date: { $lte: thirtyDaysFromNow }
    }).populate('category_id');

    res.json(criticalItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
