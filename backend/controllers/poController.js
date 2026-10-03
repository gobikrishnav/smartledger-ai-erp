const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');

exports.getPurchaseOrders = async (req, res) => {
  try {
    const pos = await PurchaseOrder.find().sort({ created_at: -1 });
    res.json(pos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createAutomatedPO = async (req, res) => {
  try {
    const { items, supplier_name } = req.body;

    let poItems = [];
    let totalCost = 0;

    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const prod = await Product.findById(item.product_id);
        const qty = Number(item.quantity || 50);
        const cost = Number(item.unit_cost || prod?.cost_price || 1000);
        const lineCost = qty * cost;
        totalCost += lineCost;
        poItems.push({
          product_id: prod?._id,
          sku_barcode: prod?.sku_barcode || item.sku_barcode,
          product_name: prod?.product_name || item.product_name,
          quantity_ordered: qty,
          unit_cost: cost,
          total_cost: lineCost
        });
      }
    } else {
      // Auto-generate for all items below reorder level
      const lowStockProducts = await Product.find({
        $expr: { $lte: ['$stock_quantity', '$reorder_level'] }
      });

      if (lowStockProducts.length === 0) {
        return res.status(400).json({ error: 'No items currently below reorder threshold.' });
      }

      for (const prod of lowStockProducts) {
        const qty = (prod.reorder_level * 3) - prod.stock_quantity;
        const cost = prod.cost_price || (prod.unit_price * 0.7);
        const lineCost = qty * cost;
        totalCost += lineCost;

        poItems.push({
          product_id: prod._id,
          sku_barcode: prod.sku_barcode,
          product_name: prod.product_name,
          quantity_ordered: qty,
          unit_cost: cost,
          total_cost: lineCost
        });
      }
    }

    const count = await PurchaseOrder.countDocuments();
    const poId = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const po = new PurchaseOrder({
      po_id: poId,
      supplier_name: supplier_name || 'Universal Industrial Logistics Corp',
      warehouse_mgr_id: req.user?.userId,
      warehouse_mgr_name: req.user?.full_name || 'Warehouse Manager',
      branch_id: req.user?.branch_id || 'WH-MAIN-01',
      items: poItems,
      status: 'DISPATCHED',
      total_estimated_cost: Number(totalCost.toFixed(2)),
      dispatched_at: new Date()
    });

    await po.save();

    res.status(201).json({
      status: 'success',
      message: `Automated Electronic Purchase Order '${po.po_id}' dispatched to '${po.supplier_name}'.`,
      purchase_order: po
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePOStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ error: 'Purchase Order not found.' });

    po.status = status;

    // When status changes to RECEIVED, auto-increment stock on hand
    if (status === 'RECEIVED') {
      po.received_at = new Date();
      for (const item of po.items) {
        if (item.product_id) {
          const product = await Product.findById(item.product_id);
          if (product) {
            product.stock_quantity += item.quantity_ordered;
            await product.save();
          }
        }
      }
    }

    await po.save();
    res.json({
      status: 'success',
      message: `Purchase order updated to '${status}'.`,
      purchase_order: po
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
