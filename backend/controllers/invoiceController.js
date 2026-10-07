const Invoice = require('../models/Invoice');
const InvoiceItem = require('../models/InvoiceItem');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const RiskAuditLog = require('../models/RiskAuditLog');
const LedgerEntry = require('../models/LedgerEntry');
const InventoryTransaction = require('../models/InventoryTransaction');
const AuditLog = require('../models/AuditLog');
const { computeGSTLineItem } = require('../services/gstEngine');
const { generateInvoiceBlockHash } = require('../services/cryptoHash');
const { emitStockLowAlert, emitInvoiceCreated, emitRiskAnomalyFlag } = require('../services/socketService');
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Number to Indian Words Converter (e.g. 29205 -> Twenty Nine Thousand Two Hundred and Five Rupees only)
function numberToIndianWords(num) {
  if (!num || isNaN(num) || num <= 0) return 'Zero Rupees only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const inWords = (n) => {
    let str = '';
    if (n > 19) {
      str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
    } else {
      str += a[n];
    }
    return str;
  };

  let n = Math.floor(Math.abs(num));
  let result = '';
  
  if (Math.floor(n / 10000000) > 0) {
    result += inWords(Math.floor(n / 10000000)) + 'Crore ';
    n %= 10000000;
  }
  if (Math.floor(n / 100000) > 0) {
    result += inWords(Math.floor(n / 100000)) + 'Lakh ';
    n %= 100000;
  }
  if (Math.floor(n / 1000) > 0) {
    result += inWords(Math.floor(n / 1000)) + 'Thousand ';
    n %= 1000;
  }
  if (Math.floor(n / 100000) > 0) {
    result += inWords(Math.floor(n / 100000)) + 'Lakh ';
    n %= 100000;
  }
  if (Math.floor(n / 100) > 0) {
    result += inWords(Math.floor(n / 100)) + 'Hundred ';
    n %= 100;
  }
  if (n > 0) {
    if (result !== '') result += 'and ';
    result += inWords(n);
  }
  return (result.trim() + ' Rupees only').replace(/\s+/g, ' ');
}

exports.createInvoice = async (req, res) => {
  try {
    const {
      customer_id,
      clientId,
      customer_name,
      clientName,
      customer_phone,
      items,
      payment_method = 'UPI',
      discount_percent = 0,
      discountAmt = 0,
      shippingAmt = 0,
      other_charges = 0,
      packaging_charges = 0,
      received_amount = 0,
      transport_name = '',
      vehicle_number = '',
      terms_conditions = 'Thank you for doing business with us.',
      company_name = 'VELAVAN CRACKERS',
      branch_id = 'BR-CENTRAL-01',
      terminal_geo_token,
      originStateCode,
      destinationStateCode,
      notes
    } = req.body;

    const effectiveCustomerId = customer_id || clientId;
    const effectiveCustomerName = customer_name || clientName;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invoice must contain at least one item line.' });
    }

    // 1. Customer Credit Verification if payment_method is CREDIT
    let customerDoc = null;
    if (effectiveCustomerId) {
      customerDoc = await Customer.findById(effectiveCustomerId);
    } else if (customer_phone) {
      customerDoc = await Customer.findOne({ phone_number: customer_phone });
    }

    // 2. Validate Items & Stock
    const processedLines = [];
    let subtotal = 0;
    let totalTax = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    let totalCasesCount = 0;

    const fromState = originStateCode || req.body.origin_state_code || '33'; // Default Sivakasi / Tamil Nadu (33)
    const toState = destinationStateCode || req.body.destination_state_code || req.body.destStateCode || '33';

    for (const item of items) {
      const prodId = item.product_id || item.productId;
      let product = null;

      if (prodId) {
        try {
          product = await Product.findById(prodId);
        } catch (_) {}
      }
      if (!product && (item.sku_barcode || item.sku || item.product_name || item.name)) {
        product = await Product.findOne({
          $or: [
            { sku_barcode: item.sku_barcode || item.sku },
            { product_name: item.product_name || item.name }
          ]
        });
      }

      const caseCnt = Number(item.case_content || item.caseContent || product?.case_content || 36);
      const itemBrand = item.brand || product?.brand || 'Karpagam';
      const noCases = Number(item.no_of_cases || item.noCases || 1);
      const itemQty = Number(item.quantity || (noCases * caseCnt));
      totalCasesCount += noCases;

      // Compute dynamic GST
      const taxCalc = computeGSTLineItem({
        unitPrice: Number(item.unit_price || item.unitPrice || product?.unit_price || 100),
        quantity: itemQty,
        discountPercent: discount_percent,
        customGstRate: item.gst_rate || item.gstRate || 18,
        hsnCode: item.hsn_code || item.hsnCode || product?.hsn_code || '3604',
        originStateCode: fromState,
        destStateCode: toState
      });

      subtotal += taxCalc.taxableAmount;
      totalTax += taxCalc.totalTax;
      cgstTotal += taxCalc.cgst;
      sgstTotal += taxCalc.sgst;
      igstTotal += taxCalc.igst;

      processedLines.push({
        product_id: product?._id,
        sku_barcode: product?.sku_barcode || item.sku || `CRACKER-${Date.now().toString().slice(-4)}`,
        product_name: product?.product_name || item.product_name || item.name || 'Sivakasi Fireworks Item',
        quantity: itemQty,
        unit_price: Number(item.unit_price || item.unitPrice || product?.unit_price || 100),
        cost_price: Number(item.cost_price || item.costPrice || product?.cost_price || (Number(item.unit_price || 100) * 0.65)),
        case_content: caseCnt,
        brand: itemBrand,
        no_of_cases: noCases,
        taxable_amount: taxCalc.taxableAmount,
        gst_rate: taxCalc.gstRate,
        cgst: taxCalc.cgst,
        sgst: taxCalc.sgst,
        igst: taxCalc.igst,
        line_total: taxCalc.lineTotal,
        productRef: product
      });

      if (product && product.stock_quantity < itemQty) {
        emitStockLowAlert(product);
      }
    }

    subtotal = Number(subtotal.toFixed(2));
    totalTax = Number(totalTax.toFixed(2));
    
    const otherChg = Number(other_charges || req.body.otherCharges || shippingAmt || 0);
    const packChg = Number(packaging_charges || req.body.packagingCharges || 0);
    const discAmt = Number(discountAmt || ((subtotal * discount_percent) / 100).toFixed(2));
    const netTotal = Number((subtotal - discAmt + totalTax + otherChg + packChg).toFixed(2));
    const recAmt = Number(received_amount || req.body.receivedAmount || 0);
    const balAmt = Number(Math.max(0, netTotal - recAmt).toFixed(2));

    // If Credit payment, check balance limit
    if (payment_method === 'CREDIT' && customerDoc) {
      if (customerDoc.current_balance + netTotal > customerDoc.credit_limit) {
        return res.status(400).json({
          error: `Credit limit exceeded! Limit: ₹${customerDoc.credit_limit}, Current: ₹${customerDoc.current_balance}, Transaction: ₹${netTotal}`
        });
      }
      customerDoc.current_balance += netTotal;
      await customerDoc.save();
    }

    // 3. Retrieve Previous Invoice Block Hash for Immutable Chaining
    const lastInvoice = await Invoice.findOne().sort({ invoice_timestamp: -1 });
    const prevHash = lastInvoice?.crypto_hash || '0000000000000000000000000000000000000000000000000000000000000000';

    // Auto-generate invoice serial number
    const count = await Invoice.countDocuments();
    const invoiceNo = req.body.invoice_no || req.body.invoiceNo || `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    const timestamp = new Date();

    // 4. Compute SHA-256 Block Hash
    const cryptoHash = generateInvoiceBlockHash({
      invoiceNo,
      netTotal,
      timestamp,
      prevHash,
      branchId: branch_id
    });

    // Fallback cashier ID to guarantee valid ObjectId
    const mongoose = require('mongoose');
    let effectiveCashierId = req.user?.userId || req.user?.id || req.user?._id;
    if (!effectiveCashierId || !mongoose.Types.ObjectId.isValid(effectiveCashierId)) {
      const StaffUser = require('../models/StaffUser');
      const staffDoc = await StaffUser.findOne();
      effectiveCashierId = staffDoc?._id || new mongoose.Types.ObjectId();
    }

    // 5. Save Invoice Record
    const newInvoice = new Invoice({
      invoice_no: invoiceNo,
      customer_id: customerDoc?._id,
      customer_name: customerDoc?.full_name || effectiveCustomerName || 'Mah gondia sitaram chauraswya',
      customer_phone: customerDoc?.phone_number || customer_phone || '7719975175',
      cashier_id: effectiveCashierId,
      cashier_name: req.user?.full_name || 'VELAVAN Billing Counter',
      branch_id,
      terminal_geo_token: terminal_geo_token || { lat: 9.4533, lng: 77.7946, accuracy: 10.0, verified: true }, // Sivakasi geo coordinates
      subtotal,
      total_tax: totalTax,
      cgst_total: Number(cgstTotal.toFixed(2)),
      sgst_total: Number(sgstTotal.toFixed(2)),
      igst_total: Number(igstTotal.toFixed(2)),
      discount_amount: discAmt,
      net_total: netTotal,
      other_charges: otherChg,
      packaging_charges: packChg,
      total_cases: Number(req.body.total_cases || totalCasesCount),
      transport_name: transport_name || '',
      vehicle_number: vehicle_number || '',
      amount_in_words: req.body.amount_in_words || numberToIndianWords(netTotal),
      terms_conditions: terms_conditions || 'Thank you for doing business with us.',
      received_amount: recAmt,
      balance_amount: balAmt,
      company_name: company_name || 'VELAVAN CRACKERS',
      crypto_hash: cryptoHash,
      prev_hash: prevHash,
      payment_method,
      payment_status: payment_method === 'CREDIT' ? 'CREDIT_PENDING' : 'PAID',
      invoice_timestamp: timestamp
    });

    await newInvoice.save();

    // 6. Save Line Items & Decrement Stock in MongoDB
    for (const line of processedLines) {
      const invoiceItem = new InvoiceItem({
        invoice_id: newInvoice._id,
        product_id: line.product_id,
        sku_barcode: line.sku_barcode,
        product_name: line.product_name,
        quantity: line.quantity,
        unit_price: line.unit_price,
        cost_price: line.cost_price,
        case_content: line.case_content,
        brand: line.brand,
        no_of_cases: line.no_of_cases,
        taxable_amount: line.taxable_amount,
        gst_rate: line.gst_rate,
        cgst: line.cgst,
        sgst: line.sgst,
        igst: line.igst,
        line_total: line.line_total
      });
      await invoiceItem.save();

      // Decrement product stock
      const prod = line.productRef;
      prod.stock_quantity = Math.max(0, prod.stock_quantity - line.quantity);
      await prod.save();

      // Record inventory transaction
      try {
        await InventoryTransaction.create({
          product_id: prod._id,
          sku_barcode: prod.sku_barcode,
          product_name: prod.product_name,
          transaction_type: 'SALE',
          quantity_delta: -line.quantity,
          balance_after: prod.stock_quantity,
          unit_cost: prod.cost_price || (prod.unit_price * 0.65),
          reference_invoice: newInvoice.invoice_no,
          operator_name: req.user?.full_name || req.user?.name || 'Cashier',
          batch_number: prod.batch_lot_number || 'BATCH-STD'
        });
      } catch (txErr) {
        console.error('InventoryTransaction record error:', txErr.message);
      }

      // Real-time low-stock threshold alert broadcast
      if (prod.stock_quantity <= prod.reorder_level) {
        emitStockLowAlert(prod);
      }
    }

    // Double-Entry Ledger Posting
    try {
      const lastLedger = await LedgerEntry.findOne().sort({ entry_date: -1 });
      let runningBalance = (lastLedger?.running_balance || 500000);

      // Debit Cash / Bank or Accounts Receivable
      runningBalance += netTotal;
      await LedgerEntry.create({
        entry_id: `LED-${Date.now()}-01`,
        account_name: payment_method === 'CREDIT' ? 'Accounts Receivable' : 'Cash and Bank Balances',
        debit: netTotal,
        credit: 0,
        running_balance: runningBalance,
        transaction_type: 'INVOICE',
        reference_no: newInvoice.invoice_no,
        reference_id: newInvoice._id,
        customer_id: newInvoice.customer_id,
        customer_name: newInvoice.customer_name,
        description: `Invoice ${newInvoice.invoice_no} sale to ${newInvoice.customer_name}`,
        created_by: req.user?.full_name || 'System'
      });

      // Credit Sales Revenue
      await LedgerEntry.create({
        entry_id: `LED-${Date.now()}-02`,
        account_name: 'Sales Revenue',
        debit: 0,
        credit: subtotal,
        running_balance: runningBalance,
        transaction_type: 'INVOICE',
        reference_no: newInvoice.invoice_no,
        reference_id: newInvoice._id,
        customer_id: newInvoice.customer_id,
        customer_name: newInvoice.customer_name,
        description: `Sales revenue for ${newInvoice.invoice_no}`,
        created_by: req.user?.full_name || 'System'
      });

      // Credit GST Output Tax Liability if tax > 0
      if (totalTax > 0) {
        await LedgerEntry.create({
          entry_id: `LED-${Date.now()}-03`,
          account_name: 'GST Output Tax Liability',
          debit: 0,
          credit: totalTax,
          running_balance: runningBalance,
          transaction_type: 'INVOICE',
          reference_no: newInvoice.invoice_no,
          reference_id: newInvoice._id,
          customer_id: newInvoice.customer_id,
          customer_name: newInvoice.customer_name,
          description: `Output GST liability (CGST: ₹${cgstTotal}, SGST: ₹${sgstTotal}, IGST: ₹${igstTotal}) for ${newInvoice.invoice_no}`,
          created_by: req.user?.full_name || 'System'
        });
      }

      // Record Audit Log
      await AuditLog.create({
        log_id: `AUD-INV-${Date.now()}`,
        user_id: req.user?.userId || 'SYSTEM',
        user_name: req.user?.full_name || req.user?.name || 'Cashier',
        user_role: req.user?.role || 'Staff',
        action: 'INVOICE_CREATE',
        category: 'INVOICING',
        entity: 'Invoice',
        entity_id: newInvoice.invoice_no,
        new_value: { invoice_no: newInvoice.invoice_no, net_total: netTotal, payment_method },
        severity: 'INFO',
        status: 'SUCCESS'
      });
    } catch (ledgerErr) {
      console.error('Ledger / Audit Posting Error:', ledgerErr.message);
    }

    // 7. Trigger Asynchronous Credit Risk Anomaly Evaluation if registered buyer
    if (customerDoc) {
      try {
        const unpaidRatio = customerDoc.credit_limit > 0 ? (customerDoc.current_balance / customerDoc.credit_limit) : 0.0;
        const aiRes = await axios.post(`${AI_SERVICE_URL}/api/ai/risk/score`, {
          transaction_frequency: customerDoc.transaction_frequency || 10,
          average_ticket_size: customerDoc.avg_ticket_size || netTotal,
          overdue_days: customerDoc.overdue_days || 0,
          unpaid_balance_ratio: Number(unpaidRatio.toFixed(2))
        });

        if (aiRes.data && aiRes.data.status === 'success') {
          const riskData = aiRes.data;
          customerDoc.risk_score = riskData.risk_score;
          if (riskData.is_anomaly || riskData.flag_level === 'HIGH_RISK') {
            customerDoc.risk_status = 'FLAGGED';
            // Create risk audit log
            const auditLog = new RiskAuditLog({
              log_id: `LOG-RISK-${Date.now()}`,
              customer_id: customerDoc._id,
              customer_name: customerDoc.full_name,
              invoice_id: newInvoice._id,
              invoice_no: newInvoice.invoice_no,
              anomaly_score: riskData.decision_function_score,
              risk_score: riskData.risk_score,
              risk_level: riskData.flag_level,
              is_anomaly: riskData.is_anomaly,
              decision_action: riskData.recommended_action
            });
            await auditLog.save();

            // Broadcast anomaly flag to Business Owner via Socket.io
            emitRiskAnomalyFlag({
              customer_id: customerDoc._id,
              customer_name: customerDoc.full_name,
              invoice_no: newInvoice.invoice_no,
              risk_score: riskData.risk_score,
              flag_level: riskData.flag_level,
              recommended_action: riskData.recommended_action
            });
          }
          await customerDoc.save();
        }
      } catch (aiErr) {
        console.error('Non-blocking AI risk evaluation error:', aiErr.message);
      }
    }

    // 8. Broadcast invoice creation to all dashboards
    emitInvoiceCreated({
      invoice_no: newInvoice.invoice_no,
      customer_name: newInvoice.customer_name,
      net_total: newInvoice.net_total,
      crypto_hash: newInvoice.crypto_hash,
      timestamp: newInvoice.invoice_timestamp
    });

    res.status(201).json({
      status: 'success',
      _id: newInvoice._id,
      invoice: newInvoice,
      items: processedLines,
      ...newInvoice.toObject()
    });
  } catch (err) {
    console.error('Invoice Creation Error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 100, search, status, paginated } = req.query;
    const query = {};

    if (status) {
      if (status.toLowerCase() === 'finalized' || status.toUpperCase() === 'PAID') {
        query.payment_status = 'PAID';
      } else if (status.toLowerCase() === 'draft' || status.toUpperCase() === 'CREDIT_PENDING') {
        query.payment_status = 'CREDIT_PENDING';
      } else if (status.toLowerCase() === 'cancelled' || status.toUpperCase() === 'VOID') {
        query.payment_status = 'VOID';
      } else {
        query.payment_status = status;
      }
    }

    if (search) {
      query.$or = [
        { invoice_no: new RegExp(search, 'i') },
        { customer_name: new RegExp(search, 'i') },
        { customer_phone: new RegExp(search, 'i') }
      ];
    }

    const invoices = await Invoice.find(query)
      .sort({ invoice_timestamp: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Invoice.countDocuments(query);

    const enriched = invoices.map(inv => {
      const obj = inv.toObject();
      obj.invoiceNumber = inv.invoice_no;
      obj.grandTotal = inv.net_total;
      obj.totalTax = inv.total_tax;
      obj.subtotalAmt = inv.subtotal;
      obj.status = inv.payment_status === 'PAID' ? 'finalized' : (inv.payment_status === 'VOID' ? 'cancelled' : 'draft');
      obj.createdAt = inv.invoice_timestamp;
      obj.client = {
        _id: inv.customer_id,
        businessName: inv.customer_name,
        phone: inv.customer_phone
      };
      return obj;
    });

    if (paginated === 'true') {
      return res.json({
        total,
        page: Number(page),
        invoices: enriched
      });
    }

    // Default: return enriched array directly with total property attached
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProfitSummary = async (req, res) => {
  try {
    const invoices = await Invoice.find({ payment_status: { $ne: 'VOID' } });
    const totalRevenue = invoices.reduce((acc, inv) => acc + (inv.net_total || 0), 0);
    const totalDiscounts = invoices.reduce((acc, inv) => acc + (inv.discount_amount || 0), 0);

    const items = await InvoiceItem.find();
    const totalCOGS = items.reduce((acc, item) => {
      const cost = item.cost_price || (item.unit_price * 0.6);
      return acc + (cost * (item.quantity || 1));
    }, 0);

    const totalShipping = invoices.length > 0 ? (invoices.reduce((acc, inv) => acc + (inv.shipping_fee || 0), 0)) : 0;
    const totalNetProfit = totalRevenue > 0 ? Math.max(0, totalRevenue - totalCOGS - totalDiscounts - totalShipping) : 0;
    const netMarginPercent = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;
    const grossMarginPercent = totalRevenue > 0 ? ((totalRevenue - totalCOGS) / totalRevenue) * 100 : 0;

    // Build category profit breakdown
    const categoryProfit = {};
    for (const item of items) {
      const cat = item.category || 'General';
      if (!categoryProfit[cat]) {
        categoryProfit[cat] = { itemsCount: 0, revenue: 0, cost: 0, profit: 0 };
      }
      const itemRev = (item.unit_price || 0) * (item.quantity || 1);
      const itemCost = (item.cost_price || (item.unit_price * 0.6)) * (item.quantity || 1);
      categoryProfit[cat].itemsCount += (item.quantity || 1);
      categoryProfit[cat].revenue += itemRev;
      categoryProfit[cat].cost += itemCost;
      categoryProfit[cat].profit += (itemRev - itemCost);
    }

    res.json({
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalCOGS: Number(totalCOGS.toFixed(2)),
      totalDiscounts: Number(totalDiscounts.toFixed(2)),
      totalShipping,
      totalNetProfit: Number(totalNetProfit.toFixed(2)),
      netMarginPercent: Number(netMarginPercent.toFixed(2)),
      grossMarginPercent: Number(grossMarginPercent.toFixed(2)),
      totalInvoices: invoices.length,
      invoiceCount: invoices.length,
      categoryProfit
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.finalizeInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { payment_status: 'PAID' },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
    res.json({ status: 'success', invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.cancelInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
    if (invoice.payment_status === 'VOID') {
      return res.status(400).json({ error: 'Invoice is already voided.' });
    }

    invoice.payment_status = 'VOID';
    await invoice.save();

    // Restock items and record InventoryTransaction
    const items = await InvoiceItem.find({ invoice_id: invoice._id });
    for (const item of items) {
      const prod = await Product.findById(item.product_id);
      if (prod) {
        prod.stock_quantity += item.quantity;
        await prod.save();

        try {
          await InventoryTransaction.create({
            product_id: prod._id,
            sku_barcode: prod.sku_barcode,
            product_name: prod.product_name,
            transaction_type: 'RETURN',
            quantity_delta: item.quantity,
            balance_after: prod.stock_quantity,
            unit_cost: prod.cost_price || (prod.unit_price * 0.65),
            reference_invoice: invoice.invoice_no,
            operator_name: req.user?.full_name || req.user?.name || 'Admin',
            notes: 'Stock restored upon invoice cancellation'
          });
        } catch (txErr) {
          console.error('InventoryTransaction cancellation error:', txErr.message);
        }
      }
    }

    // Reversing Ledger Entry
    try {
      const lastLedger = await LedgerEntry.findOne().sort({ entry_date: -1 });
      const runningBalance = (lastLedger?.running_balance || 500000) - invoice.net_total;

      await LedgerEntry.create({
        entry_id: `LED-${Date.now()}-REV`,
        account_name: 'Sales Returns & Allowances',
        debit: invoice.net_total,
        credit: 0,
        running_balance: runningBalance,
        transaction_type: 'CANCELLATION',
        reference_no: invoice.invoice_no,
        reference_id: invoice._id,
        customer_id: invoice.customer_id,
        customer_name: invoice.customer_name,
        description: `Reversal of voided invoice ${invoice.invoice_no}`,
        created_by: req.user?.full_name || 'Admin'
      });

      // Audit Log
      await AuditLog.create({
        log_id: `AUD-VOID-${Date.now()}`,
        user_id: req.user?.userId || 'SYSTEM',
        user_name: req.user?.full_name || req.user?.name || 'Admin',
        user_role: req.user?.role || 'Admin',
        action: 'INVOICE_CANCEL',
        category: 'INVOICING',
        entity: 'Invoice',
        entity_id: invoice.invoice_no,
        severity: 'WARNING',
        status: 'SUCCESS'
      });
    } catch (ledgerErr) {
      console.error('Reversal Ledger / Audit Error:', ledgerErr.message);
    }

    res.json({ status: 'success', message: `Invoice ${invoice.invoice_no} voided, inventory restored, and ledger reversed.`, invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

    const items = await InvoiceItem.find({ invoice_id: invoice._id });
    let customerDoc = null;
    if (invoice.customer_id) {
      customerDoc = await Customer.findById(invoice.customer_id);
    }

    const obj = invoice.toObject();
    obj.invoiceNumber = invoice.invoice_no;
    obj.grandTotal = invoice.net_total;
    obj.subtotalAmt = invoice.subtotal;
    obj.totalTax = invoice.total_tax;
    obj.cgstTotal = invoice.cgst_total;
    obj.sgstTotal = invoice.sgst_total;
    obj.igstTotal = invoice.igst_total;
    obj.discountAmt = invoice.discount_amount;
    obj.status = invoice.payment_status === 'PAID' ? 'finalized' : (invoice.payment_status === 'VOID' ? 'cancelled' : 'draft');
    obj.createdAt = invoice.invoice_timestamp;
    obj.client = {
      _id: invoice.customer_id,
      businessName: customerDoc?.full_name || invoice.customer_name,
      fullName: customerDoc?.full_name || invoice.customer_name,
      phone: customerDoc?.phone_number || invoice.customer_phone,
      gstin: customerDoc?.gstin || ''
    };
    obj.clientId = obj.client;
    obj.items = items.map(it => {
      const itObj = it.toObject();
      itObj.productName = it.product_name;
      itObj.unitPrice = it.unit_price;
      itObj.costPrice = it.cost_price;
      itObj.hsnCode = it.hsn_code || '85';
      itObj.taxableAmount = it.taxable_amount;
      itObj.cgstAmount = it.cgst;
      itObj.sgstAmount = it.sgst;
      itObj.igstAmount = it.igst;
      itObj.gstRate = it.gst_rate;
      return itObj;
    });

    res.json({
      status: 'success',
      invoice: obj,
      items: obj.items,
      ...obj
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
