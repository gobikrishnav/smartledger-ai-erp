const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

// List customers or search by phone/name
router.get('/', verifyToken, async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { full_name: new RegExp(search, 'i') },
        { phone_number: new RegExp(search, 'i') },
        { gstin: new RegExp(search, 'i') }
      ];
    }
    const customers = await Customer.find(query).sort({ full_name: 1 });
    const enriched = customers.map(c => {
      const obj = c.toObject();
      obj.name = c.full_name;
      obj.businessName = c.full_name;
      obj.phone = c.phone_number;
      obj.phoneNumber = c.phone_number;
      obj.outstanding_balance = c.current_balance;
      obj.creditLimit = c.credit_limit;
      obj.riskScore = c.risk_score || 0.25;
      obj.status = c.risk_status === 'FLAGGED' ? 'flagged' : 'active';
      obj.stateCode = (c.gstin && c.gstin.length >= 2) ? c.gstin.substring(0, 2) : '29';
      return obj;
    });
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET customer by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const c = await Customer.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Customer not found' });
    const obj = c.toObject();
    obj.name = c.full_name;
    obj.businessName = c.full_name;
    obj.phone = c.phone_number;
    obj.phoneNumber = c.phone_number;
    obj.outstanding_balance = c.current_balance;
    obj.creditLimit = c.credit_limit;
    obj.riskScore = c.risk_score || 0.25;
    obj.status = c.risk_status === 'FLAGGED' ? 'flagged' : 'active';
    obj.stateCode = (c.gstin && c.gstin.length >= 2) ? c.gstin.substring(0, 2) : '29';
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new customer / client
router.post('/', verifyToken, async (req, res) => {
  try {
    const { full_name, businessName, name, phone_number, phone, email, gstin, credit_limit, creditLimit, stateCode } = req.body;
    const finalName = full_name || businessName || name;
    const finalPhone = phone_number || phone || ('98' + Math.floor(10000000 + Math.random() * 90000000));
    const finalLimit = Number(credit_limit || creditLimit || 50000);

    if (!finalName) {
      return res.status(400).json({ error: 'Customer name or business name is required.' });
    }

    const existing = await Customer.findOne({ phone_number: finalPhone });
    if (existing) {
      return res.status(400).json({ error: `Customer with phone '${finalPhone}' already registered.` });
    }

    const customer = new Customer({
      full_name: finalName,
      phone_number: finalPhone,
      email: email || `${finalName.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`,
      gstin: gstin || (stateCode ? `${stateCode}AAACB2026A1Z5` : '29AAACB2026A1Z5'),
      credit_limit: finalLimit
    });
    await customer.save();

    const obj = customer.toObject();
    obj.name = customer.full_name;
    obj.businessName = customer.full_name;
    obj.phone = customer.phone_number;
    obj.phoneNumber = customer.phone_number;
    obj.outstanding_balance = customer.current_balance;
    obj.creditLimit = customer.credit_limit;
    obj.riskScore = customer.risk_score || 0.25;
    obj.status = 'active';
    obj.stateCode = (customer.gstin && customer.gstin.length >= 2) ? customer.gstin.substring(0, 2) : '29';

    res.status(201).json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update customer
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { full_name, businessName, name, phone_number, phone, email, gstin, credit_limit, creditLimit } = req.body;
    const updateData = {};
    if (full_name || businessName || name) updateData.full_name = full_name || businessName || name;
    if (phone_number || phone) updateData.phone_number = phone_number || phone;
    if (email) updateData.email = email;
    if (gstin) updateData.gstin = gstin;
    if (credit_limit || creditLimit) updateData.credit_limit = Number(credit_limit || creditLimit);

    const updated = await Customer.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) return res.status(404).json({ error: 'Customer not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete customer
router.delete('/:id', verifyToken, authorizeRoles('ADMIN', 'BUSINESS_OWNER'), async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
