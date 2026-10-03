/**
 * SmartLedger AI ERP — WebSocket Gateway (Socket.io)
 * Real-time event channels for POS, Warehouse, and Owner dashboards.
 */

let ioInstance = null;

function initSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`📡 Client connected to SmartLedger Socket.io Gateway: [${socket.id}]`);

    socket.on('join_role_room', (role) => {
      socket.join(role);
      console.log(`Socket ${socket.id} joined role room: ${role}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: [${socket.id}]`);
    });
  });

  return ioInstance;
}

function getIO() {
  return ioInstance;
}

// 1. Broadcast Stock Low Alert to Warehouse Managers
function emitStockLowAlert(product) {
  if (ioInstance) {
    ioInstance.to('WAREHOUSE_MGR').emit('stock:low_alert', {
      product_id: product._id,
      sku_barcode: product.sku_barcode,
      product_name: product.product_name,
      stock_quantity: product.stock_quantity,
      reorder_level: product.reorder_level,
      alert: `CRITICAL: ${product.product_name} dropped to ${product.stock_quantity} units (Reorder point: ${product.reorder_level}).`,
      timestamp: new Date().toISOString()
    });
    // Also emit globally for live notification drawers
    ioInstance.emit('notification:feed', {
      type: 'STOCK_ALERT',
      message: `Low Stock: ${product.product_name} (${product.stock_quantity} remaining)`,
      timestamp: new Date().toISOString()
    });
  }
}

// 2. Broadcast Credit Risk Anomaly to Business Owners
function emitRiskAnomalyFlag(data) {
  if (ioInstance) {
    ioInstance.to('BUSINESS_OWNER').emit('risk:anomaly_flag', {
      ...data,
      timestamp: new Date().toISOString()
    });
    ioInstance.emit('notification:feed', {
      type: 'RISK_ALERT',
      message: `Risk Alert: Buyer ${data.customer_name} flagged (${data.flag_level})`,
      timestamp: new Date().toISOString()
    });
  }
}

// 3. Broadcast Invoice Creation across active dashboards
function emitInvoiceCreated(invoice) {
  if (ioInstance) {
    ioInstance.emit('invoice:created', invoice);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitStockLowAlert,
  emitRiskAnomalyFlag,
  emitInvoiceCreated
};
