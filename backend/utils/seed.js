const mongoose = require('mongoose');
const StaffUser = require('../models/StaffUser');
const Customer = require('../models/Customer');
const ProductCategory = require('../models/ProductCategory');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const InvoiceItem = require('../models/InvoiceItem');
const PurchaseOrder = require('../models/PurchaseOrder');
const RiskAuditLog = require('../models/RiskAuditLog');
const { generateInvoiceBlockHash } = require('../services/cryptoHash');
const { seedEnterpriseData } = require('./seedEnterpriseData');

async function seedERPDatabase() {
  try {
    const Business = require('../models/Business');
    const { seedSivakasiData } = require('./seedSivakasi');

    // Ensure Sivakasi Cracker Master Catalog and PDF 1 Invoice are seeded
    await seedSivakasiData(false);

    // Default to clean slate brand new mode unless AUTO_SEED is explicitly requested
    if (process.env.AUTO_SEED !== 'true') {
      console.log('✨ Sivakasi Master Dataset ready. Skipping legacy mock transaction seeding.');
      return;
    }

    await seedEnterpriseData();
    const userCount = await StaffUser.countDocuments();
    if (userCount > 5) {
      console.log('✓ Database already initialized. Skipping full base seed.');
      return;
    }

    console.log('⚡ Seeding SmartLedger AI ERP Master Dataset...');

    // 1. Seed Role Accounts
    const staffUsers = await StaffUser.create([
      {
        username: 'admin1',
        full_name: 'Admin Director',
        email: 'admin@smartledger.ai',
        password_hash: 'Admin@123',
        role: 'BUSINESS_OWNER',
        branch_id: 'BR-CENTRAL-01'
      },
      {
        username: 'owner1',
        full_name: 'Vikramaditya Singhania',
        email: 'owner@smartledger.ai',
        password_hash: 'Owner@123',
        role: 'BUSINESS_OWNER',
        branch_id: 'BR-CENTRAL-01'
      },
      {
        username: 'warehouse1',
        full_name: 'Suresh Menon',
        email: 'warehouse@smartledger.ai',
        password_hash: 'Warehouse@123',
        role: 'WAREHOUSE_MGR',
        branch_id: 'WH-MAIN-01'
      },
      {
        username: 'wm1',
        full_name: 'Suresh Menon (Depot)',
        email: 'wm@smartledger.ai',
        password_hash: 'Wm@123',
        role: 'WAREHOUSE_MGR',
        branch_id: 'WH-MAIN-01'
      },
      {
        username: 'cashier1',
        full_name: 'Rahul Sharma',
        email: 'cashier@smartledger.ai',
        password_hash: 'Cashier@123',
        role: 'CASHIER',
        branch_id: 'BR-CENTRAL-01'
      }
    ]);
    console.log('✓ Seeded Staff Users: Admin Director, Business Owner, Warehouse Manager, Cashier.');

    // 2. Seed Product Categories with Indian Statutory GST Brackets
    const categories = await ProductCategory.create([
      {
        category_name: 'Solar & Renewable Energy',
        gst_rate: 18.0,
        hsn_sac_code: '8504',
        description: 'Solar inverters, high-efficiency MPPT controllers and PV modules.'
      },
      {
        category_name: 'Energy Storage & Batteries',
        gst_rate: 18.0,
        hsn_sac_code: '8507',
        description: 'Lithium iron phosphate (LiFePO4) storage batteries.'
      },
      {
        category_name: 'Switchgear & Circuit Protection',
        gst_rate: 18.0,
        hsn_sac_code: '8536',
        description: 'DC MCBs, Surge Protectors, and Industrial Breakers.'
      },
      {
        category_name: 'Industrial Tools & Hardware',
        gst_rate: 18.0,
        hsn_sac_code: '8205',
        description: 'Precision crimping, stripping, and optical testing equipment.'
      },
      {
        category_name: 'Telecom & Networking',
        gst_rate: 18.0,
        hsn_sac_code: '8517',
        description: 'Fiber optic cables, gigabit routers, and optical splitters.'
      },
      {
        category_name: 'Automation & IoT',
        gst_rate: 18.0,
        hsn_sac_code: '9032',
        description: 'Environmental monitoring sensors and programmable relays.'
      },
      {
        category_name: 'Heavy Commercial Automotives',
        gst_rate: 28.0,
        hsn_sac_code: '8708',
        description: 'Commercial fleet spares and auxiliary power systems.'
      },
      {
        category_name: 'Protective Workwear & Textiles',
        gst_rate: 5.0,
        hsn_sac_code: '5208',
        description: 'Arc-rated industrial uniforms and safety apparel.'
      }
    ]);
    console.log('✓ Seeded Statutory GST Product Categories.');

    // 3. Seed Products with Barcodes & Expiry Dates
    const catMap = {};
    categories.forEach(c => { catMap[c.category_name] = c._id; });

    const now = new Date();
    const expiryFar = new Date(now.getFullYear() + 2, 5, 15);
    const expirySoon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days (near expiry)
    const expiryPast = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago (expired)

    const products = await Product.create([
      {
        sku_barcode: '8901001001',
        product_name: 'Industrial Solar Core Inverter 5kW',
        category_id: catMap['Solar & Renewable Energy'],
        unit_price: 45000,
        cost_price: 32000,
        stock_quantity: 28,
        reorder_level: 8,
        batch_number: 'BAT-2026-INV1',
        expiry_date: expiryFar
      },
      {
        sku_barcode: '8901001002',
        product_name: 'Copper MC4 PV Cable 50m Drum',
        category_id: catMap['Solar & Renewable Energy'],
        unit_price: 4200,
        cost_price: 2800,
        stock_quantity: 4, // LOW STOCK (<= 10)
        reorder_level: 10,
        batch_number: 'BAT-2026-CBL2',
        expiry_date: expiryFar
      },
      {
        sku_barcode: '8901001003',
        product_name: 'Monocrystalline Solar Panel 550W',
        category_id: catMap['Solar & Renewable Energy'],
        unit_price: 16500,
        cost_price: 11800,
        stock_quantity: 65,
        reorder_level: 15,
        batch_number: 'BAT-2026-PNL3',
        expiry_date: expiryFar
      },
      {
        sku_barcode: '8901001004',
        product_name: 'Lithium Iron LiFePO4 Battery 48V 100Ah',
        category_id: catMap['Energy Storage & Batteries'],
        unit_price: 78000,
        cost_price: 54000,
        stock_quantity: 3, // LOW STOCK
        reorder_level: 6,
        batch_number: 'BAT-2026-LFP4',
        expiry_date: expiryFar
      },
      {
        sku_barcode: '8901001005',
        product_name: 'DC Surge Protection Breaker 1000V 32A',
        category_id: catMap['Switchgear & Circuit Protection'],
        unit_price: 1850,
        cost_price: 1100,
        stock_quantity: 42,
        reorder_level: 12,
        batch_number: 'BAT-2026-BRK5',
        expiry_date: expiryFar
      },
      {
        sku_barcode: '8901001006',
        product_name: 'Solar Crimping Tool Set Pro Heavy-Duty',
        category_id: catMap['Industrial Tools & Hardware'],
        unit_price: 3200,
        cost_price: 2100,
        stock_quantity: 18,
        reorder_level: 5,
        batch_number: 'BAT-2026-TLS6',
        expiry_date: expiryFar
      },
      {
        sku_barcode: '8901001007',
        product_name: 'High-Speed Optical Patch Cord Single-Mode 10m',
        category_id: catMap['Telecom & Networking'],
        unit_price: 850,
        cost_price: 480,
        stock_quantity: 120,
        reorder_level: 25,
        batch_number: 'BAT-2026-FIB7',
        expiry_date: expirySoon // Near expiry batch
      },
      {
        sku_barcode: '8901001008',
        product_name: 'Dual-Band Gigabit Industrial Router SFP+',
        category_id: catMap['Telecom & Networking'],
        unit_price: 9400,
        cost_price: 6600,
        stock_quantity: 2, // CRITICAL LOW STOCK
        reorder_level: 8,
        batch_number: 'BAT-2026-RTR8',
        expiry_date: expiryFar
      },
      {
        sku_barcode: '8901001009',
        product_name: 'Industrial Thermal Paste & Sealant Tube',
        category_id: catMap['Industrial Tools & Hardware'],
        unit_price: 450,
        cost_price: 220,
        stock_quantity: 50,
        reorder_level: 10,
        batch_number: 'BAT-2025-SLN9',
        expiry_date: expiryPast // Expired batch
      },
      {
        sku_barcode: '8901001010',
        product_name: 'Arc-Rated Flame Retardant Safety Coverall',
        category_id: catMap['Protective Workwear & Textiles'],
        unit_price: 2400,
        cost_price: 1600,
        stock_quantity: 35,
        reorder_level: 10,
        batch_number: 'BAT-2026-TXT10',
        expiry_date: expiryFar
      }
    ]);
    console.log('✓ Seeded Product Master Catalog with SKU barcodes & expiry data.');

    // 4. Seed B2B Customers with Credit Limits & Balances
    const customers = await Customer.create([
      {
        full_name: 'Tata Power Solar Solutions Ltd',
        phone_number: '9845012345',
        email: 'procure@tatapowersolar.com',
        gstin: '29AAACT2727Q1ZW',
        credit_limit: 500000,
        current_balance: 145000,
        risk_status: 'SAFE',
        risk_score: 12.5,
        overdue_days: 2,
        avg_ticket_size: 45000,
        transaction_frequency: 18
      },
      {
        full_name: 'Reliance Green Energy Infrastructure',
        phone_number: '9880054321',
        email: 'vendor@reliancegreen.in',
        gstin: '27AABCR1234F1Z8',
        credit_limit: 800000,
        current_balance: 210000,
        risk_status: 'SAFE',
        risk_score: 18.0,
        overdue_days: 5,
        avg_ticket_size: 65000,
        transaction_frequency: 22
      },
      {
        full_name: 'Adani Renewables Regional Contractor',
        phone_number: '9900112233',
        email: 'billing@adanirenewables.com',
        gstin: '24AAACA0000A1Z5',
        credit_limit: 300000,
        current_balance: 85000,
        risk_status: 'SAFE',
        risk_score: 22.0,
        overdue_days: 6,
        avg_ticket_size: 32000,
        transaction_frequency: 10
      },
      {
        full_name: 'Delta Electro-Tech Spares (Flagged Buyer)',
        phone_number: '9741223344',
        email: 'accounts@deltaelectrotech.net',
        gstin: '29AABCD9999M1ZQ',
        credit_limit: 100000,
        current_balance: 96000,
        risk_status: 'FLAGGED',
        risk_score: 84.5,
        overdue_days: 48, // High overdue
        avg_ticket_size: 28000,
        transaction_frequency: 2
      }
    ]);
    console.log('✓ Seeded B2B Trade Customers.');

    // 5. Seed Historical Invoices with SHA-256 Hash Chaining
    let previousHash = '0000000000000000000000000000000000000000000000000000000000000000';
    const cashierUser = staffUsers[0];

    const sampleInvoicesData = [
      {
        customer: customers[0],
        items: [{ prod: products[0], qty: 2 }, { prod: products[1], qty: 3 }],
        payment: 'UPI',
        daysAgo: 12
      },
      {
        customer: customers[1],
        items: [{ prod: products[2], qty: 4 }, { prod: products[4], qty: 6 }],
        payment: 'CREDIT',
        daysAgo: 8
      },
      {
        customer: customers[2],
        items: [{ prod: products[3], qty: 1 }, { prod: products[5], qty: 2 }],
        payment: 'CARD',
        daysAgo: 3
      },
      {
        customer: customers[3],
        items: [{ prod: products[0], qty: 1 }, { prod: products[7], qty: 1 }],
        payment: 'CREDIT',
        daysAgo: 1
      }
    ];

    for (let idx = 0; idx < sampleInvoicesData.length; idx++) {
      const invData = sampleInvoicesData[idx];
      const invNo = `INV-2026-${String(idx + 1).padStart(5, '0')}`;
      const ts = new Date(Date.now() - invData.daysAgo * 24 * 60 * 60 * 1000);

      let subtotal = 0;
      let totalTax = 0;
      const lineDetails = [];

      for (const itm of invData.items) {
        const taxable = itm.prod.unit_price * itm.qty;
        const tax = taxable * 0.18;
        subtotal += taxable;
        totalTax += tax;
        lineDetails.push({
          product_id: itm.prod._id,
          sku_barcode: itm.prod.sku_barcode,
          product_name: itm.prod.product_name,
          quantity: itm.qty,
          unit_price: itm.prod.unit_price,
          cost_price: itm.prod.cost_price,
          taxable_amount: taxable,
          gst_rate: 18,
          cgst: tax / 2,
          sgst: tax / 2,
          igst: 0,
          line_total: taxable + tax
        });
      }

      const netTotal = subtotal + totalTax;

      // Compute SHA-256 block hash
      const cryptoHash = generateInvoiceBlockHash({
        invoiceNo: invNo,
        netTotal,
        timestamp: ts,
        prevHash: previousHash,
        branchId: 'BR-CENTRAL-01'
      });

      const invoice = await Invoice.create({
        invoice_no: invNo,
        customer_id: invData.customer._id,
        customer_name: invData.customer.full_name,
        customer_phone: invData.customer.phone_number,
        cashier_id: cashierUser._id,
        cashier_name: cashierUser.full_name,
        branch_id: 'BR-CENTRAL-01',
        terminal_geo_token: { lat: 12.9716, lng: 77.5946, accuracy: 10.0, verified: true },
        subtotal,
        total_tax: totalTax,
        cgst_total: totalTax / 2,
        sgst_total: totalTax / 2,
        igst_total: 0,
        net_total: netTotal,
        crypto_hash: cryptoHash,
        prev_hash: previousHash,
        payment_method: invData.payment,
        payment_status: 'PAID',
        invoice_timestamp: ts
      });

      for (const line of lineDetails) {
        line.invoice_id = invoice._id;
        await InvoiceItem.create(line);
      }

      previousHash = cryptoHash; // chain forward
    }
    console.log('✓ Seeded SHA-256 Chained Historical POS Invoices.');

    // 6. Seed Initial Risk Audit Log for Flagged Buyer
    await RiskAuditLog.create({
      log_id: `LOG-RISK-INIT-01`,
      customer_id: customers[3]._id,
      customer_name: customers[3].full_name,
      anomaly_score: -0.185,
      risk_score: 84.5,
      risk_level: 'HIGH_RISK',
      is_anomaly: true,
      decision_action: 'Isolation Forest flagged 48 days overdue payment cycle anomaly.',
      status: 'ACTIVE'
    });

    // 7. Seed Sample Purchase Order
    await PurchaseOrder.create({
      po_id: 'PO-2026-0001',
      supplier_name: 'Universal Industrial Logistics Corp',
      warehouse_mgr_id: staffUsers[1]._id,
      warehouse_mgr_name: staffUsers[1].full_name,
      branch_id: 'WH-MAIN-01',
      items: [
        {
          product_id: products[1]._id,
          sku_barcode: products[1].sku_barcode,
          product_name: products[1].product_name,
          quantity_ordered: 50,
          unit_cost: 2800,
          total_cost: 140000
        },
        {
          product_id: products[3]._id,
          sku_barcode: products[3].sku_barcode,
          product_name: products[3].product_name,
          quantity_ordered: 20,
          unit_cost: 54000,
          total_cost: 1080000
        }
      ],
      status: 'DISPATCHED',
      total_estimated_cost: 1220000,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });

    console.log('✓ Master Seed Execution Completed Successfully!');
  } catch (err) {
    console.error('! Error during seed execution:', err);
  }
}

module.exports = { seedERPDatabase };
