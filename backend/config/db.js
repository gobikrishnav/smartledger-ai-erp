const dns = require('dns');
const mongoose = require('mongoose');

// Configure reliable DNS servers for MongoDB Atlas SRV resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/smartledger_erp_db';
  const isAtlas = uri.startsWith('mongodb+srv://') || uri.includes('mongodb.net');

  try {
    console.log(`🔌 Initializing database connection... (${isAtlas ? 'MongoDB Atlas Cloud Cluster' : 'Local MongoDB Instance'})`);
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    });

    console.log(`✓ [DATABASE ONLINE] Connected to MongoDB: ${mongoose.connection.host} / DB: ${mongoose.connection.name}`);
  } catch (err) {
    console.error('! MongoDB connection failed:', err.message);
    console.error('  Connection URI schema:', uri.split('@')[1] ? `...@${uri.split('@')[1]}` : uri);
    
    // Auto-retry connection after 3 seconds
    setTimeout(async () => {
      try {
        console.log('🔄 Retrying MongoDB connection...');
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000
        });
        console.log(`✓ MongoDB reconnected successfully: ${mongoose.connection.host}`);
      } catch (retryErr) {
        console.error('! MongoDB reconnect attempt failed:', retryErr.message);
      }
    }, 3000);
  }
};

module.exports = { connectDB };
