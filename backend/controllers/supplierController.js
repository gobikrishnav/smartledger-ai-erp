const Supplier = require('../models/Supplier');

// GET /api/suppliers
exports.getSuppliers = async (req, res) => {
  try {
    const { search, state_code } = req.query;
    const query = {};

    if (state_code) query.state_code = state_code;
    if (search) {
      query.$or = [
        { supplier_name: new RegExp(search, 'i') },
        { gstin: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }

    const suppliers = await Supplier.find(query).sort({ supplier_name: 1 });

    const formatted = suppliers.map(s => {
      const obj = s.toObject();
      obj.vendorName = s.supplier_name;
      obj.leadTimeDays = s.lead_time_days;
      obj.riskScore = Math.round((5 - s.reliability_score) * 15);
      obj.rating = s.reliability_score;
      obj.terms = s.payment_terms;
      obj.activePOs = s.active_pos_count || 0;
      obj.totalSpend = s.total_spend || 0;
      return obj;
    });

    res.json({
      success: true,
      data: formatted,
      message: 'Suppliers retrieved successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/suppliers
exports.createSupplier = async (req, res) => {
  try {
    const {
      supplier_name,
      vendorName,
      gstin,
      state_code,
      stateCode,
      email,
      phone,
      address,
      lead_time_days,
      leadTimeDays,
      payment_terms,
      terms
    } = req.body;

    const finalName = supplier_name || vendorName;
    const finalGstin = gstin || '29AAACS1234F1Z5';
    const finalState = state_code || stateCode || '29';

    if (!finalName) {
      return res.status(400).json({ success: false, message: 'Supplier name is required.' });
    }

    const supplierId = `SUP-${Date.now().toString().slice(-5)}`;
    const supplier = new Supplier({
      supplier_id: supplierId,
      supplier_name: finalName,
      gstin: finalGstin,
      state_code: finalState,
      email: email || `orders@${finalName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      phone: phone || '+91 80 4000 1100',
      address: address || 'Industrial Corridor, India',
      lead_time_days: Number(lead_time_days || leadTimeDays || 7),
      payment_terms: payment_terms || terms || 'Net 30',
      reliability_score: 4.8
    });

    await supplier.save();

    res.status(201).json({
      success: true,
      data: supplier,
      message: 'Supplier created successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/suppliers/:id
exports.updateSupplier = async (req, res) => {
  try {
    const updated = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, data: updated, message: 'Supplier updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/suppliers/:id
exports.deleteSupplier = async (req, res) => {
  try {
    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
