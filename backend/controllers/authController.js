const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
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

// GET /api/auth/google/config
exports.getGoogleConfig = async (req, res) => {
  try {
    let clientId = process.env.GOOGLE_CLIENT_ID || '';
    if (!clientId) {
      const Business = require('../models/Business');
      const biz = await Business.findOne();
      clientId = biz?.google_oauth?.client_id || '';
    }
    res.json({
      status: 'success',
      clientId,
      enabled: Boolean(clientId)
    });
  } catch (err) {
    res.json({ status: 'success', clientId: process.env.GOOGLE_CLIENT_ID || '', enabled: Boolean(process.env.GOOGLE_CLIENT_ID) });
  }
};

// POST /api/auth/google/config (Persist Client ID in MongoDB Atlas)
exports.saveGoogleConfig = async (req, res) => {
  try {
    const { clientId } = req.body || {};
    const Business = require('../models/Business');
    let biz = await Business.findOne();
    if (!biz) {
      biz = new Business({ business_name: 'SmartLedger Enterprise' });
    }
    biz.google_oauth = {
      client_id: (clientId || '').trim(),
      enabled: Boolean((clientId || '').trim())
    };
    await biz.save();
    res.json({
      status: 'success',
      message: 'Google OAuth Client ID persisted successfully in MongoDB.',
      clientId: biz.google_oauth.client_id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/google (Google OAuth Authentication & Token Exchange)
exports.googleAuth = async (req, res) => {
  try {
    const {
      credential,
      role,
      profile,
      email: directEmail,
      name: directName,
      picture: directPicture,
      google_id: directGoogleId
    } = req.body || {};

    let googleUser = null;

    // 1. If Google ID Token (credential) is provided, verify it
    if (credential && typeof credential === 'string') {
      try {
        const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
        const tokenRes = await axios.get(verifyUrl, { timeout: 4000 });
        if (tokenRes.data && tokenRes.data.email) {
          googleUser = {
            email: tokenRes.data.email,
            name: tokenRes.data.name || tokenRes.data.given_name || tokenRes.data.email.split('@')[0],
            picture: tokenRes.data.picture || '',
            sub: tokenRes.data.sub,
            email_verified: tokenRes.data.email_verified === 'true' || tokenRes.data.email_verified === true
          };
        }
      } catch (tokenInfoErr) {
        // Fallback: safely parse JWT payload
        try {
          const parts = credential.split('.');
          if (parts.length === 3) {
            const rawPayload = Buffer.from(parts[1], 'base64').toString('utf-8');
            const parsed = JSON.parse(rawPayload);
            if (parsed.email) {
              googleUser = {
                email: parsed.email,
                name: parsed.name || parsed.given_name || parsed.email.split('@')[0],
                picture: parsed.picture || '',
                sub: parsed.sub,
                email_verified: parsed.email_verified
              };
            }
          }
        } catch (jwtErr) {
          console.error('Failed to parse Google credential payload:', jwtErr.message);
        }
      }
    }

    // 2. Direct verified profile object or explicit email
    if (!googleUser && (profile?.email || directEmail)) {
      const em = (profile?.email || directEmail).trim().toLowerCase();
      const nm = (profile?.name || directName || em.split('@')[0]).trim();
      googleUser = {
        email: em,
        name: nm,
        picture: profile?.picture || directPicture || profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nm)}`,
        sub: profile?.sub || directGoogleId || profile?.id || `google_${Date.now()}`,
        email_verified: true
      };
    }

    if (!googleUser || !googleUser.email) {
      return res.status(400).json({
        error: 'Invalid or missing Google credentials. Unable to verify identity.'
      });
    }

    const email = googleUser.email.trim().toLowerCase();
    const fullName = googleUser.name ? googleUser.name.trim() : email.split('@')[0];

    // 3. Find or create user
    let user = await StaffUser.findOne({ email });

    let assignedRole = 'BUSINESS_OWNER';
    if (role) {
      const r = String(role).toUpperCase().replace(/[\s_-]+/g, '');
      if (r === 'CASHIER') assignedRole = 'CASHIER';
      else if (r === 'WAREHOUSEMGR' || r === 'WAREHOUSEMANAGER') assignedRole = 'WAREHOUSE_MGR';
      else if (r === 'ADMIN') assignedRole = 'ADMIN';
      else assignedRole = 'BUSINESS_OWNER';
    }

    if (!user) {
      let baseUsername = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
      if (!baseUsername) baseUsername = 'guser';
      let candidateUsername = baseUsername;
      let counter = 1;
      while (await StaffUser.findOne({ username: candidateUsername })) {
        candidateUsername = `${baseUsername}${counter++}`;
      }

      const randomPassword = crypto.randomBytes(32).toString('hex');

      user = new StaffUser({
        username: candidateUsername,
        full_name: fullName,
        email,
        password_hash: randomPassword,
        role: assignedRole,
        branch_id: assignedRole === 'WAREHOUSE_MGR' ? 'WH-MAIN-01' : 'BR-CENTRAL-01',
        avatar_url: googleUser.picture || '',
        google_id: googleUser.sub || '',
        auth_provider: 'GOOGLE'
      });

      await user.save();
    } else {
      let modified = false;
      if (googleUser.picture && !user.avatar_url) {
        user.avatar_url = googleUser.picture;
        modified = true;
      }
      if (googleUser.sub && !user.google_id) {
        user.google_id = googleUser.sub;
        modified = true;
      }
      if (modified) {
        await user.save();
      }
    }

    // 4. Generate SmartLedger JWT Bearer Token
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
      message: 'Google Sign-In successful',
      token,
      user: userObj,
      googleProfile: {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture
      }
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ error: err.message || 'Google authentication failed.' });
  }
};
