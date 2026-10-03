const Business = require('../models/Business');
const Supplier = require('../models/Supplier');
const LedgerEntry = require('../models/LedgerEntry');
const AIInsight = require('../models/AIInsight');
const AuditLog = require('../models/AuditLog');
const StaffUser = require('../models/StaffUser');

async function seedEnterpriseData() {
  console.log('⚡ Checking & seeding enterprise collections...');

  // 1. Ensure Demo Accounts exist with @smartledger.demo
  const demoUsers = [
    {
      username: 'admin_demo',
      full_name: 'System Administrator',
      email: 'admin@smartledger.demo',
      password_hash: 'Admin@123',
      role: 'ADMIN',
      branch_id: 'BR-CENTRAL-01'
    },
    {
      username: 'owner_demo',
      full_name: 'Vikramaditya Singhania (Owner)',
      email: 'owner@smartledger.demo',
      password_hash: 'Owner@123',
      role: 'BUSINESS_OWNER',
      branch_id: 'BR-CENTRAL-01'
    },
    {
      username: 'warehouse_demo',
      full_name: 'Suresh Menon (Warehouse Lead)',
      email: 'warehouse@smartledger.demo',
      password_hash: 'Warehouse@123',
      role: 'WAREHOUSE_MGR',
      branch_id: 'WH-MAIN-01'
    }
  ];

  for (const u of demoUsers) {
    const existing = await StaffUser.findOne({ email: u.email });
    if (!existing) {
      await StaffUser.create(u);
      console.log(`✓ Created demo user: ${u.email}`);
    }
  }

  // 2. Seed Business Profile
  const businessCount = await Business.countDocuments();
  if (businessCount === 0) {
    await Business.create({
      business_name: 'SmartLedger Industrial Solutions Pvt Ltd',
      legal_name: 'SmartLedger Industrial Solutions Private Limited',
      gstin: '29AAACS1420M1Z8',
      pan_number: 'AAACS1420M',
      state_code: '29',
      state_name: 'Karnataka',
      email: 'finance@smartledger.ai',
      phone: '+91 80 4123 8900',
      address: {
        line1: 'Plot 42, Electronic City Phase 1',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560100',
        country: 'India'
      },
      currency: 'INR',
      currency_symbol: '₹',
      invoice_prefix: 'INV-2026-',
      default_payment_terms: 'Net 30',
      tax_configuration: {
        hsn_default_rate: 18,
        enable_composition_scheme: false,
        round_off_totals: true
      },
      ai_alert_thresholds: {
        low_stock_buffer_days: 7,
        payment_delay_variance_days: 14,
        min_market_basket_lift: 1.2,
        cashflow_runway_warning_months: 2
      }
    });
    console.log('✓ Seeded Business Profile.');
  }

  // 3. Seed Suppliers
  const supplierCount = await Supplier.countDocuments();
  if (supplierCount === 0) {
    await Supplier.insertMany([
      {
        supplier_id: 'SUP-001',
        supplier_name: 'Bharat Electronics Components Corp',
        email: 'sales@bharatelec-components.in',
        phone: '+91 80 2839 4110',
        gstin: '29AABCB1234D1Z2',
        state_code: '29',
        address: 'Peenya Industrial Area 3rd Phase, Bangalore, Karnataka',
        lead_time_days: 7,
        reliability_score: 4.8,
        risk_level: 'LOW',
        payment_terms: 'Net 30',
        total_spend: 1450000,
        status: 'ACTIVE'
      },
      {
        supplier_id: 'SUP-002',
        supplier_name: 'Adani Solar Logistics & Modules',
        email: 'b2b@adanisolar-components.com',
        phone: '+91 79 2656 5555',
        gstin: '24AAACA5555E1Z7',
        state_code: '24',
        address: 'Mundra Port Special Economic Zone, Kutch, Gujarat',
        lead_time_days: 10,
        reliability_score: 4.9,
        risk_level: 'LOW',
        payment_terms: 'Net 45',
        total_spend: 3200000,
        status: 'ACTIVE'
      },
      {
        supplier_id: 'SUP-003',
        supplier_name: 'Larsen & Toubro Switchgear Ltd',
        email: 'switchgear.orders@larsentoubro.com',
        phone: '+91 22 6752 5656',
        gstin: '27AAACL1234F1Z8',
        state_code: '27',
        address: 'L&T House, Ballard Estate, Mumbai, Maharashtra',
        lead_time_days: 5,
        reliability_score: 4.9,
        risk_level: 'LOW',
        payment_terms: 'Net 30',
        total_spend: 980000,
        status: 'ACTIVE'
      },
      {
        supplier_id: 'SUP-004',
        supplier_name: 'Havells Industrial Cable Systems',
        email: 'industrial.cables@havells.com',
        phone: '+91 120 4771000',
        gstin: '06AAACH1234G1Z9',
        state_code: '06',
        address: 'Industrial Plot 904, Sector 59, Faridabad, Haryana',
        lead_time_days: 4,
        reliability_score: 4.6,
        risk_level: 'LOW',
        payment_terms: 'Net 15',
        total_spend: 640000,
        status: 'ACTIVE'
      },
      {
        supplier_id: 'SUP-005',
        supplier_name: 'Exide Industrial Power Storage Ltd',
        email: 'industrial@exidebatteries.com',
        phone: '+91 33 2283 2120',
        gstin: '19AAACE4321H1ZA',
        state_code: '19',
        address: '59E Chowringhee Road, Kolkata, West Bengal',
        lead_time_days: 12,
        reliability_score: 4.5,
        risk_level: 'MEDIUM',
        payment_terms: 'Advance 50%',
        total_spend: 2100000,
        status: 'ACTIVE'
      },
      {
        supplier_id: 'SUP-006',
        supplier_name: 'Schneider Electric India Pvt Ltd',
        email: 'india.orders@se.com',
        phone: '+91 80 4178 7000',
        gstin: '29AAACS9876J1ZB',
        state_code: '29',
        address: 'Attibele Industrial Area, Hosur Road, Bangalore, Karnataka',
        lead_time_days: 6,
        reliability_score: 4.9,
        risk_level: 'LOW',
        payment_terms: 'Net 30',
        total_spend: 1750000,
        status: 'ACTIVE'
      }
    ]);
    console.log('✓ Seeded Suppliers (6 Industrial Vendors).');
  }

  // 4. Seed Ledger Entries
  const ledgerCount = await LedgerEntry.countDocuments();
  if (ledgerCount === 0) {
    const entries = [
      {
        entry_id: 'LED-2026-0001',
        account_name: 'Cash and Bank Balances',
        debit: 2500000,
        credit: 0,
        running_balance: 2500000,
        transaction_type: 'ADJUSTMENT',
        reference_no: 'CAP-INIT-01',
        description: 'Initial Capital Injection by Founders',
        date: new Date('2026-01-01'),
        created_by: 'Vikramaditya Singhania'
      },
      {
        entry_id: 'LED-2026-0002',
        account_name: 'Warehouse Lease & Security Deposit',
        debit: 0,
        credit: 300000,
        running_balance: 2200000,
        transaction_type: 'EXPENSE',
        reference_no: 'DEP-WH-01',
        description: 'Security deposit for Electronic City Central Depot',
        date: new Date('2026-01-05'),
        created_by: 'Vikramaditya Singhania'
      },
      {
        entry_id: 'LED-2026-0003',
        account_name: 'Inventory Procurement - Solar Inverters',
        debit: 0,
        credit: 480000,
        running_balance: 1720000,
        transaction_type: 'PURCHASE',
        reference_no: 'PO-2026-0001',
        description: 'Purchase of 15 Units 5kW Solar Inverters from Bharat Electronics',
        date: new Date('2026-01-10'),
        created_by: 'Suresh Menon'
      },
      {
        entry_id: 'LED-2026-0004',
        account_name: 'Sales Revenue',
        debit: 285000,
        credit: 0,
        running_balance: 2005000,
        transaction_type: 'INVOICE',
        reference_no: 'INV-2026-00001',
        description: 'B2B Sales Settlement - Solar Inverter & Cable Bundle',
        date: new Date('2026-01-15'),
        created_by: 'Rahul Sharma'
      },
      {
        entry_id: 'LED-2026-0005',
        account_name: 'GST Output Tax Liability',
        debit: 0,
        credit: 51300,
        running_balance: 2005000,
        transaction_type: 'INVOICE',
        reference_no: 'INV-2026-00001',
        description: '18% GST output collected on INV-2026-00001',
        date: new Date('2026-01-15'),
        created_by: 'Rahul Sharma'
      },
      {
        entry_id: 'LED-2026-0006',
        account_name: 'Inventory Procurement - PV Cables',
        debit: 0,
        credit: 140000,
        running_balance: 1865000,
        transaction_type: 'PURCHASE',
        reference_no: 'PO-2026-0002',
        description: 'Procurement of 50 Drums MC4 Cable from Havells',
        date: new Date('2026-01-20'),
        created_by: 'Suresh Menon'
      },
      {
        entry_id: 'LED-2026-0007',
        account_name: 'Accounts Receivable',
        debit: 340000,
        credit: 0,
        running_balance: 2205000,
        transaction_type: 'INVOICE',
        reference_no: 'INV-2026-00002',
        description: 'Trade Credit Invoiced to Apex Electro-Mech Systems',
        date: new Date('2026-01-28'),
        created_by: 'Rahul Sharma'
      },
      {
        entry_id: 'LED-2026-0008',
        account_name: 'Operational Utilities & Cloud Infrastructure',
        debit: 0,
        credit: 38500,
        running_balance: 2166500,
        transaction_type: 'EXPENSE',
        reference_no: 'EXP-JAN-01',
        description: 'Commercial power tariff and AWS Cloud Hosting',
        date: new Date('2026-01-31'),
        created_by: 'Vikramaditya Singhania'
      },
      {
        entry_id: 'LED-2026-0009',
        account_name: 'Sales Revenue',
        debit: 420000,
        credit: 0,
        running_balance: 2586500,
        transaction_type: 'INVOICE',
        reference_no: 'INV-2026-00003',
        description: 'Commercial Solar Micro-Grid Invoicing',
        date: new Date('2026-02-10'),
        created_by: 'Rahul Sharma'
      },
      {
        entry_id: 'LED-2026-0010',
        account_name: 'GST Statutory Monthly Settlement',
        debit: 68400,
        credit: 0,
        running_balance: 2518100,
        transaction_type: 'PAYMENT',
        reference_no: 'GST-CHALLAN-01',
        description: 'Statutory GST Challan PMT-06 electronic cash payment',
        date: new Date('2026-02-20'),
        created_by: 'Vikramaditya Singhania'
      }
    ];

    await LedgerEntry.insertMany(entries);
    console.log('✓ Seeded Immutable Double-Entry Ledger Transactions.');
  }

  // 5. Seed AI Insights
  const insightCount = await AIInsight.countDocuments();
  if (insightCount === 0) {
    await AIInsight.insertMany([
      {
        insight_id: 'INS-CSH-2026-01',
        module: 'CASH_FLOW',
        severity: 'INFO',
        title: '30-Day Working Capital & Liquidity Forecast',
        explanation: 'Stacked Bi-LSTM neural model projects healthy operating liquidity over the next 30 days. Operating cash buffer remains at 4.2x monthly burn rate with 95% confidence.',
        impact_metric: 'Projected net positive inflow: +₹8,45,000',
        recommended_action: 'Maintain standard vendor procurement schedules without bridging credit.',
        action_route: '/dashboard',
        confidence_score: 0.94,
        status: 'ACTIVE'
      },
      {
        insight_id: 'INS-INV-PNL-01',
        module: 'INVENTORY',
        severity: 'CRITICAL',
        title: 'Imminent Stockout Risk: Monocrystalline Solar Panel 550W',
        explanation: 'Current daily sales velocity (3.2 units/day) will deplete remaining inventory (14 units) within 4.4 days, while supplier replenishment lead time is 10 days.',
        impact_metric: 'Potential lost revenue: ₹2,31,000',
        recommended_action: 'Issue expedited Purchase Order for 50 units immediately to avoid stockout.',
        action_route: '/inventory',
        confidence_score: 0.97,
        status: 'ACTIVE'
      },
      {
        insight_id: 'INS-CRD-APEX-01',
        module: 'CREDIT_RISK',
        severity: 'CRITICAL',
        title: 'Credit Anomaly & Default Risk: Apex Electro-Mech Systems',
        explanation: 'Isolation Forest flagged buyer profile with an anomaly score of -0.185. Customer has an unpaid balance of ₹3,40,000 which is 48 days past due date.',
        impact_metric: 'Receivables at risk: ₹3,40,000',
        recommended_action: 'Halt all open credit lines and enforce 100% upfront UPI/NEFT payment terms.',
        action_route: '/customers',
        confidence_score: 0.91,
        status: 'ACTIVE'
      },
      {
        insight_id: 'INS-MB-SOLAR-CABLE',
        module: 'MARKET_BASKET',
        severity: 'INFO',
        title: 'High-Lift Bundle Opportunity: Inverter & MC4 PV Cable',
        explanation: 'Apriori transactional mining discovered that 78% of customers purchasing Solar Core Inverters also require MC4 PV Cable Drums (Lift: 2.45x).',
        impact_metric: 'Estimated average transaction boost: +18.5%',
        recommended_action: 'Enable one-click cashier upsell prompt on POS matrix for bundle discount.',
        action_route: '/pos',
        confidence_score: 0.89,
        status: 'ACTIVE'
      },
      {
        insight_id: 'INS-INV-LFP-02',
        module: 'INVENTORY',
        severity: 'WARNING',
        title: 'Excess Holding Cost: LiFePO4 Battery 48V',
        explanation: 'Days of Inventory Remaining (DIR) is 142 days against target of 45 days. ₹5,46,000 of working capital is currently immobilized in low-velocity stock.',
        impact_metric: 'Carrying cost penalty: ~₹18,500 / mo',
        recommended_action: 'Run a 5% promotional bundle campaign with Solar Inverters to accelerate turnover.',
        action_route: '/inventory',
        confidence_score: 0.88,
        status: 'ACTIVE'
      }
    ]);
    console.log('✓ Seeded AI Explainable Insights.');
  }

  // 6. Seed Audit Logs
  const auditCount = await AuditLog.countDocuments();
  if (auditCount === 0) {
    await AuditLog.insertMany([
      {
        log_id: 'AUD-INIT-001',
        user_id: 'SYS-ROOT',
        user_name: 'Vikramaditya Singhania',
        user_role: 'Business Owner',
        action: 'LOGIN',
        category: 'SECURITY',
        entity: 'AuthSession',
        ip_address: '192.168.1.10',
        severity: 'INFO',
        status: 'SUCCESS'
      },
      {
        log_id: 'AUD-INIT-002',
        user_id: 'SYS-ROOT',
        user_name: 'Vikramaditya Singhania',
        user_role: 'Business Owner',
        action: 'TAX_CONFIG_CHANGE',
        category: 'COMPLIANCE',
        entity: 'Business',
        previous_value: { default_gst: 12 },
        new_value: { default_gst: 18, composition_scheme: false },
        ip_address: '192.168.1.10',
        severity: 'WARNING',
        status: 'SUCCESS'
      },
      {
        log_id: 'AUD-INIT-003',
        user_id: 'USER-WM01',
        user_name: 'Suresh Menon',
        user_role: 'Warehouse Manager',
        action: 'INVENTORY_RESTOCK',
        category: 'INVENTORY',
        entity: 'Product',
        entity_id: '8901001001',
        new_value: { quantity_added: 20, batch: 'BAT-2026-INV1' },
        severity: 'INFO',
        status: 'SUCCESS'
      }
    ]);
    console.log('✓ Seeded Initial Compliance Audit Logs.');
  }

  console.log('✓ All Enterprise Master Collections Verified & Seeded.');
}

module.exports = { seedEnterpriseData };
