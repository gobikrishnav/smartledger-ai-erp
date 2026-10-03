/**
 * Quick Test Tool: Verify MongoDB Atlas Connection String
 * 
 * Usage:
 *   node test_atlas_connection.js "mongodb+srv://user:pass@cluster0.abcde.mongodb.net/test?retryWrites=true&w=majority"
 */

const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}
const mongoose = require('mongoose');

async function testConnection() {
  const uri = process.argv[2] || process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.log('Usage: node test_atlas_connection.js "<YOUR_MONGODB_ATLAS_URI>"');
    process.exit(1);
  }

  const isAtlas = uri.startsWith('mongodb+srv://') || uri.includes('mongodb.net');
  console.log(`\n🔍 Testing MongoDB Connection...`);
  console.log(`Cluster Type: ${isAtlas ? 'MongoDB Atlas Cloud' : 'Local MongoDB'}`);
  console.log(`Host Target: ${uri.split('@')[1] ? uri.split('@')[1].split('/')[0] : 'localhost'}`);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 30000
    });

    console.log(`\n✅ [SUCCESS] Successfully connected to MongoDB!`);
    console.log(`Database Name: ${mongoose.connection.name}`);
    console.log(`Server Host:   ${mongoose.connection.host}`);
    console.log(`Ready State:   ${mongoose.connection.readyState === 1 ? 'Connected (1)' : 'Unknown'}`);
    
    await mongoose.disconnect();
    console.log(`✓ Test finished cleanly.\n`);
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ [FAILED] Could not connect to MongoDB Atlas.`);
    console.error(`Error: ${err.message}`);
    console.error(`\nCommon Troubleshooting Tips:`);
    console.error(`1. Check Network Access in Atlas: Ensure IP Access List includes 0.0.0.0/0 (allow from anywhere).`);
    console.error(`2. Check Database User: Ensure username and password are correct and user has readWriteAnyDatabase permission.`);
    console.error(`3. Check Special Characters: If your password has symbols like @, #, $, URL-encode them (e.g. @ -> %40).`);
    process.exit(1);
  }
}

testConnection();
