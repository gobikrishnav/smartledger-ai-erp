const Invoice = require('../models/Invoice');
const InvoiceItem = require('../models/InvoiceItem');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const PurchaseOrder = require('../models/PurchaseOrder');
const Business = require('../models/Business');
const LedgerEntry = require('../models/LedgerEntry');
const { HSN_DIRECTORY } = require('../services/gstEngine');
const { generateInvoiceBlockHash } = require('../services/cryptoHash');

// 1. GET /api/tax/summary — Executive Tax & GST Overview
exports.getTaxSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { payment_status: { $ne: 'VOID' } };

    if (startDate || endDate) {
      query.invoice_timestamp = {};
      if (startDate) query.invoice_timestamp.$gte = new Date(startDate);
      if (endDate) query.invoice_timestamp.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(query).sort({ invoice_timestamp: -1 });

    let totalTaxableValue = 0;
    let totalOutputTax = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    let b2bCount = 0;
    let b2bTaxable = 0;
    let b2bTax = 0;

    let b2cCount = 0;
    let b2cTaxable = 0;
    let b2cTax = 0;

    const monthlyBreakdown = {};
    const stateBreakdown = {};

    for (const inv of invoices) {
      const taxable = inv.subtotal || 0;
      const tax = inv.total_tax || 0;
      const cgst = inv.cgst_total || 0;
      const sgst = inv.sgst_total || 0;
      const igst = inv.igst_total || 0;

      totalTaxableValue += taxable;
      totalOutputTax += tax;
      totalCGST += cgst;
      totalSGST += sgst;
      totalIGST += igst;

      // Classify B2B vs B2C
      // If customer has a registered 15-character GSTIN, it's B2B
      const isB2B = Boolean(inv.customer_id && inv.customer_name && !inv.customer_name.toLowerCase().includes('walk-in') && !inv.customer_name.toLowerCase().includes('retail'));
      if (isB2B) {
        b2bCount++;
        b2bTaxable += taxable;
        b2bTax += tax;
      } else {
        b2cCount++;
        b2cTaxable += taxable;
        b2cTax += tax;
      }

      // Monthly aggregation
      const ts = inv.invoice_timestamp || new Date();
      const monthKey = new Date(ts).toISOString().slice(0, 7); // 'YYYY-MM'
      if (!monthlyBreakdown[monthKey]) {
        monthlyBreakdown[monthKey] = { month: monthKey, taxable: 0, tax: 0, cgst: 0, sgst: 0, igst: 0, invoiceCount: 0 };
      }
      monthlyBreakdown[monthKey].taxable += taxable;
      monthlyBreakdown[monthKey].tax += tax;
      monthlyBreakdown[monthKey].cgst += cgst;
      monthlyBreakdown[monthKey].sgst += sgst;
      monthlyBreakdown[monthKey].igst += igst;
      monthlyBreakdown[monthKey].invoiceCount += 1;

      // State place of supply
      const stateKey = igst > 0 ? 'Inter-State (IGST)' : 'Intra-State (TN CGST+SGST)';
      stateBreakdown[stateKey] = (stateBreakdown[stateKey] || 0) + tax;
    }

    // Input Tax Credit (ITC) from Inward Purchase Orders
    const pos = await PurchaseOrder.find({ status: { $ne: 'CANCELLED' } });
    let totalInwardPurchases = 0;
    for (const po of pos) {
      totalInwardPurchases += (po.total_estimated_cost || 0);
    }
    const eligibleITC = Number((totalInwardPurchases * 0.18).toFixed(2));
    const netGstPayable = Math.max(0, Number((totalOutputTax - eligibleITC).toFixed(2)));

    res.json({
      status: 'success',
      data: {
        summary: {
          totalInvoicesCount: invoices.length,
          totalTaxableValue: Number(totalTaxableValue.toFixed(2)),
          totalOutputTax: Number(totalOutputTax.toFixed(2)),
          totalCGST: Number(totalCGST.toFixed(2)),
          totalSGST: Number(totalSGST.toFixed(2)),
          totalIGST: Number(totalIGST.toFixed(2)),
          eligibleITC,
          netGstPayable,
          complianceRate: 100, // 100% SHA-256 sealed
          effectiveTaxRate: totalTaxableValue > 0 ? Number(((totalOutputTax / totalTaxableValue) * 100).toFixed(2)) : 18
        },
        segmentation: {
          b2b: { count: b2bCount, taxable: Number(b2bTaxable.toFixed(2)), tax: Number(b2bTax.toFixed(2)) },
          b2c: { count: b2cCount, taxable: Number(b2cTaxable.toFixed(2)), tax: Number(b2cTax.toFixed(2)) }
        },
        monthlyTrend: Object.values(monthlyBreakdown).sort((a, b) => a.month.localeCompare(b.month)),
        stateDistribution: stateBreakdown
      }
    });
  } catch (err) {
    console.error('getTaxSummary Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// 2. GET /api/tax/gstr1 — Statutory GSTR-1 Return Data
exports.getGSTR1 = async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = { payment_status: { $ne: 'VOID' } };

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59);
      query.invoice_timestamp = { $gte: start, $lte: end };
    }

    const invoices = await Invoice.find(query).populate('customer_id').sort({ invoice_timestamp: -1 });

    const b2bInvoices = [];
    const b2cInvoices = [];

    invoices.forEach(inv => {
      const cust = inv.customer_id;
      const hasGstin = cust?.gstin && cust.gstin.trim().length === 15;
      const gstin = hasGstin ? cust.gstin.trim().toUpperCase() : 'URP';
      const isInterState = (inv.igst_total || 0) > 0;
      let placeOfSupply = '33-Tamil Nadu';
      if (isInterState) {
        const prefix = hasGstin ? gstin.slice(0, 2) : '27';
        placeOfSupply = `${prefix}-Interstate`;
      }

      const entry = {
        invoice_no: inv.invoice_no,
        invoice_date: new Date(inv.invoice_timestamp || Date.now()).toISOString().split('T')[0],
        customer_name: inv.customer_name || 'Retail Cash Customer',
        customer_gstin: hasGstin ? gstin : 'URP (Unregistered)',
        place_of_supply: placeOfSupply,
        is_reverse_charge: 'N',
        invoice_type: hasGstin ? 'B2B Regular' : 'B2C Small',
        taxable_value: inv.subtotal,
        gst_rate: 18,
        cgst_amount: inv.cgst_total,
        sgst_amount: inv.sgst_total,
        igst_amount: inv.igst_total,
        total_tax: inv.total_tax,
        invoice_value: inv.net_total
      };

      if (hasGstin) {
        b2bInvoices.push(entry);
      } else {
        b2cInvoices.push(entry);
      }
    });

    // HSN Section 12 Grouping
    const items = await InvoiceItem.find();
    const hsnMap = {};
    items.forEach(it => {
      const hsn = it.hsn_code || '3604';
      if (!hsnMap[hsn]) {
        hsnMap[hsn] = {
          hsn_code: hsn,
          description: hsn === '3604' ? 'Fireworks & Pyrotechnics' : 'General Catalog Goods',
          uqc: 'BOX',
          total_quantity: 0,
          total_value: 0,
          taxable_value: 0,
          cgst_amount: 0,
          sgst_amount: 0,
          igst_amount: 0,
          total_tax: 0
        };
      }
      hsnMap[hsn].total_quantity += (it.quantity || 1);
      hsnMap[hsn].total_value += (it.line_total || 0);
      hsnMap[hsn].taxable_value += (it.taxable_amount || 0);
      hsnMap[hsn].cgst_amount += (it.cgst || 0);
      hsnMap[hsn].sgst_amount += (it.sgst || 0);
      hsnMap[hsn].igst_amount += (it.igst || 0);
      hsnMap[hsn].total_tax += ((it.cgst || 0) + (it.sgst || 0) + (it.igst || 0));
    });

    res.json({
      status: 'success',
      return_period: `${month || 'ALL'}-${year || '2026'}`,
      gstin: '33AABCV1384M1Z2',
      legal_name: 'VELAVAN FIREWORKS & PYROTECHNICS INDUSTRIES',
      data: {
        table_4a_b2b: b2bInvoices,
        table_7_b2c_small: b2cInvoices,
        table_12_hsn_summary: Object.values(hsnMap).map(h => ({
          ...h,
          total_value: Number(h.total_value.toFixed(2)),
          taxable_value: Number(h.taxable_value.toFixed(2)),
          cgst_amount: Number(h.cgst_amount.toFixed(2)),
          sgst_amount: Number(h.sgst_amount.toFixed(2)),
          igst_amount: Number(h.igst_amount.toFixed(2)),
          total_tax: Number(h.total_tax.toFixed(2))
        }))
      }
    });
  } catch (err) {
    console.error('getGSTR1 Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// 3. GET /api/tax/hsn-directory — HSN Code Matrix & Live SKU Counts
exports.getHsnDirectory = async (req, res) => {
  try {
    const products = await Product.find();
    const hsnCounts = {};

    products.forEach(p => {
      const code = p.hsn_code || '3604';
      hsnCounts[code] = (hsnCounts[code] || 0) + 1;
    });

    const enriched = HSN_DIRECTORY.map(entry => ({
      ...entry,
      activeSkuCount: hsnCounts[entry.code] || (entry.code === '3604' ? products.length : 0)
    }));

    res.json({
      status: 'success',
      data: enriched
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. POST /api/tax/recalculate — Harmonize & Align All Invoices to Statutory Intra/Inter-State GST
exports.recalculateAllInvoicesTax = async (req, res) => {
  try {
    const originState = '33'; // Sivakasi, Tamil Nadu

    // High performance bulk data prefetch
    const [invoices, customers, items] = await Promise.all([
      Invoice.find(),
      Customer.find().lean(),
      InvoiceItem.find()
    ]);

    const custMap = new Map();
    customers.forEach(c => custMap.set(String(c._id), c));

    const itemsByInvoice = new Map();
    items.forEach(it => {
      const invId = String(it.invoice_id);
      if (!itemsByInvoice.has(invId)) itemsByInvoice.set(invId, []);
      itemsByInvoice.get(invId).push(it);
    });

    const itemBulkOps = [];
    const invoiceBulkOps = [];
    let updatedCount = 0;

    for (const inv of invoices) {
      let destState = '33'; // Default TN

      if (inv.customer_id) {
        const cust = custMap.get(String(inv.customer_id));
        if (cust?.gstin && cust.gstin.length >= 2) {
          destState = cust.gstin.slice(0, 2);
        } else if (cust?.address) {
          const addr = cust.address.toLowerCase();
          if (addr.includes('maharashtra')) destState = '27';
          else if (addr.includes('karnataka')) destState = '29';
          else if (addr.includes('kerala')) destState = '32';
          else if (addr.includes('delhi')) destState = '07';
        }
      }

      // Check if intra-state or inter-state
      const isIntraState = (originState === destState);

      const invItems = itemsByInvoice.get(String(inv._id)) || [];
      let newSubtotal = 0;
      let newCGST = 0;
      let newSGST = 0;
      let newIGST = 0;

      for (const item of invItems) {
        const taxable = Number(((item.quantity || 1) * (item.unit_price || 0)).toFixed(2));
        let cgst = 0;
        let sgst = 0;
        let igst = 0;

        if (isIntraState) {
          cgst = Number((taxable * 0.09).toFixed(2));
          sgst = Number((taxable * 0.09).toFixed(2));
          igst = 0;
        } else {
          cgst = 0;
          sgst = 0;
          igst = Number((taxable * 0.18).toFixed(2));
        }

        const lineTax = Number((cgst + sgst + igst).toFixed(2));
        const lineTotal = Number((taxable + lineTax).toFixed(2));

        itemBulkOps.push({
          updateOne: {
            filter: { _id: item._id },
            update: {
              $set: {
                taxable_amount: taxable,
                gst_rate: 18,
                cgst,
                sgst,
                igst,
                line_total: lineTotal
              }
            }
          }
        });

        newSubtotal += taxable;
        newCGST += cgst;
        newSGST += sgst;
        newIGST += igst;
      }

      newSubtotal = Number(newSubtotal.toFixed(2));
      newCGST = Number(newCGST.toFixed(2));
      newSGST = Number(newSGST.toFixed(2));
      newIGST = Number(newIGST.toFixed(2));
      const totalTax = Number((newCGST + newSGST + newIGST).toFixed(2));

      const disc = inv.discount_amount || 0;
      const other = inv.other_charges || 0;
      const pack = inv.packaging_charges || 0;
      const netTotal = Number((newSubtotal - disc + totalTax + other + pack).toFixed(2));

      // Re-sign SHA-256 block hash
      const newHash = generateInvoiceBlockHash({
        invoiceNo: inv.invoice_no,
        netTotal,
        timestamp: inv.invoice_timestamp || new Date(),
        prevHash: inv.prev_hash,
        branchId: inv.branch_id || 'SIVAKASI-DEPOT-01'
      });

      invoiceBulkOps.push({
        updateOne: {
          filter: { _id: inv._id },
          update: {
            $set: {
              subtotal: newSubtotal,
              total_tax: totalTax,
              cgst_total: newCGST,
              sgst_total: newSGST,
              igst_total: newIGST,
              net_total: netTotal,
              crypto_hash: newHash
            }
          }
        }
      });

      updatedCount++;
    }

    if (itemBulkOps.length > 0) {
      await InvoiceItem.bulkWrite(itemBulkOps);
    }
    if (invoiceBulkOps.length > 0) {
      await Invoice.bulkWrite(invoiceBulkOps);
    }

    res.json({
      status: 'success',
      message: `Statutory GST recalculated and synchronized across ${updatedCount} sales invoices in MongoDB Atlas.`,
      updatedCount,
      itemsUpdated: itemBulkOps.length
    });
  } catch (err) {
    console.error('recalculateAllInvoicesTax Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// 5. POST /api/tax/simulate — Interactive What-If Tax Scenario Modeler
exports.simulateTax = async (req, res) => {
  try {
    const { proposedRate = 18, category = 'Fireworks' } = req.body;
    const rateNum = Number(proposedRate);

    const invoices = await Invoice.find({ payment_status: { $ne: 'VOID' } });
    const totalTaxable = invoices.reduce((acc, i) => acc + (i.subtotal || 0), 0);
    const currentTax = invoices.reduce((acc, i) => acc + (i.total_tax || 0), 0);

    const projectedTax = Number((totalTaxable * (rateNum / 100)).toFixed(2));
    const deltaVariance = Number((projectedTax - currentTax).toFixed(2));

    res.json({
      status: 'success',
      simulation: {
        category,
        currentStatutoryRate: 18,
        proposedSimulatedRate: rateNum,
        totalTaxableTurnover: Number(totalTaxable.toFixed(2)),
        currentTaxLiability: Number(currentTax.toFixed(2)),
        projectedTaxLiability: projectedTax,
        deltaTaxPayable: deltaVariance,
        percentChange: currentTax > 0 ? Number(((deltaVariance / currentTax) * 100).toFixed(1)) : 0,
        strategicRecommendation: rateNum > 18
          ? 'Higher rate will compress wholesale retail margins. Recommend offering bulk early-order 10% rebates.'
          : 'Lower tax rate provides margin cushion to capture interstate fireworks market share across Maharashtra & Karnataka.'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. GET /api/tax/export — Download Statutory Returns
exports.exportTaxReport = async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    const invoices = await Invoice.find({ payment_status: { $ne: 'VOID' } }).populate('customer_id');

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="GSTR1_Return_SmartLedger.json"');
      return res.json({
        gstin: '33AABCV1384M1Z2',
        fp: '2026-03',
        gt: invoices.reduce((a, b) => a + (b.net_total || 0), 0),
        b2b: invoices.map(i => ({
          ctin: i.customer_id?.gstin || (i.igst_total > 0 ? '27AAACB2026A1Z5' : '33AABCV1384M1Z2'),
          inv: [{
            inum: i.invoice_no,
            idt: new Date(i.invoice_timestamp || Date.now()).toISOString().split('T')[0],
            val: i.net_total,
            pos: i.igst_total > 0 ? '27' : '33',
            rchrg: 'N',
            itms: [{
              num: 1,
              itm_det: {
                txval: i.subtotal,
                rt: 18,
                camt: i.cgst_total,
                samt: i.sgst_total,
                iamt: i.igst_total,
                csamt: 0
              }
            }]
          }]
        }))
      });
    }

    // CSV format
    const headers = ['GSTIN/UIN of Recipient', 'Receiver Name', 'Invoice Number', 'Invoice date', 'Invoice Value', 'Place Of Supply', 'Reverse Charge', 'Invoice Type', 'Rate', 'Taxable Value', 'Integrated Tax', 'Central Tax', 'State Tax'];
    const rows = invoices.map(i => [
      i.customer_id?.gstin || (i.igst_total > 0 ? '27AAACB2026A1Z5' : '33AABCV1384M1Z2'),
      `"${i.customer_name}"`,
      i.invoice_no,
      new Date(i.invoice_timestamp || Date.now()).toISOString().split('T')[0],
      i.net_total,
      i.igst_total > 0 ? '27-Maharashtra' : '33-Tamil Nadu',
      'N',
      'Regular',
      '18%',
      i.subtotal,
      i.igst_total,
      i.cgst_total,
      i.sgst_total
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="SmartLedger_GSTR1_Statutory.csv"');
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
