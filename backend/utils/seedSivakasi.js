const mongoose = require('mongoose');
const StaffUser = require('../models/StaffUser');
const Customer = require('../models/Customer');
const ProductCategory = require('../models/ProductCategory');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const InvoiceItem = require('../models/InvoiceItem');
const Business = require('../models/Business');
const LedgerEntry = require('../models/LedgerEntry');
const RiskAuditLog = require('../models/RiskAuditLog');
const { SREEVEE_CATEGORIES, SREEVEE_PRODUCTS, DISCOUNT_SLABS } = require('../data/sreeveeSathyaData');
const { generateInvoiceBlockHash } = require('../services/cryptoHash');

function numberToIndianWords(num) {
  if (num === null || num === undefined || isNaN(num)) return 'Zero Rupees only';
  num = Math.round(Number(num));
  if (num === 0) return 'Zero Rupees only';

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  }

  return inWords(num).trim() + ' Rupees only';
}

async function seedSivakasiData(force = false) {
  try {
    console.log('⚡ Initializing SREEVEESATHYA AGENCIES & VELAVAN CRACKERS Master Dataset...');

    // 1. Business Info
    let biz = await Business.findOne();
    const sivakasiAddress = {
      line1: '5/339 Sai Kuzanthai Ammal Nagar, ENJAR Village',
      city: 'Sivakasi',
      state: 'Tamil Nadu',
      pincode: '626124',
      country: 'India'
    };

    if (!biz) {
      biz = await Business.create({
        business_name: 'VELAVAN CRACKERS',
        legal_name: 'SREEVEESATHYA AGENCIES & VELAVAN CRACKERS',
        gstin: '33GCMPS3008E1ZO',
        address: sivakasiAddress,
        state_name: 'Tamil Nadu',
        state_code: '33',
        phone: '9600499750, 9486050349',
        email: 'sreeveesathya@gmail.com',
        is_onboarded: true
      });
      console.log('✓ Business initialized: VELAVAN CRACKERS (Sivakasi)');
    } else {
      biz.business_name = 'VELAVAN CRACKERS';
      biz.legal_name = 'SREEVEESATHYA AGENCIES & VELAVAN CRACKERS';
      biz.gstin = '33GCMPS3008E1ZO';
      biz.address = sivakasiAddress;
      biz.state_name = 'Tamil Nadu';
      biz.state_code = '33';
      biz.is_onboarded = true;
      await biz.save();
    }

    // 2. Staff Users
    let cashier = await StaffUser.findOne({ email: 'cashier@smartledger.ai' });
    if (!cashier) {
      cashier = await StaffUser.create({
        username: 'cashier1',
        full_name: 'Velavan Billing Operator',
        email: 'cashier@smartledger.ai',
        password_hash: 'Cashier@123',
        role: 'CASHIER',
        branch_id: 'SIVAKASI-DEPOT-01'
      });
    }

    let owner = await StaffUser.findOne({ email: 'owner@smartledger.ai' });
    if (!owner) {
      owner = await StaffUser.create({
        username: 'owner1',
        full_name: 'Sreeveesathya Director',
        email: 'owner@smartledger.ai',
        password_hash: 'Owner@123',
        role: 'BUSINESS_OWNER',
        branch_id: 'SIVAKASI-HQ'
      });
    }

    let warehouseMgr = await StaffUser.findOne({ email: 'warehouse@smartledger.ai' });
    if (!warehouseMgr) {
      warehouseMgr = await StaffUser.create({
        username: 'warehouse1',
        full_name: 'Enjar Depot Manager',
        email: 'warehouse@smartledger.ai',
        password_hash: 'Warehouse@123',
        role: 'WAREHOUSE_MGR',
        branch_id: 'WH-ENJAR-01'
      });
    }

    let admin = await StaffUser.findOne({ email: 'admin@smartledger.ai' });
    if (!admin) {
      admin = await StaffUser.create({
        username: 'admin1',
        full_name: 'System Administrator',
        email: 'admin@smartledger.ai',
        password_hash: 'Admin@123',
        role: 'BUSINESS_OWNER',
        branch_id: 'SIVAKASI-HQ'
      });
    }

    // 3. Customers (including PDF 1 customer)
    let customerMah = await Customer.findOne({ phone_number: '7719975175' });
    if (!customerMah) {
      customerMah = await Customer.create({
        full_name: 'Mah gondia sitaram chauraswya',
        phone_number: '7719975175',
        email: 'mah.gondia@crackerstrade.in',
        address: 'Wholesale Market, Gondia, Maharashtra - 441601',
        gstin: '27AABCU9603R1ZM',
        credit_limit: 250000,
        current_balance: 29205,
        credit_score: 780,
        risk_category: 'LOW_RISK'
      });
      console.log('✓ Customer created: Mah gondia sitaram chauraswya (PDF 1)');
    }

    let customerBalaji = await Customer.findOne({ phone_number: '9842188231' });
    if (!customerBalaji) {
      customerBalaji = await Customer.create({
        full_name: 'Balaji Fireworks Wholesalers',
        phone_number: '9842188231',
        email: 'balaji.crackers@gmail.com',
        address: 'Bazaar Main Road, Madurai - 625001',
        gstin: '33AABCB1234D1ZP',
        credit_limit: 500000,
        current_balance: 45000,
        credit_score: 720,
        risk_category: 'LOW_RISK'
      });
    }

    let customerMeenakshi = await Customer.findOne({ phone_number: '9443176542' });
    if (!customerMeenakshi) {
      customerMeenakshi = await Customer.create({
        full_name: 'Meenakshi Trade Distributors',
        phone_number: '9443176542',
        email: 'meenakshi.dist@gmail.com',
        address: 'Goods Shed Road, Virudhunagar - 626001',
        gstin: '33AABCM5678F1ZQ',
        credit_limit: 150000,
        current_balance: 135000,
        credit_score: 540,
        risk_category: 'HIGH_RISK'
      });
    }

    // 4. Categories
    const categoryMap = {};
    for (const cat of SREEVEE_CATEGORIES) {
      let existingCat = await ProductCategory.findOne({ category_name: cat.name });
      if (!existingCat) {
        existingCat = await ProductCategory.create({
          category_name: cat.name,
          gst_rate: 18.0,
          hsn_sac_code: '3604',
          description: cat.description
        });
      }
      categoryMap[cat.name] = existingCat._id;
    }
    console.log(`✓ Synchronized ${SREEVEE_CATEGORIES.length} Sivakasi Product Categories.`);

    // 5. Products (all 185 from PDF 2)
    const existingCount = await Product.countDocuments();
    if (existingCount < 50 || force) {
      console.log('⚡ Populating Sivakasi Crackers Catalog (185 Products from Pricelist 2026)...');
      for (const prod of SREEVEE_PRODUCTS) {
        const sku = `CRK-${String(prod.sno).padStart(3, '0')}`;
        const catId = categoryMap[prod.category] || Object.values(categoryMap)[0];
        const costPrice = Number((prod.rate * 0.65).toFixed(2));
        const stockQty = prod.sno === 186 ? 350 : Math.floor(Math.random() * 200) + 40;

        await Product.findOneAndUpdate(
          { sku_barcode: sku },
          {
            sku_barcode: sku,
            product_name: prod.name,
            category_id: catId,
            unit_price: prod.rate,
            cost_price: costPrice,
            stock_quantity: stockQty,
            reorder_level: 25,
            case_content: prod.caseContent || 36,
            brand: prod.brand || 'Karpagam',
            hsn_code: '3604',
            no_discount: Boolean(prod.noDiscount),
            batch_lot_number: 'LOT-2026-ENJAR'
          },
          { upsert: true, new: true }
        );
      }
      console.log(`✓ 185 Crackers Products seeded successfully with rates and case specifications.`);
    }

    // 6. Seed Invoice #1384 from PDF 1 (VELAVAN CRACKERS / Estimates)
    let inv1384 = await Invoice.findOne({ invoice_no: '1384' });
    if (!inv1384) {
      const bijiliProduct = await Product.findOne({ sku_barcode: 'CRK-186' }) ||
        await Product.findOne({ product_name: /Red bijili/i }) ||
        await Product.findOne();

      const prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
      const timestamp = new Date('2026-09-07T10:30:00Z');
      const cryptoHash = generateInvoiceBlockHash({
        invoiceNo: '1384',
        netTotal: 29205.00,
        timestamp,
        prevHash,
        branchId: 'SIVAKASI-DEPOT-01'
      });

      inv1384 = await Invoice.create({
        invoice_no: '1384',
        customer_id: customerMah._id,
        customer_name: 'Mah gondia sitaram chauraswya',
        customer_phone: '7719975175',
        cashier_id: cashier._id,
        cashier_name: 'Velavan Billing Operator',
        branch_id: 'SIVAKASI-DEPOT-01',
        terminal_geo_token: { lat: 9.4533, lng: 77.7946, accuracy: 5.0, verified: true },
        subtotal: 27000.00,
        total_tax: 0.00,
        cgst_total: 0.00,
        sgst_total: 0.00,
        igst_total: 0.00,
        discount_amount: 0.00,
        other_charges: 1800.00,
        packaging_charges: 405.00,
        total_cases: 5,
        net_total: 29205.00,
        received_amount: 0.00,
        balance_amount: 29205.00,
        amount_in_words: 'Twenty Nine Thousand Two Hundred and Five Rupees only',
        transport_name: 'VRL Logistics',
        vehicle_number: 'TN 67 AB 1234',
        terms_conditions: 'Goods once sold will not be taken back. Sivakasi jurisdiction only. Thank you for doing business with us.',
        company_name: 'VELAVAN CRACKERS',
        crypto_hash: cryptoHash,
        prev_hash: prevHash,
        payment_method: 'CASH',
        payment_status: 'PAID',
        invoice_timestamp: timestamp
      });

      // Line Item for #1384
      await InvoiceItem.create({
        invoice_id: inv1384._id,
        product_id: bijiliProduct?._id,
        sku_barcode: bijiliProduct?.sku_barcode || 'CRK-186',
        product_name: 'Red bijili 100 pcs gold bags',
        quantity: 180,
        unit_price: 150.00,
        cost_price: 95.00,
        case_content: 36,
        brand: 'Karpagam',
        no_of_cases: 5,
        taxable_amount: 27000.00,
        gst_rate: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        line_total: 27000.00
      });

      // Post Double-Entry Ledger for Invoice #1384
      await LedgerEntry.create([
        {
          entry_id: `LED-1384-01`,
          account_name: 'Cash and Bank Balances',
          debit: 29205.00,
          credit: 0,
          running_balance: 529205.00,
          transaction_type: 'INVOICE',
          reference_no: '1384',
          reference_id: inv1384._id,
          customer_id: customerMah._id,
          customer_name: customerMah.full_name,
          description: 'Invoice 1384 sale to Mah gondia sitaram chauraswya',
          created_by: 'Velavan Billing Operator',
          date: timestamp
        },
        {
          entry_id: `LED-1384-02`,
          account_name: 'Sales Revenue',
          debit: 0,
          credit: 27000.00,
          running_balance: 529205.00,
          transaction_type: 'INVOICE',
          reference_no: '1384',
          reference_id: inv1384._id,
          customer_id: customerMah._id,
          customer_name: customerMah.full_name,
          description: 'Sales revenue for 180 pcs Red bijili gold bags (5 Cases)',
          created_by: 'Velavan Billing Operator',
          date: timestamp
        },
        {
          entry_id: `LED-1384-03`,
          account_name: 'Freight & Logistics Recoveries',
          debit: 0,
          credit: 1800.00,
          running_balance: 529205.00,
          transaction_type: 'INVOICE',
          reference_no: '1384',
          reference_id: inv1384._id,
          customer_id: customerMah._id,
          customer_name: customerMah.full_name,
          description: 'Other charges / Transport fee for invoice 1384',
          created_by: 'Velavan Billing Operator',
          date: timestamp
        },
        {
          entry_id: `LED-1384-04`,
          account_name: 'Packaging & Bundle Charges',
          debit: 0,
          credit: 405.00,
          running_balance: 529205.00,
          transaction_type: 'INVOICE',
          reference_no: '1384',
          reference_id: inv1384._id,
          customer_id: customerMah._id,
          customer_name: customerMah.full_name,
          description: 'Packaging charges (5 wholesale gunny bags)',
          created_by: 'Velavan Billing Operator',
          date: timestamp
        }
      ]);

      console.log('✓ Seeded PDF 1 Invoice #1384 (VELAVAN CRACKERS / Estimates) + General Ledger double entries.');
    }

    // 7. Seed Additional Invoices with Draft & Finalized statuses for the Ledger list
    let inv1385 = await Invoice.findOne({ invoice_no: '1385' });
    if (!inv1385) {
      const p1 = await Product.findOne({ sku_barcode: 'CRK-001' });
      const p2 = await Product.findOne({ sku_barcode: 'CRK-013' });
      inv1385 = await Invoice.create({
        invoice_no: '1385',
        customer_id: customerBalaji._id,
        customer_name: customerBalaji.full_name,
        customer_phone: customerBalaji.phone_number,
        cashier_id: cashier._id,
        cashier_name: 'Velavan Billing Operator',
        branch_id: 'SIVAKASI-DEPOT-01',
        terminal_geo_token: { lat: 9.4533, lng: 77.7946, accuracy: 5.0, verified: true },
        subtotal: 15400.00,
        total_tax: 2772.00,
        cgst_total: 1386.00,
        sgst_total: 1386.00,
        igst_total: 0.00,
        discount_amount: 1540.00,
        other_charges: 600.00,
        packaging_charges: 150.00,
        total_cases: 4,
        net_total: 17382.00,
        received_amount: 17382.00,
        balance_amount: 0.00,
        amount_in_words: numberToIndianWords(17382.00),
        transport_name: 'Southern Roadways',
        vehicle_number: 'TN 58 BC 4567',
        terms_conditions: 'Goods once sold will not be taken back. Sivakasi jurisdiction only.',
        company_name: 'VELAVAN CRACKERS',
        crypto_hash: 'c8f793b8214fa82910d65b12398ac34219487219502938472910485729103847',
        prev_hash: inv1384.crypto_hash,
        payment_method: 'UPI',
        payment_status: 'PAID',
        invoice_timestamp: new Date('2026-09-08T14:15:00Z')
      });

      await InvoiceItem.create([
        {
          invoice_id: inv1385._id,
          product_id: p1?._id,
          sku_barcode: 'CRK-001',
          product_name: "3½''LAKSHMI",
          quantity: 200,
          unit_price: 16.00,
          cost_price: 10.40,
          case_content: 50,
          brand: 'Sreeveesathya',
          no_of_cases: 4,
          taxable_amount: 3200.00,
          gst_rate: 18,
          cgst: 288.00,
          sgst: 288.00,
          igst: 0,
          line_total: 3776.00
        }
      ]);
    }

    let invDraft = await Invoice.findOne({ invoice_no: '1386' });
    if (!invDraft) {
      invDraft = await Invoice.create({
        invoice_no: '1386',
        customer_id: customerMeenakshi._id,
        customer_name: customerMeenakshi.full_name,
        customer_phone: customerMeenakshi.phone_number,
        cashier_id: cashier._id,
        cashier_name: 'Velavan Billing Operator',
        branch_id: 'SIVAKASI-DEPOT-01',
        terminal_geo_token: { lat: 9.4533, lng: 77.7946, accuracy: 5.0, verified: true },
        subtotal: 42000.00,
        total_tax: 7560.00,
        cgst_total: 3780.00,
        sgst_total: 3780.00,
        igst_total: 0.00,
        discount_amount: 4200.00,
        other_charges: 2400.00,
        packaging_charges: 600.00,
        total_cases: 10,
        net_total: 48360.00,
        received_amount: 0.00,
        balance_amount: 48360.00,
        amount_in_words: numberToIndianWords(48360.00),
        transport_name: 'SRS Travels Logistics',
        vehicle_number: 'TN 69 Z 8901',
        terms_conditions: 'Draft wholesale estimate awaiting dispatch clearance.',
        company_name: 'VELAVAN CRACKERS',
        crypto_hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f901234567890abcdef1234567890abcdef',
        prev_hash: inv1385?.crypto_hash || '0000',
        payment_method: 'CREDIT',
        payment_status: 'DRAFT',
        invoice_timestamp: new Date('2026-09-09T16:45:00Z')
      });
    }

    console.log('✅ SREEVEESATHYA AGENCIES & VELAVAN CRACKERS seeding finished successfully!');
    return { success: true, productsCount: SREEVEE_PRODUCTS.length };
  } catch (err) {
    console.error('❌ Sivakasi seed error:', err);
    throw err;
  }
}

module.exports = { seedSivakasiData };
