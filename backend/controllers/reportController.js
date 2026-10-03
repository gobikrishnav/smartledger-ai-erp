const Invoice = require('../models/Invoice');
const InvoiceItem = require('../models/InvoiceItem');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const LedgerEntry = require('../models/LedgerEntry');

// GET /api/reports/sales
exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, format } = req.query;
    const query = { payment_status: { $ne: 'VOID' } };

    if (startDate || endDate) {
      query.invoice_timestamp = {};
      if (startDate) query.invoice_timestamp.$gte = new Date(startDate);
      if (endDate) query.invoice_timestamp.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(query).sort({ invoice_timestamp: -1 });

    const totalSales = invoices.reduce((acc, inv) => acc + (inv.net_total || 0), 0);
    const totalTax = invoices.reduce((acc, inv) => acc + (inv.total_tax || 0), 0);
    const totalDiscounts = invoices.reduce((acc, inv) => acc + (inv.discount_amount || 0), 0);

    const paymentMethodStats = {};
    invoices.forEach(inv => {
      const pm = inv.payment_method || 'UPI';
      paymentMethodStats[pm] = (paymentMethodStats[pm] || 0) + inv.net_total;
    });

    const reportData = {
      summary: {
        totalRevenue: Number(totalSales.toFixed(2)),
        totalTaxCollected: Number(totalTax.toFixed(2)),
        totalDiscountsGiven: Number(totalDiscounts.toFixed(2)),
        invoiceCount: invoices.length,
        averageTicketSize: invoices.length ? Number((totalSales / invoices.length).toFixed(2)) : 0
      },
      paymentMethods: paymentMethodStats,
      invoices: invoices.map(i => ({
        invoice_no: i.invoice_no,
        date: i.invoice_timestamp.toISOString().split('T')[0],
        customer: i.customer_name,
        payment_method: i.payment_method,
        subtotal: i.subtotal,
        tax: i.total_tax,
        total: i.net_total,
        status: i.payment_status
      }))
    };

    if (format === 'csv') {
      const headers = ['Invoice No', 'Date', 'Customer', 'Payment Method', 'Subtotal', 'Tax', 'Total', 'Status'];
      const rows = reportData.invoices.map(i => [
        i.invoice_no, i.date, `"${i.customer}"`, i.payment_method, i.subtotal, i.tax, i.total, i.status
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="SmartLedger_Sales_Report.csv"');
      return res.send(csv);
    }

    res.json({ success: true, data: reportData, message: 'Sales report generated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/gst
exports.getGSTReport = async (req, res) => {
  try {
    const { format } = req.query;
    const invoices = await Invoice.find({ payment_status: { $ne: 'VOID' } });

    let totalTaxable = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    const b2bInvoices = [];

    invoices.forEach(inv => {
      totalTaxable += inv.subtotal || 0;
      totalCGST += inv.cgst_total || 0;
      totalSGST += inv.sgst_total || 0;
      totalIGST += inv.igst_total || 0;

      b2bInvoices.push({
        invoice_no: inv.invoice_no,
        invoice_date: inv.invoice_timestamp.toISOString().split('T')[0],
        customer_name: inv.customer_name,
        taxable_value: inv.subtotal,
        cgst: inv.cgst_total,
        sgst: inv.sgst_total,
        igst: inv.igst_total,
        total_tax: inv.total_tax,
        invoice_total: inv.net_total
      });
    });

    const reportData = {
      gstr1_summary: {
        totalTaxableValue: Number(totalTaxable.toFixed(2)),
        totalCGST: Number(totalCGST.toFixed(2)),
        totalSGST: Number(totalSGST.toFixed(2)),
        totalIGST: Number(totalIGST.toFixed(2)),
        totalTaxLiability: Number((totalCGST + totalSGST + totalIGST).toFixed(2)),
        b2bRecordCount: b2bInvoices.length
      },
      b2bTransactions: b2bInvoices
    };

    if (format === 'csv') {
      const headers = ['Invoice No', 'Date', 'Customer', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Tax', 'Invoice Total'];
      const rows = b2bInvoices.map(i => [
        i.invoice_no, i.invoice_date, `"${i.customer_name}"`, i.taxable_value, i.cgst, i.sgst, i.igst, i.total_tax, i.invoice_total
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="SmartLedger_GSTR1_Report.csv"');
      return res.send(csv);
    }

    res.json({ success: true, data: reportData, message: 'GST statutory report generated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/inventory
exports.getInventoryReport = async (req, res) => {
  try {
    const { format } = req.query;
    const products = await Product.find().populate('category_id');

    let totalValuation = 0;
    let totalCostValuation = 0;
    let lowStockCount = 0;

    const items = products.map(p => {
      const stockVal = p.stock_quantity * p.unit_price;
      const costVal = p.stock_quantity * (p.cost_price || p.unit_price * 0.65);
      totalValuation += stockVal;
      totalCostValuation += costVal;
      if (p.stock_quantity <= p.reorder_level) lowStockCount++;

      return {
        sku: p.sku_barcode,
        name: p.product_name,
        category: p.category_id?.category_name || 'General',
        stock: p.stock_quantity,
        reorder_point: p.reorder_level,
        unit_price: p.unit_price,
        cost_price: p.cost_price,
        total_valuation: Number(stockVal.toFixed(2)),
        status: p.stock_quantity <= p.reorder_level ? 'LOW STOCK' : 'OPTIMAL'
      };
    });

    const reportData = {
      summary: {
        totalSKUs: products.length,
        totalStockValuation: Number(totalValuation.toFixed(2)),
        totalCostValuation: Number(totalCostValuation.toFixed(2)),
        unrealizedGrossMargin: Number((totalValuation - totalCostValuation).toFixed(2)),
        lowStockItemsCount: lowStockCount
      },
      items
    };

    if (format === 'csv') {
      const headers = ['SKU', 'Product Name', 'Category', 'Stock Qty', 'Reorder Level', 'Unit Price', 'Cost Price', 'Valuation', 'Status'];
      const rows = items.map(i => [
        i.sku, `"${i.name}"`, `"${i.category}"`, i.stock, i.reorder_point, i.unit_price, i.cost_price, i.total_valuation, i.status
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="SmartLedger_Inventory_Report.csv"');
      return res.send(csv);
    }

    res.json({ success: true, data: reportData, message: 'Inventory report generated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/customers
exports.getCustomersReport = async (req, res) => {
  try {
    const { format } = req.query;
    const customers = await Customer.find().sort({ current_balance: -1 });

    const totalReceivables = customers.reduce((acc, c) => acc + (c.current_balance || 0), 0);
    const totalCreditLimit = customers.reduce((acc, c) => acc + (c.credit_limit || 0), 0);

    const reportData = {
      summary: {
        totalCustomers: customers.length,
        totalOutstandingReceivables: Number(totalReceivables.toFixed(2)),
        totalCreditLimitExtended: Number(totalCreditLimit.toFixed(2)),
        overallCreditUtilization: totalCreditLimit ? Number(((totalReceivables / totalCreditLimit) * 100).toFixed(1)) : 0
      },
      customers: customers.map(c => ({
        id: c._id,
        name: c.full_name,
        gstin: c.gstin,
        phone: c.phone_number,
        credit_limit: c.credit_limit,
        current_balance: c.current_balance,
        risk_score: c.risk_score || 0.25,
        risk_status: c.risk_status || 'NORMAL',
        overdue_days: c.overdue_days || 0
      }))
    };

    if (format === 'csv') {
      const headers = ['Customer Name', 'GSTIN', 'Phone', 'Credit Limit', 'Current Balance', 'Risk Score', 'Status', 'Overdue Days'];
      const rows = reportData.customers.map(c => [
        `"${c.name}"`, c.gstin, c.phone, c.credit_limit, c.current_balance, c.risk_score, c.risk_status, c.overdue_days
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="SmartLedger_Customers_Report.csv"');
      return res.send(csv);
    }

    res.json({ success: true, data: reportData, message: 'Customers report generated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
