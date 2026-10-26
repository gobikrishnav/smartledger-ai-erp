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
const { SREEVEE_CATEGORIES, SREEVEE_PRODUCTS } = require('../data/sreeveeSathyaData');
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
    console.log('⚡ Initializing VELAVAN CRACKERS Enterprise Data Engine (Sivakasi)...');

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
      console.log('✓ Business profile initialized: VELAVAN CRACKERS (Sivakasi)');
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

    // 3. Seed Comprehensive Sivakasi B2B Wholesale & Retail Customers
    const customerSeedData = [
      {
        full_name: 'Mah gondia sitaram chauraswya',
        phone_number: '7719975175',
        email: 'mah.gondia@crackerstrade.in',
        address: 'Wholesale Market, Gondia, Maharashtra - 441601',
        gstin: '27AABCU9603R1ZM',
        credit_limit: 250000,
        current_balance: 29205,
        overdue_days: 0,
        avg_ticket_size: 28000,
        transaction_frequency: 14,
        risk_status: 'SAFE',
        risk_score: 0.12
      },
      {
        full_name: 'Balaji Fireworks Wholesalers',
        phone_number: '9842188231',
        email: 'balaji.crackers@gmail.com',
        address: 'Bazaar Main Road, Madurai - 625001',
        gstin: '33AABCB1234D1ZP',
        credit_limit: 500000,
        current_balance: 45000,
        overdue_days: 0,
        avg_ticket_size: 42000,
        transaction_frequency: 18,
        risk_status: 'SAFE',
        risk_score: 0.15
      },
      {
        full_name: 'Meenakshi Trade Distributors',
        phone_number: '9443176542',
        email: 'meenakshi.dist@gmail.com',
        address: 'Goods Shed Road, Virudhunagar - 626001',
        gstin: '33AABCM5678F1ZQ',
        credit_limit: 150000,
        current_balance: 138000,
        overdue_days: 38,
        avg_ticket_size: 32000,
        transaction_frequency: 6,
        risk_status: 'FLAGGED',
        risk_score: 0.88
      },
      {
        full_name: 'Sri Ganesh Agencies',
        phone_number: '9884022314',
        email: 'sriganash.parrys@gmail.com',
        address: 'Govindappa Naicken St, Parrys, Chennai - 600001',
        gstin: '33AAECS7890H1Z1',
        credit_limit: 100000,
        current_balance: 88500,
        overdue_days: 48,
        avg_ticket_size: 24000,
        transaction_frequency: 5,
        risk_status: 'FLAGGED',
        risk_score: 0.92
      },
      {
        full_name: 'Kavitha Crackers & Fancy Mart',
        phone_number: '9789012345',
        email: 'kavitha.cbe@yahoo.com',
        address: 'Cross Cut Road, Gandhipuram, Coimbatore - 641012',
        gstin: '33AAEFK4321J1Z8',
        credit_limit: 200000,
        current_balance: 24500,
        overdue_days: 5,
        avg_ticket_size: 35000,
        transaction_frequency: 12,
        risk_status: 'SAFE',
        risk_score: 0.18
      },
      {
        full_name: 'Murugan Stores',
        phone_number: '9442087654',
        email: 'murugan.salem@rediffmail.com',
        address: 'Fort Main Road, Salem - 636001',
        gstin: '33AABCM9012K1Z4',
        credit_limit: 120000,
        current_balance: 104000,
        overdue_days: 42,
        avg_ticket_size: 26000,
        transaction_frequency: 4,
        risk_status: 'FLAGGED',
        risk_score: 0.85
      },
      {
        full_name: 'Lakshmi Fireworks Retail',
        phone_number: '9843256789',
        email: 'lakshmi.tirunelveli@gmail.com',
        address: 'High Ground Road, Palayamkottai, Tirunelveli - 627002',
        gstin: '33AADCL3456L1Z9',
        credit_limit: 150000,
        current_balance: 18000,
        overdue_days: 0,
        avg_ticket_size: 22000,
        transaction_frequency: 15,
        risk_status: 'SAFE',
        risk_score: 0.14
      },
      {
        full_name: 'Venkateshwara Agencies',
        phone_number: '9848011223',
        email: 'venkateshwara.vja@gmail.com',
        address: 'One Town Commercial Area, Vijayawada - 520001',
        gstin: '37AABCV7890N1Z2',
        credit_limit: 200000,
        current_balance: 185000,
        overdue_days: 55,
        avg_ticket_size: 45000,
        transaction_frequency: 3,
        risk_status: 'FLAGGED',
        risk_score: 0.95
      },
      {
        full_name: 'Karnataka Diwali Wholesale Hub',
        phone_number: '9845099887',
        email: 'bangalore.crackers@hub.in',
        address: 'Mamulpet, Chickpet, Bangalore - 560053',
        gstin: '29AABCK5432P1Z0',
        credit_limit: 600000,
        current_balance: 62000,
        overdue_days: 4,
        avg_ticket_size: 58000,
        transaction_frequency: 20,
        risk_status: 'SAFE',
        risk_score: 0.16
      },
      {
        full_name: 'Thirumalai Fireworks Depot',
        phone_number: '9443312340',
        email: 'thirumalai.trichy@gmail.com',
        address: 'Big Bazaar Street, Trichy - 620008',
        gstin: '33AABCT9988R1Z5',
        credit_limit: 150000,
        current_balance: 48000,
        overdue_days: 18,
        avg_ticket_size: 28000,
        transaction_frequency: 9,
        risk_status: 'SAFE',
        risk_score: 0.42
      },
      {
        full_name: 'Pandian Traders',
        phone_number: '9842512398',
        email: 'pandian.theni@gmail.com',
        address: 'Subban Street, Theni - 625531',
        gstin: '33AABCP1122S1Z3',
        credit_limit: 100000,
        current_balance: 22000,
        overdue_days: 8,
        avg_ticket_size: 19000,
        transaction_frequency: 11,
        risk_status: 'SAFE',
        risk_score: 0.22
      },
      {
        full_name: 'Sri Krishna Crackers Mart',
        phone_number: '9842765432',
        email: 'krishna.erode@gmail.com',
        address: 'R.K.V. Road, Erode - 638001',
        gstin: '33AABCK3344T1Z1',
        credit_limit: 140000,
        current_balance: 72000,
        overdue_days: 24,
        avg_ticket_size: 25000,
        transaction_frequency: 7,
        risk_status: 'SAFE',
        risk_score: 0.46
      },
      {
        full_name: 'Saravana Fireworks Mart',
        phone_number: '9842109876',
        email: 'saravana.dgl@gmail.com',
        address: 'Main Bazaar, Dindigul - 624001',
        gstin: '33AABCS5566U1ZF',
        credit_limit: 180000,
        current_balance: 15000,
        overdue_days: 0,
        avg_ticket_size: 30000,
        transaction_frequency: 13,
        risk_status: 'SAFE',
        risk_score: 0.11
      },
      {
        full_name: 'Shree Ram Crackers Depot',
        phone_number: '9842345671',
        email: 'ram.tiruppur@gmail.com',
        address: 'Kumaran Road, Tiruppur - 641601',
        gstin: '33AABCS7788V1ZD',
        credit_limit: 220000,
        current_balance: 38000,
        overdue_days: 3,
        avg_ticket_size: 34000,
        transaction_frequency: 16,
        risk_status: 'SAFE',
        risk_score: 0.17
      },
      {
        full_name: 'Raja Rani Fancy Stores',
        phone_number: '9443218765',
        email: 'rajaranifancy@gmail.com',
        address: 'South Main Street, Thanjavur - 613001',
        gstin: '33AABCR9900W1ZB',
        credit_limit: 120000,
        current_balance: 108000,
        overdue_days: 34,
        avg_ticket_size: 21000,
        transaction_frequency: 5,
        risk_status: 'FLAGGED',
        risk_score: 0.86
      },
      {
        full_name: 'Velan Fireworks Express',
        phone_number: '9840123456',
        email: 'velan.kanchi@gmail.com',
        address: 'Gandhi Road, Kanchipuram - 631501',
        gstin: '33AABCV2233X1Z9',
        credit_limit: 250000,
        current_balance: 28000,
        overdue_days: 0,
        avg_ticket_size: 36000,
        transaction_frequency: 17,
        risk_status: 'SAFE',
        risk_score: 0.13
      }
    ];

    const customerDocs = [];
    for (const cData of customerSeedData) {
      let cust = await Customer.findOne({ phone_number: cData.phone_number });
      if (!cust) {
        cust = await Customer.create(cData);
      } else {
        Object.assign(cust, cData);
        await cust.save();
      }
      customerDocs.push(cust);

      // Create Audit Log for FLAGGED Customers
      if (cust.risk_status === 'FLAGGED') {
        const existingAudit = await RiskAuditLog.findOne({ customer_id: cust._id });
        if (!existingAudit) {
          await RiskAuditLog.create({
            log_id: `LOG-RISK-${cust.phone_number}`,
            customer_id: cust._id,
            customer_name: cust.full_name,
            anomaly_score: cust.risk_score,
            risk_score: cust.risk_score,
            risk_level: 'HIGH_RISK',
            is_anomaly: true,
            decision_action: 'RESTRICT_OPEN_CREDIT_AND_FLAG_AUDIT',
            status: 'FLAGGED',
            timestamp: new Date()
          });
        }
      }
    }
    console.log(`✓ Synchronized ${customerDocs.length} Sivakasi Trade Customers.`);

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

    // 5. Products (all 186 from Pricelist 2026)
    const existingCount = await Product.countDocuments();
    const productDocs = [];
    if (existingCount < 50 || force) {
      console.log('⚡ Populating Sivakasi Crackers Catalog (186 Products from Pricelist 2026)...');
      for (const prod of SREEVEE_PRODUCTS) {
        const sku = `CRK-${String(prod.sno).padStart(3, '0')}`;
        const catId = categoryMap[prod.category] || Object.values(categoryMap)[0];
        const costPrice = Number((prod.rate * 0.65).toFixed(2));

        // Intentionally assign stock distributions to test ML velocity and discount engines:
        // - Items with low stock (<= 25): trigger Low Stock & Reorder Now alerts
        // - Items with excess stock (> 250): trigger Dynamic Discount & Markdown recommendations
        // - Balanced items (60 - 150): optimal velocity
        let stockQty = 85;
        if ([1, 11, 25, 35, 71, 80].includes(prod.sno)) {
          stockQty = 14; // Critical Low
        } else if ([5, 12, 26, 40, 72, 95].includes(prod.sno)) {
          stockQty = 22; // Reorder Now
        } else if ([13, 14, 15, 60, 100, 145].includes(prod.sno)) {
          stockQty = 340; // Excess Inventory (PED Clearance)
        } else if ([28, 50, 110, 160].includes(prod.sno)) {
          stockQty = 420; // Deadstock Liquidation
        } else if (prod.sno === 186) {
          stockQty = 180;
        } else {
          stockQty = 50 + ((prod.sno * 7) % 120);
        }

        const pDoc = await Product.findOneAndUpdate(
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
        productDocs.push(pDoc);
      }
      console.log(`✓ 186 Crackers Products seeded successfully with rates and case specifications.`);
    } else {
      const allP = await Product.find();
      productDocs.push(...allP);
    }

    // 6. Ensure PDF 1 Landmark Invoice #1384 Exists
    let inv1384 = await Invoice.findOne({ invoice_no: '1384' });
    const customerMah = customerDocs.find(c => c.phone_number === '7719975175') || customerDocs[0];

    if (!inv1384) {
      const bijiliProduct = await Product.findOne({ sku_barcode: 'CRK-186' }) || productDocs[0];
      const prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
      const timestamp = new Date(Date.now() - 58 * 24 * 60 * 60 * 1000);
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
        customer_name: customerMah.full_name,
        customer_phone: customerMah.phone_number,
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
    }

    // 7. Seed 60-Day Historical Invoice Stream for Machine Learning Models (Bi-LSTM, Apriori, Velocity)
    const currentInvoiceCount = await Invoice.countDocuments();
    if (currentInvoiceCount < 60) {
      console.log('⚡ Generating 60-Day Rolling Historical Invoices & Cross-Sell Baskets for AI Training...');

      // Find key products for realistic combos
      const getProd = (sku) => productDocs.find(p => p.sku_barcode === sku) || productDocs[0];
      const pLakshmi = getProd('CRK-001');
      const pBijili = getProd('CRK-011');
      const pChorsa = getProd('CRK-013');
      const pChakkarBig = getProd('CRK-025');
      const pChakkarDeluxe = getProd('CRK-026');
      const pFlowerPotBig = getProd('CRK-035');
      const pFlowerPotSpl = getProd('CRK-036');
      const pAtomBomb = getProd('CRK-045');
      const pRocket2Sound = getProd('CRK-060');
      const pSparkler10cm = getProd('CRK-071');
      const pSparkler12cm = getProd('CRK-072');
      const pAerial12Shot = getProd('CRK-080');
      const pAerial2Inch = getProd('CRK-095');
      const pTwinklingStars = getProd('CRK-145');
      const pGiftBox = getProd('CRK-180') || productDocs[productDocs.length - 1];

      // Define recurring synergistic market baskets for Apriori association mining
      const marketBasketTemplates = [
        // Basket A: Ground Fireworks Combo (Sparklers + Chakkars + Flowerpots)
        [
          { prod: pSparkler10cm, qty: 50 },
          { prod: pChakkarBig, qty: 30 },
          { prod: pFlowerPotBig, qty: 25 }
        ],
        // Basket B: Sound & Bijili Blast Combo (Lakshmi + Bijili + Chorsa)
        [
          { prod: pLakshmi, qty: 100 },
          { prod: pBijili, qty: 60 },
          { prod: pChorsa, qty: 40 }
        ],
        // Basket C: Festival Night Sky Combo (12 Shot + 2" Aerial + Rockets)
        [
          { prod: pAerial12Shot, qty: 15 },
          { prod: pAerial2Inch, qty: 20 },
          { prod: pRocket2Sound, qty: 25 },
          { prod: pAtomBomb, qty: 30 }
        ],
        // Basket D: Family Celebration Pack (Chakkar Deluxe + Flowerpot Spl + Sparkler 12cm)
        [
          { prod: pChakkarDeluxe, qty: 40 },
          { prod: pFlowerPotSpl, qty: 30 },
          { prod: pSparkler12cm, qty: 45 },
          { prod: pTwinklingStars, qty: 35 }
        ],
        // Basket E: Bulk Gifting & Sparkler Combo
        [
          { prod: pGiftBox, qty: 12 },
          { prod: pSparkler10cm, qty: 60 },
          { prod: pLakshmi, qty: 80 }
        ]
      ];

      let lastHash = inv1384.crypto_hash;
      const paymentMethods = ['UPI', 'CASH', 'CREDIT', 'CARD'];
      const transports = ['VRL Logistics', 'Southern Roadways', 'SRS Travels Logistics', 'TCI Freight', 'ABT Parcel Service'];

      let invoiceIndex = 1387;
      const nowMs = Date.now();

      // Distribute 85 invoices across the last 56 days
      for (let dayOffset = 56; dayOffset >= 0; dayOffset--) {
        // 1 to 2 invoices per day, weekends have 2 to 3
        const dateObj = new Date(nowMs - dayOffset * 24 * 60 * 60 * 1000);
        const dayOfWeek = dateObj.getDay();
        const invoicesToday = (dayOfWeek === 0 || dayOfWeek === 6) ? (dayOffset % 2 === 0 ? 3 : 2) : (dayOffset % 3 === 0 ? 2 : 1);

        for (let invCount = 0; invCount < invoicesToday; invCount++) {
          const invNo = String(invoiceIndex++);
          const customer = customerDocs[(dayOffset + invCount) % customerDocs.length];
          const basketTemplate = marketBasketTemplates[(dayOffset + invCount) % marketBasketTemplates.length];
          const transport = transports[(dayOffset + invCount) % transports.length];
          const paymentMethod = customer.risk_status === 'FLAGGED' ? (invCount % 2 === 0 ? 'CASH' : 'UPI') : paymentMethods[(dayOffset + invCount) % paymentMethods.length];

          const invoiceTimestamp = new Date(dateObj.getTime() + (10 + invCount * 3) * 3600000 + (invCount * 17) * 60000);

          let subtotal = 0;
          let itemsPayload = [];

          for (const itemCfg of basketTemplate) {
            const p = itemCfg.prod;
            if (!p) continue;
            const variance = 1 + ((dayOffset % 5) - 2) * 0.15;
            const qty = Math.max(5, Math.round(itemCfg.qty * variance));
            const unitRate = p.unit_price || 50;
            const costPrice = p.cost_price || (unitRate * 0.65);
            const lineTaxable = Number((qty * unitRate).toFixed(2));
            const gst18 = Number((lineTaxable * 0.18).toFixed(2));
            const cgst = Number((gst18 / 2).toFixed(2));
            const sgst = Number((gst18 / 2).toFixed(2));
            const lineTotal = Number((lineTaxable + gst18).toFixed(2));

            subtotal += lineTaxable;
            itemsPayload.push({
              product_id: p._id,
              sku_barcode: p.sku_barcode,
              product_name: p.product_name,
              quantity: qty,
              unit_price: unitRate,
              cost_price: costPrice,
              case_content: p.case_content || 36,
              brand: p.brand || 'Karpagam',
              no_of_cases: Math.max(1, Math.round(qty / (p.case_content || 36))),
              taxable_amount: lineTaxable,
              gst_rate: 18,
              cgst,
              sgst,
              igst: 0,
              line_total: lineTotal
            });
          }

          subtotal = Number(subtotal.toFixed(2));
          const totalTax = Number((subtotal * 0.18).toFixed(2));
          const cgstTotal = Number((totalTax / 2).toFixed(2));
          const sgstTotal = Number((totalTax / 2).toFixed(2));
          const discountPct = (dayOffset % 4 === 0) ? 5 : 0;
          const discountAmount = Number(((subtotal * discountPct) / 100).toFixed(2));
          const otherCharges = 800 + ((dayOffset % 7) * 200);
          const packagingCharges = 250 + ((dayOffset % 4) * 100);
          const netTotal = Number((subtotal - discountAmount + totalTax + otherCharges + packagingCharges).toFixed(2));
          const isPending = paymentMethod === 'CREDIT' && (customer.overdue_days > 0 || invCount % 2 === 1);
          const receivedAmount = isPending ? 0 : netTotal;
          const balanceAmount = isPending ? netTotal : 0;

          const cryptoHash = generateInvoiceBlockHash({
            invoiceNo: invNo,
            netTotal,
            timestamp: invoiceTimestamp,
            prevHash: lastHash,
            branchId: 'SIVAKASI-DEPOT-01'
          });

          const invDoc = await Invoice.create({
            invoice_no: invNo,
            customer_id: customer._id,
            customer_name: customer.full_name,
            customer_phone: customer.phone_number,
            cashier_id: cashier._id,
            cashier_name: 'Velavan Billing Operator',
            branch_id: 'SIVAKASI-DEPOT-01',
            terminal_geo_token: { lat: 9.4533, lng: 77.7946, accuracy: 5.0, verified: true },
            subtotal,
            total_tax: totalTax,
            cgst_total: cgstTotal,
            sgst_total: sgstTotal,
            igst_total: 0.00,
            discount_amount: discountAmount,
            other_charges: otherCharges,
            packaging_charges: packagingCharges,
            total_cases: itemsPayload.reduce((a, b) => a + b.no_of_cases, 0),
            net_total: netTotal,
            received_amount: receivedAmount,
            balance_amount: balanceAmount,
            amount_in_words: numberToIndianWords(netTotal),
            transport_name: transport,
            vehicle_number: `TN ${(58 + (dayOffset % 15))} AB ${(1000 + invoiceIndex)}`,
            terms_conditions: 'Goods once sold will not be taken back. Sivakasi jurisdiction only. Thank you for doing business with us.',
            company_name: 'VELAVAN CRACKERS',
            crypto_hash: cryptoHash,
            prev_hash: lastHash,
            payment_method: paymentMethod,
            payment_status: isPending ? 'CREDIT_PENDING' : 'PAID',
            invoice_timestamp: invoiceTimestamp
          });

          // Save line items
          for (const item of itemsPayload) {
            await InvoiceItem.create({
              invoice_id: invDoc._id,
              ...item
            });
          }

          // Double-Entry General Ledger Posting
          await LedgerEntry.create([
            {
              entry_id: `LED-${invNo}-01`,
              account_name: paymentMethod === 'CREDIT' ? 'Accounts Receivable' : 'Cash and Bank Balances',
              debit: netTotal,
              credit: 0,
              running_balance: 500000 + invoiceIndex * 1500,
              transaction_type: 'INVOICE',
              reference_no: invNo,
              reference_id: invDoc._id,
              customer_id: customer._id,
              customer_name: customer.full_name,
              description: `Invoice ${invNo} sale to ${customer.full_name}`,
              created_by: 'Velavan Billing Operator',
              date: invoiceTimestamp
            },
            {
              entry_id: `LED-${invNo}-02`,
              account_name: 'Sales Revenue',
              debit: 0,
              credit: subtotal,
              running_balance: 500000 + invoiceIndex * 1500,
              transaction_type: 'INVOICE',
              reference_no: invNo,
              reference_id: invDoc._id,
              customer_id: customer._id,
              customer_name: customer.full_name,
              description: `Sales revenue for invoice ${invNo}`,
              created_by: 'Velavan Billing Operator',
              date: invoiceTimestamp
            }
          ]);

          lastHash = cryptoHash;
        }
      }
      console.log(`✓ Seeded 60-day historical invoice stream (Invoice #${invoiceIndex - 1}) with chained crypto ledger entries.`);
    }

    console.log('✅ SREEVEESATHYA AGENCIES & VELAVAN CRACKERS seeding finished successfully!');
    return { success: true, productsCount: SREEVEE_PRODUCTS.length };
  } catch (err) {
    console.error('❌ Sivakasi seed error:', err);
    throw err;
  }
}

module.exports = { seedSivakasiData };
