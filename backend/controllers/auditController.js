const AuditLog = require('../models/AuditLog');

// GET /api/audit
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, category, severity, action, search } = req.query;
    const query = {};

    if (category && category !== 'ALL') {
      query.category = category;
    }
    if (severity && severity !== 'ALL') {
      query.severity = severity;
    }
    if (action && action !== 'ALL') {
      query.action = action;
    }
    if (search) {
      query.$or = [
        { user_name: new RegExp(search, 'i') },
        { entity: new RegExp(search, 'i') },
        { entity_id: new RegExp(search, 'i') },
        { log_id: new RegExp(search, 'i') }
      ];
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      data: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
        logs
      },
      message: 'Audit logs retrieved'
    });
  } catch (err) {
    console.error('Error in getAuditLogs:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/audit/stats
exports.getAuditStats = async (req, res) => {
  try {
    const total = await AuditLog.countDocuments();
    const criticalCount = await AuditLog.countDocuments({ severity: 'CRITICAL' });
    const warningCount = await AuditLog.countDocuments({ severity: 'WARNING' });
    const securityAlerts = await AuditLog.countDocuments({ category: 'SECURITY' });

    const recentCritical = await AuditLog.find({ severity: 'CRITICAL' })
      .sort({ timestamp: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalLogs: total,
        criticalCount,
        warningCount,
        securityAlerts,
        recentCritical
      },
      message: 'Audit statistics retrieved'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/audit
exports.createAuditLog = async (req, res) => {
  try {
    const { action, category, entity, entity_id, previous_value, new_value, severity, status } = req.body;

    const logId = `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const log = new AuditLog({
      log_id: logId,
      user_id: req.user?.userId || 'SYSTEM',
      user_name: req.user?.full_name || req.user?.name || 'Authorized Operator',
      user_role: req.user?.role || 'Admin',
      action,
      category: category || 'COMPLIANCE',
      entity,
      entity_id,
      previous_value,
      new_value,
      ip_address: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      severity: severity || 'INFO',
      status: status || 'SUCCESS'
    });

    await log.save();

    res.status(201).json({
      success: true,
      data: log,
      message: 'Audit entry recorded'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
