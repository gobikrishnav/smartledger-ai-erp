require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const { connectDB } = require('./config/db');
const { seedERPDatabase } = require('./utils/seed');
const { initSocket } = require('./services/socketService');

const server = http.createServer(app);

// Socket.io Real-time Setup
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', '*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

initSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 SmartLedger AI ERP Backend Gateway running on http://0.0.0.0:${PORT}`);
  console.log(`📡 Socket.io Gateway Active on port ${PORT}`);

  try {
    await connectDB();
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      await seedERPDatabase();
    }
  } catch (err) {
    console.error('Database connection or seeding failure:', err.message);
  }
});

module.exports = { app, server };
