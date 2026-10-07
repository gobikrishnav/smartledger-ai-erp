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
const candidateDistPaths = [
  path.resolve(__dirname, '../client/dist'),
  path.resolve(__dirname, '../dist'),
  path.resolve(__dirname, 'dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), 'dist')
];

let clientDistPath = null;
for (const p of candidateDistPaths) {
  if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
    clientDistPath = p;
    break;
  }
}

if (clientDistPath) {
  console.log(`📦 Serving Frontend SPA from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SmartLedger AI ERP — Cloud Gateway</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          body { background: #060b18; color: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
          .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 40px; max-width: 650px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.5); backdrop-filter: blur(12px); }
          .badge { display: inline-block; background: rgba(34,197,94,0.15); border: 1px solid #22c55e; color: #4ade80; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 20px; }
          h1 { font-size: 26px; font-weight: 800; margin-bottom: 12px; background: linear-gradient(135deg, #60a5fa, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
          .box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 14px; font-size: 13px; }
          .box-label { color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
          .box-value { color: #e2e8f0; font-weight: 600; }
          .btn { display: inline-block; background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 8px; font-size: 14px; transition: opacity 0.2s; }
          .btn:hover { opacity: 0.9; }
          .links { margin-top: 24px; display: flex; gap: 16px; font-size: 13px; }
          .links a { color: #60a5fa; text-decoration: none; }
          .links a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">● Render Web Gateway Online</div>
          <h1>SmartLedger AI ERP</h1>
          <p>The enterprise API gateway and Machine Learning predictive engine are active and running in high-performance cloud mode.</p>
          <div class="grid">
            <div class="box">
              <div class="box-label">Node Runtime</div>
              <div class="box-value">${process.version} (Linux/Render)</div>
            </div>
            <div class="box">
              <div class="box-label">Database Cluster</div>
              <div class="box-value">MongoDB Atlas Cloud</div>
            </div>
            <div class="box">
              <div class="box-label">Product Catalog</div>
              <div class="box-value">187 Sivakasi Fireworks SKUs</div>
            </div>
            <div class="box">
              <div class="box-label">Real-Time Gateway</div>
              <div class="box-value">Socket.io Active</div>
            </div>
          </div>
          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <a class="btn" href="/api/health">Verify System Health (/api/health)</a>
            <a class="btn" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);" href="/api/products">View Products API</a>
          </div>
          <div class="links">
            <a href="/api/invoices">Invoices Endpoint</a>
            <a href="/api/analytics/cashflow">AI Cashflow Endpoint</a>
            <a href="/api/analytics/credit-risk">AI Credit Risk</a>
          </div>
        </div>
      </body>
      </html>
    `);
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
