const dns = require('dns');
const mongoose = require('mongoose');

// Configure reliable DNS servers for MongoDB Atlas SRV resolution
// Cloud container platforms (Render/Heroku) require public recursive DNS (8.8.8.8, 1.1.1.1) to resolve Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  console.warn('DNS server configuration notice:', e.message);
}

function sanitizeMongoUri(rawUri) {
  if (!rawUri) return rawUri;
  const match = rawUri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.+)@([^@]+)$/);
  if (match) {
    const [, protocol, user, pass, hostAndQuery] = match;
    try {
      const decoded = decodeURIComponent(pass);
      const encoded = encodeURIComponent(decoded);
      return `${protocol}${user}:${encoded}@${hostAndQuery}`;
    } catch (e) {
      return rawUri;
    }
  }
  return rawUri;
}

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const rawUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/smartledger_erp_db';
  const uri = sanitizeMongoUri(rawUri);
  const isAtlas = uri.startsWith('mongodb+srv://') || uri.includes('mongodb.net');

  try {
    console.log(`🔌 Initializing database connection... (${isAtlas ? 'MongoDB Atlas Cloud Cluster' : 'Local MongoDB Instance'})`);
    
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    } catch (e) {}

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    });

    console.log(`✓ [DATABASE ONLINE] Connected to MongoDB: ${mongoose.connection.host} / DB: ${mongoose.connection.name}`);
    return mongoose.connection;
  } catch (err) {
    console.error('! MongoDB connection failed:', err.message);
    console.error('  Connection URI schema:', uri.split('@')[1] ? `...@${uri.split('@')[1]}` : uri);
    
    // Auto-retry connection after 3 seconds
    setTimeout(async () => {
      try {
        console.log('🔄 Retrying MongoDB connection...');
        try {
          dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
        } catch (e) {}
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 15000,
          socketTimeoutMS: 45000
        });
        console.log(`✓ MongoDB reconnected successfully: ${mongoose.connection.host}`);
        try {
          const { seedERPDatabase } = require('../utils/seed');
          await seedERPDatabase();
        } catch (seedErr) {
          console.error('Seeding on reconnect error:', seedErr.message);
        }
      } catch (retryErr) {
        console.error('! MongoDB reconnect attempt failed:', retryErr.message);
      }
    }, 3000);
  }
};

module.exports = { connectDB };
