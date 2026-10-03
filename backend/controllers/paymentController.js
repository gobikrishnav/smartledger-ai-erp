const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const LedgerEntry = require('../models/LedgerEntry');
const AuditLog = require('../models/AuditLog');

// POST /api/payments
exports.recordPayment = async (req, res) => {
  try {
    const {
      invoice_id,
      amount_paid,
      payment_method = 'UPI',
      transaction_reference,
      notes
    } = req.body;

    const amount = Number(amount_paid);
    if (!invoice_id || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid invoice ID and positive amount are required.' });
    }

    const invoice = await Invoice.findById(invoice_id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const customer = invoice.customer_id ? await Customer.findById(invoice.customer_id) : null;
    const customerName = invoice.customer_name || customer?.full_name || 'Retail Customer';

    // 1. Create Payment
    const paymentNo = `PAY-${Date.now().toString().slice(-6)}`;
    const payment = new Payment({
      payment_no: paymentNo,
      invoice_id: invoice._id,
      invoice_no: invoice.invoice_no,
      customer_id: invoice.customer_id || invoice._id,
      customer_name: customerName,
      amount_paid: amount,
      payment_method,
      transaction_reference: transaction_reference || `TXN-${Date.now()}`,
      status: 'SUCCESS',
      notes,
      recorded_by: req.user?.full_name || req.user?.name || 'Authorized Staff'
    });
    await payment.save();

    // 2. Update Invoice Status
    invoice.payment_status = 'PAID';
    invoice.payment_method = payment_method;
    await invoice.save();

    // 3. Update Customer Balance
    if (customer) {
      customer.current_balance = Math.max(0, (customer.current_balance || 0) - amount);
      await customer.save();
    }

    // 4. Create Double-Entry Ledger Transaction
    const lastEntry = await LedgerEntry.findOne().sort({ date: -1, _id: -1 });
    const prevBalance = lastEntry ? lastEntry.running_balance : 0;
    const running_balance = Number((prevBalance + amount).toFixed(2));

    const ledger = new LedgerEntry({
      entry_id: `LED-PAY-${Date.now()}`,
      reference_no: paymentNo,
      reference_id: payment._id,
      transaction_type: 'PAYMENT',
      account_name: 'Cash & Bank',
      customer_id: invoice.customer_id,
      customer_name: customerName,
      description: `Payment received for ${invoice.invoice_no} via ${payment_method}`,
      debit: amount,
      credit: 0,
      running_balance,
      created_by: req.user?.name || 'Staff'
    });
    await ledger.save();

    // 5. Create Audit Log
    const audit = new AuditLog({
      log_id: `AUD-PAY-${Date.now()}`,
      user_id: req.user?.userId || 'STAFF',
      user_name: req.user?.name || 'Staff',
      user_role: req.user?.role || 'Cashier',
      action: 'PAYMENT_RECORD',
      category: 'INVOICING',
      entity: 'Payment',
      entity_id: paymentNo,
      new_value: { invoice_no: invoice.invoice_no, amount_paid: amount, payment_method },
      status: 'SUCCESS'
    });
    await audit.save();

    res.status(201).json({
      success: true,
      data: {
        payment,
        invoice,
        ledger_entry: ledger
      },
      message: `Payment of ₹${amount} recorded for ${invoice.invoice_no}.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/payments
exports.getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, invoice_id, customer_id } = req.query;
    const query = {};

    if (invoice_id) query.invoice_id = invoice_id;
    if (customer_id) query.customer_id = customer_id;
    if (search) {
      query.$or = [
        { payment_no: new RegExp(search, 'i') },
        { invoice_no: new RegExp(search, 'i') },
        { customer_name: new RegExp(search, 'i') },
        { transaction_reference: new RegExp(search, 'i') }
      ];
    }

    const payments = await Payment.find(query)
      .sort({ payment_date: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: {
        total,
        page: Number(page),
        payments
      },
      message: 'Payments retrieved successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
