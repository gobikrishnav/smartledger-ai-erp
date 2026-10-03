const express = require('express');
const router = express.Router();
const RiskAuditLog = require('../models/RiskAuditLog');
const Product = require('../models/Product');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);

// In-memory read state tracker for real-time alerts
const readNotificationIds = new Set();

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const notifications = [];

    // 1. Fetch risk audit logs
    const riskAudits = await RiskAuditLog.find().sort({ created_at: -1 }).limit(15);
    riskAudits.forEach(audit => {
      const id = String(audit._id);
      notifications.push({
        _id: id,
        id,
        title: `Credit Risk Anomaly: ${audit.customer_name}`,
        message: `High risk score ${audit.risk_score} detected on Invoice ${audit.invoice_no}. Recommended action: ${audit.decision_action}`,
        type: 'risk',
        severity: audit.risk_level === 'HIGH_RISK' ? 'danger' : 'warning',
        isRead: readNotificationIds.has(id),
        read: readNotificationIds.has(id),
        createdAt: audit.created_at,
        time: audit.created_at
      });
    });

    // 2. Fetch low stock items
    const lowStock = await Product.find({
      $expr: { $lte: ['$stock_quantity', '$reorder_level'] }
    }).limit(10);

    lowStock.forEach(prod => {
      const id = `stock_${prod._id}`;
      notifications.push({
        _id: id,
        id,
        title: `Low Stock Alert: ${prod.product_name}`,
        message: `Remaining stock is ${prod.stock_quantity} units (Reorder threshold: ${prod.reorder_level}). Auto-PO recommended.`,
        type: 'warning',
        severity: prod.stock_quantity === 0 ? 'danger' : 'warning',
        isRead: readNotificationIds.has(id),
        read: readNotificationIds.has(id),
        createdAt: prod.created_at || new Date(),
        time: prod.created_at || new Date()
      });
    });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res) => {
  readNotificationIds.add(String(req.params.id));
  res.json({ success: true, message: 'Notification marked as read.' });
});

// PUT /api/notifications/read-all
router.put('/read-all', async (req, res) => {
  try {
    const riskAudits = await RiskAuditLog.find().select('_id');
    riskAudits.forEach(a => readNotificationIds.add(String(a._id)));
    const lowStock = await Product.find({
      $expr: { $lte: ['$stock_quantity', '$reorder_level'] }
    }).select('_id');
    lowStock.forEach(p => readNotificationIds.add(`stock_${p._id}`));

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
