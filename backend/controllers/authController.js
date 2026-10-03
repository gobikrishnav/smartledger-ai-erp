const jwt = require('jsonwebtoken');
const StaffUser = require('../models/StaffUser');

exports.login = async (req, res) => {
  try {
    const credential = req.body.username || req.body.email;
    const { password } = req.body;

    if (!credential || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required.' });
    }

    const trimmedCred = credential.toString().trim();

    // Lookup by username or email (case-insensitive)
    const user = await StaffUser.findOne({
      $or: [
        { username: new RegExp(`^${trimmedCred}$`, 'i') },
        { email: trimmedCred.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid staff username/email or password.' });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid staff username/email or password.' });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        branch_id: user.branch_id
      },
      process.env.JWT_SECRET || 'smartledger_ai_super_secret_key_2026',
      { expiresIn: '7d' }
    );

    const userObj = user.toObject();
    delete userObj.password_hash;

    res.json({
      status: 'success',
      token,
      user: userObj
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error during login.' });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, full_name, email, username, password, role, branch_id } = req.body;

    if (!password || (!email && !username)) {
      return res.status(400).json({ error: 'Email/Username and password are required for account registration.' });
    }

    const resolvedEmail = (email || '').trim().toLowerCase();
    const resolvedUsername = (username || (email ? email.split('@')[0] : `user_${Date.now()}`)).trim();
    const resolvedFullName = (full_name || name || resolvedUsername).trim();

    // Check if email or username already taken
    const existing = await StaffUser.findOne({
      $or: [
        { username: resolvedUsername },
        ...(resolvedEmail ? [{ email: resolvedEmail }] : [])
      ]
    });

    if (existing) {
      return res.status(400).json({ error: 'An account with this email or username already exists.' });
    }

    // Role mapping & normalization
    let normalizedRole = 'CASHIER';
    const rawRole = (role || '').toString().trim().toUpperCase();
    if (rawRole.includes('OWNER') || rawRole.includes('ADMIN')) {
      normalizedRole = 'BUSINESS_OWNER';
    } else if (rawRole.includes('WAREHOUSE') || rawRole.includes('MGR')) {
      normalizedRole = 'WAREHOUSE_MGR';
    } else {
      normalizedRole = 'CASHIER';
    }

    const newUser = new StaffUser({
      username: resolvedUsername,
      full_name: resolvedFullName,
      email: resolvedEmail || `${resolvedUsername}@smartledger.ai`,
      password_hash: password, // Pre-save hook hashes with bcrypt
      role: normalizedRole,
      branch_id: branch_id || (normalizedRole === 'WAREHOUSE_MGR' ? 'WH-MAIN-01' : 'BR-CENTRAL-01')
    });

    await newUser.save();

    const token = jwt.sign(
      {
        userId: newUser._id,
        username: newUser.username,
        full_name: newUser.full_name,
        role: newUser.role,
        branch_id: newUser.branch_id
      },
      process.env.JWT_SECRET || 'smartledger_ai_super_secret_key_2026',
      { expiresIn: '7d' }
    );

    const userObj = newUser.toObject();
    delete userObj.password_hash;

    res.status(201).json({
      status: 'success',
      message: 'Account successfully registered.',
      token,
      user: userObj
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ error: err.message || 'Registration failed.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await StaffUser.findById(req.user.userId).select('-password_hash');
    if (!user) return res.status(404).json({ error: 'Staff user profile not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
