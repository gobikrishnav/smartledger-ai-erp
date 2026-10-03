const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  role: { 
    type: String, 
    enum: [
      'CASHIER', 'WAREHOUSE_MGR', 'BUSINESS_OWNER', 'ADMIN',
      'Cashier', 'Warehouse Manager', 'Business Owner', 'Admin'
    ], 
    default: 'CASHIER',
    required: true 
  },
  branch_id: { type: String, default: 'BR-CENTRAL-01' },
  created_at: { type: Date, default: Date.now }
});

staffUserSchema.pre('save', async function (next) {
  if (!this.isModified('password_hash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
  next();
});

staffUserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

module.exports = mongoose.model('StaffUser', staffUserSchema);
