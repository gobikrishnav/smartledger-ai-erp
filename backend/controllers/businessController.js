const Business = require('../models/Business');
const AuditLog = require('../models/AuditLog');

// GET /api/business
exports.getBusinessProfile = async (req, res) => {
  try {
    let business = await Business.findOne();
    if (!business) {
      business = await Business.create({});
    }

    res.json({
      success: true,
      data: business,
      message: 'Business profile retrieved'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/business
exports.updateBusinessProfile = async (req, res) => {
  try {
    let business = await Business.findOne();
    if (!business) {
      business = new Business();
    }

    const previousData = business.toObject();

    // Update allowable fields
    const {
      business_name,
      legal_name,
      gstin,
      pan_number,
      state_code,
      state_name,
      email,
      phone,
      address,
      invoice_prefix,
      default_payment_terms,
      tax_configuration,
      ai_alert_thresholds
    } = req.body;

    if (business_name) business.business_name = business_name;
    if (legal_name) business.legal_name = legal_name;
    if (gstin) business.gstin = gstin;
    if (pan_number) business.pan_number = pan_number;
    if (state_code) business.state_code = state_code;
    if (state_name) business.state_name = state_name;
    if (email) business.email = email;
    if (phone) business.phone = phone;
    if (address) business.address = { ...business.address, ...address };
    if (invoice_prefix) business.invoice_prefix = invoice_prefix;
    if (default_payment_terms) business.default_payment_terms = default_payment_terms;
    if (tax_configuration) business.tax_configuration = { ...business.tax_configuration, ...tax_configuration };
    if (ai_alert_thresholds) business.ai_alert_thresholds = { ...business.ai_alert_thresholds, ...ai_alert_thresholds };
    business.updated_at = new Date();

    await business.save();

    // Log to Audit trail
    try {
      await AuditLog.create({
        log_id: `AUD-BIZ-${Date.now()}`,
        user_id: req.user?.userId || 'SYSTEM',
        user_name: req.user?.full_name || req.user?.name || 'Admin',
        user_role: req.user?.role || 'Admin',
        action: 'TAX_CONFIG_CHANGE',
        category: 'COMPLIANCE',
        entity: 'Business',
        entity_id: business._id.toString(),
        previous_value: previousData,
        new_value: business.toObject(),
        severity: 'WARNING',
        status: 'SUCCESS'
      });
    } catch (auditErr) {
      console.error('Audit logging error:', auditErr.message);
    }

    res.json({
      success: true,
      data: business,
      message: 'Business profile & system settings updated successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/business/setup-wizard
exports.setupWizard = async (req, res) => {
  try {
    const Product = require('../models/Product');
    const Customer = require('../models/Customer');

    let business = await Business.findOne();
    if (!business) {
      business = new Business();
    }

    const {
      business_name,
      legal_name,
      industry,
      currency,
      currency_symbol,
      gstin,
      state_code,
      state_name,
      email,
      phone,
      address,
      invoice_prefix,
      initial_product,
      initial_customer
    } = req.body;

    if (business_name) business.business_name = business_name.trim();
    if (legal_name) business.legal_name = legal_name.trim();
    if (industry) business.industry = industry.trim();
    if (currency) business.currency = currency;
    if (currency_symbol) business.currency_symbol = currency_symbol;
    if (gstin) business.gstin = gstin.trim().toUpperCase();
    if (state_code) business.state_code = state_code;
    if (state_name) business.state_name = state_name;
    if (email) business.email = email.trim();
    if (phone) business.phone = phone.trim();
    if (address) business.address = { ...business.address, ...address };
    if (invoice_prefix) business.invoice_prefix = invoice_prefix;
    business.is_onboarded = true;
    business.updated_at = new Date();

    await business.save();

    let createdProduct = null;
    let createdCustomer = null;

    // Create Initial Product if provided
    if (initial_product && initial_product.product_name) {
      const ProductCategory = require('../models/ProductCategory');
      const catName = (initial_product.category || 'General').trim();
      let category = await ProductCategory.findOne({ category_name: new RegExp(`^${catName}$`, 'i') });
      if (!category) {
        category = await ProductCategory.create({
          category_name: catName,
          gst_rate: 18,
          hsn_sac_code: initial_product.hsn_code || '8471',
          description: `${catName} product category`
        });
      }

      const generatedSku = (initial_product.sku || initial_product.sku_barcode || `SKU-${Date.now().toString().slice(-4)}`).toUpperCase();
      
      createdProduct = await Product.create({
        sku_barcode: generatedSku,
        product_name: initial_product.product_name.trim(),
        category_id: category._id,
        unit_price: Number(initial_product.unit_price) || 100,
        cost_price: Number(initial_product.cost_price) || (Number(initial_product.unit_price) * 0.7) || 70,
        stock_quantity: Number(initial_product.stock_quantity) || 50,
        reorder_level: Number(initial_product.reorder_level) || 10,
        batch_number: `BAT-${Date.now().toString().slice(-4)}`,
        supplier_name: business.business_name
      });
    }

    // Create Initial Customer if provided
    if (initial_customer && initial_customer.full_name) {
      const phoneNum = initial_customer.phone || initial_customer.phone_number || `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`;
      
      createdCustomer = await Customer.create({
        full_name: initial_customer.full_name.trim(),
        phone_number: phoneNum,
        email: initial_customer.email || '',
        gstin: (initial_customer.gstin || '').toUpperCase(),
        credit_limit: Number(initial_customer.credit_limit) || 50000,
        current_balance: 0,
        risk_score: 10.0,
        risk_status: 'SAFE'
      });
    }

    res.json({
      success: true,
      message: '🎉 Business enterprise configured and activated successfully!',
      data: {
        business,
        createdProduct,
        createdCustomer
      }
    });
  } catch (err) {
    console.error('Setup Wizard Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
