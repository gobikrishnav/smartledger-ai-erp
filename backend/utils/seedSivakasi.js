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
    console.log('⚡ SmartLedger AI — Initializing Enterprise-Grade Sivakasi Dataset...');

    // ─── 1. Business Info ───────────────────────────────────────
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
    } else {
      Object.assign(biz, {
        business_name: 'VELAVAN CRACKERS',
        legal_name: 'SREEVEESATHYA AGENCIES & VELAVAN CRACKERS',
        gstin: '33GCMPS3008E1ZO',
        address: sivakasiAddress,
        state_name: 'Tamil Nadu',
        state_code: '33',
        is_onboarded: true
      });
      await biz.save();
    }

    // ─── 2. Staff Users ───────────────────────────────────────────
    const upsertUser = async (data) => {
      let u = await StaffUser.findOne({ email: data.email });
      if (!u) u = await StaffUser.create(data);
      return u;
    };
    const cashier = await upsertUser({ username: 'cashier1', full_name: 'Velavan Billing Operator', email: 'cashier@smartledger.ai', password_hash: 'Cashier@123', role: 'CASHIER', branch_id: 'SIVAKASI-DEPOT-01' });
    await upsertUser({ username: 'owner1', full_name: 'Sreeveesathya Director', email: 'owner@smartledger.ai', password_hash: 'Owner@123', role: 'BUSINESS_OWNER', branch_id: 'SIVAKASI-HQ' });
    await upsertUser({ username: 'warehouse1', full_name: 'Enjar Depot Manager', email: 'warehouse@smartledger.ai', password_hash: 'Warehouse@123', role: 'WAREHOUSE_MGR', branch_id: 'WH-ENJAR-01' });
    await upsertUser({ username: 'admin1', full_name: 'System Administrator', email: 'admin@smartledger.ai', password_hash: 'Admin@123', role: 'BUSINESS_OWNER', branch_id: 'SIVAKASI-HQ' });

    // ─── 3. Comprehensive B2B Customer Database (40 customers) ─────
    const allCustomers = [
      // ── SAFE / PLATINUM customers ──
      { full_name: 'Mah gondia sitaram chauraswya', phone_number: '7719975175', email: 'mah.gondia@crackerstrade.in', address: 'Wholesale Market, Gondia, Maharashtra - 441601', gstin: '27AABCU9603R1ZM', credit_limit: 500000, current_balance: 29205, overdue_days: 0, avg_ticket_size: 45000, transaction_frequency: 22, risk_status: 'SAFE', risk_score: 0.10 },
      { full_name: 'Balaji Fireworks Wholesalers', phone_number: '9842188231', email: 'balaji.crackers@gmail.com', address: 'Bazaar Main Road, Madurai - 625001', gstin: '33AABCB1234D1ZP', credit_limit: 800000, current_balance: 45000, overdue_days: 0, avg_ticket_size: 62000, transaction_frequency: 28, risk_status: 'SAFE', risk_score: 0.12 },
      { full_name: 'Karnataka Diwali Wholesale Hub', phone_number: '9845099887', email: 'bangalore.crackers@hub.in', address: 'Mamulpet, Chickpet, Bangalore - 560053', gstin: '29AABCK5432P1Z0', credit_limit: 900000, current_balance: 62000, overdue_days: 2, avg_ticket_size: 75000, transaction_frequency: 32, risk_status: 'SAFE', risk_score: 0.13 },
      { full_name: 'Lakshmi Fireworks Retail', phone_number: '9843256789', email: 'lakshmi.tirunelveli@gmail.com', address: 'High Ground Road, Palayamkottai, Tirunelveli - 627002', gstin: '33AADCL3456L1Z9', credit_limit: 300000, current_balance: 18000, overdue_days: 0, avg_ticket_size: 32000, transaction_frequency: 20, risk_status: 'SAFE', risk_score: 0.11 },
      { full_name: 'Kavitha Crackers & Fancy Mart', phone_number: '9789012345', email: 'kavitha.cbe@yahoo.com', address: 'Cross Cut Road, Gandhipuram, Coimbatore - 641012', gstin: '33AAEFK4321J1Z8', credit_limit: 400000, current_balance: 24500, overdue_days: 3, avg_ticket_size: 48000, transaction_frequency: 24, risk_status: 'SAFE', risk_score: 0.15 },
      { full_name: 'Saravana Fireworks Mart', phone_number: '9842109876', email: 'saravana.dgl@gmail.com', address: 'Main Bazaar, Dindigul - 624001', gstin: '33AABCS5566U1ZF', credit_limit: 350000, current_balance: 15000, overdue_days: 0, avg_ticket_size: 38000, transaction_frequency: 18, risk_status: 'SAFE', risk_score: 0.10 },
      { full_name: 'Shree Ram Crackers Depot', phone_number: '9842345671', email: 'ram.tiruppur@gmail.com', address: 'Kumaran Road, Tiruppur - 641601', gstin: '33AABCS7788V1ZD', credit_limit: 450000, current_balance: 38000, overdue_days: 1, avg_ticket_size: 42000, transaction_frequency: 22, risk_status: 'SAFE', risk_score: 0.14 },
      { full_name: 'Velan Fireworks Express', phone_number: '9840123456', email: 'velan.kanchi@gmail.com', address: 'Gandhi Road, Kanchipuram - 631501', gstin: '33AABCV2233X1Z9', credit_limit: 500000, current_balance: 28000, overdue_days: 0, avg_ticket_size: 55000, transaction_frequency: 26, risk_status: 'SAFE', risk_score: 0.12 },
      { full_name: 'Pandian Traders', phone_number: '9842512398', email: 'pandian.theni@gmail.com', address: 'Subban Street, Theni - 625531', gstin: '33AABCP1122S1Z3', credit_limit: 250000, current_balance: 22000, overdue_days: 5, avg_ticket_size: 32000, transaction_frequency: 16, risk_status: 'SAFE', risk_score: 0.19 },
      { full_name: 'Subramanian Festival Stores', phone_number: '9842876543', email: 'sub.festival@gmail.com', address: 'Market Street, Vellore - 632001', gstin: '33AAACS8899Y1Z7', credit_limit: 300000, current_balance: 35000, overdue_days: 4, avg_ticket_size: 40000, transaction_frequency: 19, risk_status: 'SAFE', risk_score: 0.18 },
      { full_name: 'Annamalai Crackers & Co', phone_number: '9843765001', email: 'annamalai.cuddalore@gmail.com', address: 'Cuddalore Port Road, Cuddalore - 607001', gstin: '33AAACA9800Z1Z6', credit_limit: 280000, current_balance: 19000, overdue_days: 0, avg_ticket_size: 29000, transaction_frequency: 14, risk_status: 'SAFE', risk_score: 0.13 },
      { full_name: 'Periyar Fireworks Emporium', phone_number: '9943765432', email: 'periyar.crackers@gmail.com', address: 'Sankagiri Main Road, Salem - 636302', gstin: '33AABCP3344A1ZE', credit_limit: 350000, current_balance: 27000, overdue_days: 3, avg_ticket_size: 36000, transaction_frequency: 17, risk_status: 'SAFE', risk_score: 0.16 },
      { full_name: 'Nithya Fancy Fireworks', phone_number: '9845178012', email: 'nithya.fancy@gmail.com', address: 'Kovilpatti Main Road, Thoothukudi - 628501', gstin: '33AABCN5511B1ZC', credit_limit: 200000, current_balance: 12000, overdue_days: 0, avg_ticket_size: 24000, transaction_frequency: 13, risk_status: 'SAFE', risk_score: 0.11 },
      { full_name: 'Senthil Wholesale Crackers', phone_number: '9843189076', email: 'senthil.wholesale@gmail.com', address: 'East Car Street, Tirunelveli - 627001', gstin: '33AABCS2200C1ZA', credit_limit: 400000, current_balance: 31000, overdue_days: 2, avg_ticket_size: 44000, transaction_frequency: 21, risk_status: 'SAFE', risk_score: 0.14 },
      { full_name: 'Vijayalakshmi Fireworks', phone_number: '9843122890', email: 'vijaya.crackers@gmail.com', address: 'Gandhi Nagar, Kanyakumari - 629002', gstin: '33AABCV4400D1Z8', credit_limit: 180000, current_balance: 16000, overdue_days: 1, avg_ticket_size: 26000, transaction_frequency: 15, risk_status: 'SAFE', risk_score: 0.12 },
      { full_name: 'Thirumalai Fireworks Depot', phone_number: '9443312340', email: 'thirumalai.trichy@gmail.com', address: 'Big Bazaar Street, Trichy - 620008', gstin: '33AABCT9988R1Z5', credit_limit: 320000, current_balance: 48000, overdue_days: 16, avg_ticket_size: 36000, transaction_frequency: 12, risk_status: 'SAFE', risk_score: 0.42 },
      { full_name: 'Sri Krishna Crackers Mart', phone_number: '9842765432', email: 'krishna.erode@gmail.com', address: 'R.K.V. Road, Erode - 638001', gstin: '33AABCK3344T1Z1', credit_limit: 280000, current_balance: 72000, overdue_days: 22, avg_ticket_size: 34000, transaction_frequency: 10, risk_status: 'SAFE', risk_score: 0.44 },

      // ── MEDIUM RISK customers ──
      { full_name: 'Murugan Stores', phone_number: '9442087654', email: 'murugan.salem@rediffmail.com', address: 'Fort Main Road, Salem - 636001', gstin: '33AABCM9012K1Z4', credit_limit: 200000, current_balance: 158000, overdue_days: 38, avg_ticket_size: 32000, transaction_frequency: 6, risk_status: 'FLAGGED', risk_score: 0.84 },
      { full_name: 'Raja Rani Fancy Stores', phone_number: '9443218765', email: 'rajaranifancy@gmail.com', address: 'South Main Street, Thanjavur - 613001', gstin: '33AABCR9900W1ZB', credit_limit: 150000, current_balance: 118000, overdue_days: 32, avg_ticket_size: 24000, transaction_frequency: 5, risk_status: 'FLAGGED', risk_score: 0.82 },
      { full_name: 'Sundaram Fireworks Mart', phone_number: '9443876543', email: 'sundaram.crackers@gmail.com', address: 'Bazaar Street, Kumbakonam - 612001', gstin: '33AABCS1112E1Z9', credit_limit: 180000, current_balance: 142000, overdue_days: 28, avg_ticket_size: 28000, transaction_frequency: 6, risk_status: 'FLAGGED', risk_score: 0.76 },
      { full_name: 'Karpagam Wholesale Traders', phone_number: '9843112207', email: 'karpagam.trades@gmail.com', address: 'Arcot Road, Vellore - 632002', gstin: '33AABCK6611F1Z7', credit_limit: 250000, current_balance: 188000, overdue_days: 35, avg_ticket_size: 36000, transaction_frequency: 5, risk_status: 'FLAGGED', risk_score: 0.79 },
      { full_name: 'Anand Crackers Express', phone_number: '9843200341', email: 'anand.express@gmail.com', address: 'Nehru Street, Namakkal - 637001', gstin: '33AABCA7722G1Z5', credit_limit: 160000, current_balance: 128000, overdue_days: 25, avg_ticket_size: 27000, transaction_frequency: 7, risk_status: 'FLAGGED', risk_score: 0.72 },

      // ── HIGH RISK / OVERDUE customers ──
      { full_name: 'Meenakshi Trade Distributors', phone_number: '9443176542', email: 'meenakshi.dist@gmail.com', address: 'Goods Shed Road, Virudhunagar - 626001', gstin: '33AABCM5678F1ZQ', credit_limit: 200000, current_balance: 168000, overdue_days: 42, avg_ticket_size: 38000, transaction_frequency: 4, risk_status: 'FLAGGED', risk_score: 0.91 },
      { full_name: 'Sri Ganesh Agencies', phone_number: '9884022314', email: 'sriganesh.parrys@gmail.com', address: 'Govindappa Naicken St, Parrys, Chennai - 600001', gstin: '33AAECS7890H1Z1', credit_limit: 150000, current_balance: 128500, overdue_days: 52, avg_ticket_size: 30000, transaction_frequency: 3, risk_status: 'FLAGGED', risk_score: 0.94 },
      { full_name: 'Venkateshwara Agencies', phone_number: '9848011223', email: 'venkateshwara.vja@gmail.com', address: 'One Town Commercial Area, Vijayawada - 520001', gstin: '37AABCV7890N1Z2', credit_limit: 300000, current_balance: 268000, overdue_days: 58, avg_ticket_size: 55000, transaction_frequency: 3, risk_status: 'FLAGGED', risk_score: 0.96 },
      { full_name: 'Rajan Import & Export Crackers', phone_number: '9843456701', email: 'rajan.impex@gmail.com', address: 'Pedda Waltair, Visakhapatnam - 530017', gstin: '37AABCR1234H1Z8', credit_limit: 400000, current_balance: 352000, overdue_days: 64, avg_ticket_size: 65000, transaction_frequency: 2, risk_status: 'FLAGGED', risk_score: 0.97 },

      // ── NEW GROWTH customers (occasional orders) ──
      { full_name: 'Arjun General Store', phone_number: '9962011234', email: 'arjun.general@gmail.com', address: 'GH Road, Hosur - 635109', gstin: '29AAACA1122I1Z3', credit_limit: 100000, current_balance: 8500, overdue_days: 0, avg_ticket_size: 12000, transaction_frequency: 8, risk_status: 'SAFE', risk_score: 0.15 },
      { full_name: 'Muthuvel Festival Bazaar', phone_number: '9940023178', email: 'muthuvel.bazaar@gmail.com', address: 'Station Road, Pollachi - 642001', gstin: '33AAACM3311J1Z1', credit_limit: 120000, current_balance: 11000, overdue_days: 0, avg_ticket_size: 15000, transaction_frequency: 9, risk_status: 'SAFE', risk_score: 0.14 },
      { full_name: 'Selvi Fancy Fireworks Corner', phone_number: '9942178009', email: 'selvi.fancy@gmail.com', address: 'Temple Street, Palani - 624601', gstin: '33AAACS4433K1ZF', credit_limit: 80000, current_balance: 7000, overdue_days: 0, avg_ticket_size: 11000, transaction_frequency: 7, risk_status: 'SAFE', risk_score: 0.13 },
      { full_name: 'Muthukrishnan & Sons', phone_number: '9843654321', email: 'muthukrishnan.sons@gmail.com', address: 'North Street, Rameswaram - 623526', gstin: '33AAAEM2211L1ZD', credit_limit: 150000, current_balance: 13000, overdue_days: 0, avg_ticket_size: 18000, transaction_frequency: 10, risk_status: 'SAFE', risk_score: 0.16 },
      { full_name: 'Subha Mega Crackers', phone_number: '9943120008', email: 'subha.mega@gmail.com', address: 'Bharathiar Road, Tirupur - 641602', gstin: '33AAACS5544M1ZB', credit_limit: 200000, current_balance: 21000, overdue_days: 2, avg_ticket_size: 26000, transaction_frequency: 12, risk_status: 'SAFE', risk_score: 0.17 },
      { full_name: 'Chennai Crackers Palace', phone_number: '9840198765', email: 'chennai.palace@gmail.com', address: 'Wadi Street, Park Town, Chennai - 600003', gstin: '33AAACP6655N1Z9', credit_limit: 500000, current_balance: 44000, overdue_days: 3, avg_ticket_size: 58000, transaction_frequency: 25, risk_status: 'SAFE', risk_score: 0.14 },
      { full_name: 'Maharaja Festival Supplies', phone_number: '9840237890', email: 'maharaja.festival@gmail.com', address: 'Car Street, Madurai - 625002', gstin: '33AAACM7766O1Z7', credit_limit: 350000, current_balance: 32000, overdue_days: 1, avg_ticket_size: 44000, transaction_frequency: 20, risk_status: 'SAFE', risk_score: 0.13 },
      { full_name: 'Bharati Crackers Trading', phone_number: '9843890120', email: 'bharati.trading@gmail.com', address: 'Lawley Road, Coimbatore - 641011', gstin: '33AAACB8877P1Z5', credit_limit: 280000, current_balance: 25000, overdue_days: 0, avg_ticket_size: 38000, transaction_frequency: 18, risk_status: 'SAFE', risk_score: 0.12 },
      { full_name: 'Mani Retail & Wholesale', phone_number: '9943250678', email: 'mani.retail@gmail.com', address: 'Main Bazaar, Kumbakonam - 612002', gstin: '33AAACM9988Q1Z3', credit_limit: 220000, current_balance: 19500, overdue_days: 0, avg_ticket_size: 30000, transaction_frequency: 15, risk_status: 'SAFE', risk_score: 0.13 },
      { full_name: 'Gopi Crackers & Fancy', phone_number: '9843012789', email: 'gopi.fancy@gmail.com', address: 'Vaithianathapuram, Cuddalore - 607002', gstin: '33AAACG1099R1Z1', credit_limit: 160000, current_balance: 14000, overdue_days: 0, avg_ticket_size: 22000, transaction_frequency: 11, risk_status: 'SAFE', risk_score: 0.11 },
      { full_name: 'Amutha Fancy & Crackers', phone_number: '9840765890', email: 'amutha.fancy@gmail.com', address: 'Trichy Road, Karur - 639002', gstin: '33AAACA2100S1ZF', credit_limit: 180000, current_balance: 16500, overdue_days: 4, avg_ticket_size: 25000, transaction_frequency: 14, risk_status: 'SAFE', risk_score: 0.19 },
      { full_name: 'Durai Fireworks Emporium', phone_number: '9943345678', email: 'durai.fireworks@gmail.com', address: 'Collectorate Road, Pudukkottai - 622001', gstin: '33AAACD3211T1ZD', credit_limit: 140000, current_balance: 11000, overdue_days: 0, avg_ticket_size: 20000, transaction_frequency: 12, risk_status: 'SAFE', risk_score: 0.13 },
      { full_name: 'Kodiswaran Wholesale Hub', phone_number: '9843567891', email: 'kodi.wholesale@gmail.com', address: 'Sivaganga Main Road, Sivaganga - 630561', gstin: '33AAACK4322U1ZB', credit_limit: 300000, current_balance: 29000, overdue_days: 6, avg_ticket_size: 42000, transaction_frequency: 17, risk_status: 'SAFE', risk_score: 0.22 }
    ];

    const customerDocs = [];
    for (const cData of allCustomers) {
      let cust = await Customer.findOne({ phone_number: cData.phone_number });
      if (!cust) {
        cust = await Customer.create(cData);
      } else {
        Object.assign(cust, cData);
        await cust.save();
      }
      customerDocs.push(cust);

      if (cust.risk_status === 'FLAGGED') {
        const exists = await RiskAuditLog.findOne({ customer_id: cust._id });
        if (!exists) {
          await RiskAuditLog.create({
            log_id: `LOG-RISK-${cust.phone_number}-${Date.now()}`,
            customer_id: cust._id,
            customer_name: cust.full_name,
            anomaly_score: cust.risk_score,
            risk_score: cust.risk_score,
            risk_level: cust.risk_score >= 0.8 ? 'HIGH_RISK' : 'MEDIUM_RISK',
            is_anomaly: true,
            decision_action: cust.risk_score >= 0.8 ? 'RESTRICT_OPEN_CREDIT_REQUIRE_CASH' : 'REQUEST_PARTIAL_PAYMENT',
            status: 'ACTIVE',
            timestamp: new Date()
          });
        }
      }
    }
    console.log(`✓ Synchronized ${customerDocs.length} B2B Trade Customers.`);

    // ─── 4. Categories ─────────────────────────────────────────────
    const categoryMap = {};
    for (const cat of SREEVEE_CATEGORIES) {
      let existingCat = await ProductCategory.findOne({ category_name: cat.name });
      if (!existingCat) {
        existingCat = await ProductCategory.create({ category_name: cat.name, gst_rate: 18.0, hsn_sac_code: '3604', description: cat.description });
      }
      categoryMap[cat.name] = existingCat._id;
    }
    console.log(`✓ Synchronized ${SREEVEE_CATEGORIES.length} Sivakasi Product Categories.`);

    // ─── 5. Products ───────────────────────────────────────────────
    const existingProductCount = await Product.countDocuments();
    const productDocs = [];

    if (existingProductCount < 50 || force) {
      console.log('⚡ Loading 186-SKU Sivakasi Crackers Pricelist 2026...');
      for (const prod of SREEVEE_PRODUCTS) {
        const sku = `CRK-${String(prod.sno).padStart(3, '0')}`;
        const catId = categoryMap[prod.category] || Object.values(categoryMap)[0];
        const costPrice = Number((prod.rate * 0.65).toFixed(2));

        // Varied stock distribution for ML algorithm training
        let stockQty;
        if ([1, 11, 25, 35, 71, 80].includes(prod.sno)) stockQty = 14;       // Critical Low
        else if ([5, 12, 26, 40, 72, 95].includes(prod.sno)) stockQty = 22;  // Reorder Now
        else if ([13, 14, 15, 60, 100, 145].includes(prod.sno)) stockQty = 340; // Excess
        else if ([28, 50, 110, 160].includes(prod.sno)) stockQty = 480;      // Deadstock
        else if (prod.sno === 186) stockQty = 180;
        else stockQty = 80 + ((prod.sno * 11) % 180);

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
      console.log(`✓ 186 Sivakasi Crackers Products seeded.`);
    } else {
      const all = await Product.find();
      productDocs.push(...all);
    }

    // ─── Helper to find product by SKU ──
    const getProd = (sku) => productDocs.find(p => p.sku_barcode === sku) || productDocs[0];

    // ─── 6. Seed PDF-1 Landmark Invoice ────────────────────────────
    const customerMah = customerDocs.find(c => c.phone_number === '7719975175');
    let inv1384 = await Invoice.findOne({ invoice_no: '1384' });
    if (!inv1384) {
      const bijili = getProd('CRK-186');
      const prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
      const ts = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const hash = generateInvoiceBlockHash({ invoiceNo: '1384', netTotal: 29205, timestamp: ts, prevHash, branchId: 'SIVAKASI-DEPOT-01' });
      inv1384 = await Invoice.create({
        invoice_no: '1384', customer_id: customerMah._id, customer_name: customerMah.full_name, customer_phone: customerMah.phone_number,
        cashier_id: cashier._id, cashier_name: 'Velavan Billing Operator', branch_id: 'SIVAKASI-DEPOT-01',
        terminal_geo_token: { lat: 9.4533, lng: 77.7946, accuracy: 5.0, verified: true },
        subtotal: 27000, total_tax: 0, cgst_total: 0, sgst_total: 0, igst_total: 0,
        discount_amount: 0, other_charges: 1800, packaging_charges: 405, total_cases: 5,
        net_total: 29205, received_amount: 0, balance_amount: 29205,
        amount_in_words: 'Twenty Nine Thousand Two Hundred and Five Rupees only',
        transport_name: 'VRL Logistics', vehicle_number: 'TN 67 AB 1234',
        terms_conditions: 'Goods once sold will not be taken back.',
        company_name: 'VELAVAN CRACKERS', crypto_hash: hash, prev_hash: prevHash,
        payment_method: 'CASH', payment_status: 'PAID', invoice_timestamp: ts
      });
      await InvoiceItem.create({ invoice_id: inv1384._id, product_id: bijili._id, sku_barcode: bijili.sku_barcode, product_name: 'Red bijili 100 pcs gold bags', quantity: 180, unit_price: 150, cost_price: 95, case_content: 36, brand: 'Karpagam', no_of_cases: 5, taxable_amount: 27000, gst_rate: 0, cgst: 0, sgst: 0, igst: 0, line_total: 27000 });
    }

    // ─── 7. Generate 350+ Historical Invoices for AI/ML Training ───
    const existingInvoiceCount = await Invoice.countDocuments();
    if (existingInvoiceCount < 150) {
      console.log('⚡ Generating 350 Historical Invoices for AI Training (Apriori, Bi-LSTM, Isolation Forest)...');

      // ── Define 12 market baskets for Apriori association patterns ──
      // Each basket appears repeatedly so co-occurrence statistics are strong (confidence > 0.7, lift > 2.5)
      const marketBaskets = [
        // Basket 1: Ground Cracker Night Pack (Electric Sparklers + Chakkars + Flowerpots)
        { id: 'B1', items: [['CRK-071', 45], ['CRK-025', 30], ['CRK-035', 25], ['CRK-072', 50]] },
        // Basket 2: Sound Blast Pack (Lakshmi + Bijili + Chorsa)
        { id: 'B2', items: [['CRK-001', 100], ['CRK-011', 60], ['CRK-013', 50], ['CRK-006', 40]] },
        // Basket 3: Festival Aerial Night Sky (12-Shot + 2" Aerial + Rockets + Atom Bomb)
        { id: 'B3', items: [['CRK-080', 12], ['CRK-095', 18], ['CRK-060', 22], ['CRK-045', 28]] },
        // Basket 4: Family Celebration Pack (Chakkar + Flowerpot Special + Twinkling Stars)
        { id: 'B4', items: [['CRK-026', 35], ['CRK-036', 28], ['CRK-145', 32], ['CRK-072', 40]] },
        // Basket 5: Bijili & Sound Combo (Bijili Gold + Deluxe + Giant Crackers)
        { id: 'B5', items: [['CRK-186', 72], ['CRK-012', 60], ['CRK-014', 40], ['CRK-015', 30]] },
        // Basket 6: Retail Festival Kit (Sparklers + Wala Garland + Flower Pots)
        { id: 'B6', items: [['CRK-071', 60], ['CRK-020', 25], ['CRK-035', 40], ['CRK-036', 30]] },
        // Basket 7: Premium Fancy Aerial (4" Mega Aerial + Colour Shots + Twinkling)
        { id: 'B7', items: [['CRK-110', 8], ['CRK-080', 15], ['CRK-145', 25], ['CRK-100', 12]] },
        // Basket 8: Wholesale Sound Pack (Multiple sizes Lakshmi + Gold + Kuruvi)
        { id: 'B8', items: [['CRK-001', 200], ['CRK-002', 150], ['CRK-003', 100], ['CRK-005', 200]] },
        // Basket 9: Mini Aerial & Chotta Fancy (Chotta Fancy + 2" Aerial + Mini Outs)
        { id: 'B9', items: [['CRK-095', 25], ['CRK-090', 30], ['CRK-100', 20], ['CRK-071', 35]] },
        // Basket 10: Deluxe Cracker Set (Deluxe 24, 50, 100 + 5" Deluxe + Viking)
        { id: 'B10', items: [['CRK-016', 50], ['CRK-017', 40], ['CRK-018', 30], ['CRK-010', 25]] },
        // Basket 11: Bomb Combo (Atom + Hydro + Sumo + Bullet + Rocket)
        { id: 'B11', items: [['CRK-045', 40], ['CRK-046', 35], ['CRK-047', 30], ['CRK-060', 35]] },
        // Basket 12: Novelties & Gift Pack (Gift Box + Butterflies + Sparklers)
        { id: 'B12', items: [['CRK-180', 10], ['CRK-160', 20], ['CRK-071', 50], ['CRK-145', 30]] }
      ];

      const transports = ['VRL Logistics', 'SRS Travels', 'Southern Roadways', 'TCI Freight', 'ABT Parcel', 'DTDC Express', 'Blue Dart Logistics'];
      const payMethods = ['UPI', 'CASH', 'CARD', 'CREDIT'];

      const lastInv = await Invoice.findOne().sort({ invoice_timestamp: -1 });
      let lastHash = lastInv?.crypto_hash || inv1384.crypto_hash;
      let invoiceNo = 1400;
      const nowMs = Date.now();

      const invoicesToInsert = [];
      const itemsToInsert = [];
      const ledgerToInsert = [];

      // ── Spread 350 invoices across 90 days ──
      for (let dayOffset = 89; dayOffset >= 0; dayOffset--) {
        const dateObj = new Date(nowMs - dayOffset * 24 * 60 * 60 * 1000);
        const dayOfWeek = dateObj.getDay();

        // More invoices near festival seasons and weekends
        let invoicesThisDay = 3;
        if (dayOfWeek === 0 || dayOfWeek === 6) invoicesThisDay = 5;  // Weekends
        if (dayOffset < 10) invoicesThisDay = 6;  // Recent: more recent = more data
        if (dayOffset > 70) invoicesThisDay = 2;  // Older days: sparse

        for (let invIdx = 0; invIdx < invoicesThisDay; invIdx++) {
          const invNoStr = String(invoiceNo++);
          const custIdx = (dayOffset * 7 + invIdx * 3) % customerDocs.length;
          const customer = customerDocs[custIdx];

          // Rotate through basket templates + some variation
          const basketIdx = (dayOffset + invIdx) % marketBaskets.length;
          const basket = marketBaskets[basketIdx];

          // Occasionally mix 2 baskets for more complex cross-sell patterns
          const useBlendedBasket = (dayOffset + invIdx) % 5 === 0;
          const secondBasket = marketBaskets[(basketIdx + 3) % marketBaskets.length];
          const rawItems = useBlendedBasket
            ? [...basket.items.slice(0, 2), ...secondBasket.items.slice(0, 2)]
            : basket.items;

          const invoiceTimestamp = new Date(dateObj.getTime() + (8 + invIdx * 2) * 3600000 + invIdx * 22 * 60000);

          // Seasonal quantity variance (higher near festival season = last 20 days)
          const seasonalBoost = dayOffset < 20 ? 1.4 : (dayOffset < 40 ? 1.15 : 1.0);

          let subtotal = 0;
          const lineItems = [];

          for (const [sku, baseQty] of rawItems) {
            const p = getProd(sku);
            if (!p) continue;
            const qty = Math.max(5, Math.round(baseQty * seasonalBoost * (0.8 + (Math.random() * 0.4))));
            const unitPrice = p.unit_price;
            const costPrice = p.cost_price || (unitPrice * 0.65);
            const taxable = Number((qty * unitPrice).toFixed(2));
            const gst = Number((taxable * 0.18).toFixed(2));
            const cgst = Number((gst / 2).toFixed(2));
            const sgst = Number((gst / 2).toFixed(2));
            subtotal += taxable;
            lineItems.push({ product_id: p._id, sku_barcode: p.sku_barcode, product_name: p.product_name, quantity: qty, unit_price: unitPrice, cost_price: costPrice, case_content: p.case_content || 36, brand: p.brand || 'Karpagam', no_of_cases: Math.max(1, Math.round(qty / (p.case_content || 36))), taxable_amount: taxable, gst_rate: 18, cgst, sgst, igst: 0, line_total: Number((taxable + gst).toFixed(2)) });
          }

          if (!lineItems.length) continue;

          subtotal = Number(subtotal.toFixed(2));
          const totalTax = Number((subtotal * 0.18).toFixed(2));
          const discAmt = (dayOffset % 6 === 0) ? Number((subtotal * 0.05).toFixed(2)) : 0;
          const otherChg = 400 + (dayOffset % 8) * 200;
          const packChg = 150 + (invIdx % 4) * 100;
          const netTotal = Number((subtotal - discAmt + totalTax + otherChg + packChg).toFixed(2));

          // Determine payment — FLAGGED customers pay cash or leave credit pending
          const isFlaggedCustomer = customer.risk_status === 'FLAGGED';
          let paymentMethod = payMethods[(dayOffset + invIdx) % payMethods.length];
          if (isFlaggedCustomer) paymentMethod = invIdx % 2 === 0 ? 'CASH' : 'CREDIT';
          const isPending = paymentMethod === 'CREDIT' && (isFlaggedCustomer || invIdx % 3 === 0);
          const received = isPending ? 0 : netTotal;
          const balance = isPending ? netTotal : 0;

          const cryptoHash = generateInvoiceBlockHash({ invoiceNo: invNoStr, netTotal, timestamp: invoiceTimestamp, prevHash: lastHash, branchId: 'SIVAKASI-DEPOT-01' });
          const invoiceId = new mongoose.Types.ObjectId();

          invoicesToInsert.push({
            _id: invoiceId,
            invoice_no: invNoStr,
            customer_id: customer._id,
            customer_name: customer.full_name,
            customer_phone: customer.phone_number,
            cashier_id: cashier._id,
            cashier_name: 'Velavan Billing Operator',
            branch_id: 'SIVAKASI-DEPOT-01',
            terminal_geo_token: { lat: 9.4533, lng: 77.7946, accuracy: 5.0, verified: true },
            subtotal,
            total_tax: totalTax,
            cgst_total: Number((totalTax / 2).toFixed(2)),
            sgst_total: Number((totalTax / 2).toFixed(2)),
            igst_total: 0,
            discount_amount: discAmt,
            other_charges: otherChg,
            packaging_charges: packChg,
            total_cases: lineItems.reduce((a, b) => a + b.no_of_cases, 0),
            net_total: netTotal,
            received_amount: received,
            balance_amount: balance,
            amount_in_words: numberToIndianWords(netTotal),
            transport_name: transports[(dayOffset + invIdx) % transports.length],
            vehicle_number: `TN ${58 + (dayOffset % 12)} Z ${1000 + invIdx}`,
            terms_conditions: 'Goods once sold will not be taken back. Sivakasi jurisdiction. Thank you.',
            company_name: 'VELAVAN CRACKERS',
            crypto_hash: cryptoHash,
            prev_hash: lastHash,
            payment_method: paymentMethod,
            payment_status: isPending ? 'CREDIT_PENDING' : 'PAID',
            invoice_timestamp: invoiceTimestamp
          });

          for (const li of lineItems) {
            itemsToInsert.push({
              invoice_id: invoiceId,
              ...li
            });
          }

          // Ledger double-entry
          const ledgerAccount = paymentMethod === 'CREDIT' ? 'Accounts Receivable' : 'Cash and Bank Balances';
          ledgerToInsert.push(
            { entry_id: `LED-${invNoStr}-01`, account_name: ledgerAccount, debit: netTotal, credit: 0, running_balance: 500000 + invoiceNo * 1200, transaction_type: 'INVOICE', reference_no: invNoStr, reference_id: invoiceId, customer_id: customer._id, customer_name: customer.full_name, description: `Invoice ${invNoStr} — ${basket.id} basket`, created_by: 'Velavan Billing Operator', date: invoiceTimestamp },
            { entry_id: `LED-${invNoStr}-02`, account_name: 'Sales Revenue', debit: 0, credit: subtotal, running_balance: 500000 + invoiceNo * 1200, transaction_type: 'INVOICE', reference_no: invNoStr, reference_id: invoiceId, customer_id: customer._id, customer_name: customer.full_name, description: `Revenue for invoice ${invNoStr}`, created_by: 'Velavan Billing Operator', date: invoiceTimestamp }
          );

          lastHash = cryptoHash;
        }
      }

      // High-performance batch insert (seconds instead of minutes)
      console.log(`⚡ Inserting batch of ${invoicesToInsert.length} invoices, ${itemsToInsert.length} items, ${ledgerToInsert.length} ledger entries...`);
      if (invoicesToInsert.length > 0) {
        await Invoice.insertMany(invoicesToInsert, { ordered: false });
        await InvoiceItem.insertMany(itemsToInsert, { ordered: false });
        await LedgerEntry.insertMany(ledgerToInsert, { ordered: false });
      }

      const totalInv = await Invoice.countDocuments();
      console.log(`✅ Seeded ${totalInv} total invoices across 90-day rolling history!`);
    } else {
      console.log(`✓ ${existingInvoiceCount} invoices already present — skipping large batch generation.`);
    }

    console.log('✅ SmartLedger AI Database fully initialized: SREEVEESATHYA AGENCIES & VELAVAN CRACKERS');
    return { success: true, productsCount: productDocs.length };
  } catch (err) {
    console.error('❌ Sivakasi seed error:', err.message || err);
    throw err;
  }
}

module.exports = { seedSivakasiData };
