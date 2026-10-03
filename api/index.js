const app = require('../backend/app');
const { connectDB } = require('../backend/config/db');

let isConnected = false;

module.exports = async (req, res) => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (err) {
      console.error('Database connection error in Vercel Serverless handler:', err.message);
    }
  }
  return app(req, res);
};
