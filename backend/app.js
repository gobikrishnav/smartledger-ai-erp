require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

// Route imports
const authRoutes = require('./routes/authRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const productRoutes = require('./routes/productRoutes');
const poRoutes = require('./routes/poRoutes');
const aiRoutes = require('./routes/aiRoutes');
const customerRoutes = require('./routes/customerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const ledgerRoutes = require('./routes/ledgerRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const reportRoutes = require('./routes/reportRoutes');
const insightRoutes = require('./routes/insightRoutes');
const auditRoutes = require('./routes/auditRoutes');
const businessRoutes = require('./routes/businessRoutes');

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/po', poRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/clients', customerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/business', businessRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'ONLINE',
    system: 'SmartLedger AI ERP Backend Gateway',
    version: '2.0.0',
    db_connected: mongoose.connection.readyState === 1,
    db_host: mongoose.connection.host || 'connecting',
    timestamp: new Date().toISOString()
  });
});

// Serve Frontend SPA in Production
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.status(200).json({
      status: 'ONLINE',
      system: 'SmartLedger AI ERP Backend Gateway',
      version: '2.0.0',
      message: 'Backend API is active. Build frontend SPA via: npm run build'
    });
  });
}

// Global 404 Handler (for unmatched API endpoints)
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Endpoint '${req.originalUrl}' not found.` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Uncaught Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
