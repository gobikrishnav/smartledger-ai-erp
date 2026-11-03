const mongoose = require('mongoose');
const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const StaffUser = require('../models/StaffUser');

const RAW_SUPPLIERS = [
  {
    supplier_id: 'SUP-CHE-001',
    supplier_name: 'Standard Chemical Works (Potassium Nitrate)',
    gstin: '33AABCS4455Q1Z8',
    state_code: '33',
    email: 'sales@standardchem.sivakasi.in',
    phone: '9443123451',
    address: 'Chemical Industrial Estate, Sivakasi - 626123',
    lead_time_days: 5,
    payment_terms: 'Net 30',
    reliability_score: 4.9,
    risk_level: 'LOW'
  },
  {
    supplier_id: 'SUP-MET-002',
    supplier_name: 'Tamil Nadu Metal Powders Ltd (Pyro Aluminum)',
    gstin: '33AABCT9988D1Z2',
    state_code: '33',
    email: 'orders@tnmetalpowders.com',
    phone: '9443234562',
    address: 'Virudhunagar Highway, Thiruthangal, Sivakasi - 626130',
    lead_time_days: 7,
    payment_terms: 'Net 45',
    reliability_score: 4.8,
    risk_level: 'LOW'
  },
  {
    supplier_id: 'SUP-PAC-003',
    supplier_name: 'Sivakasi Corrugated Packaging Industries',
    gstin: '33AAECS5544K1ZF',
    state_code: '33',
    email: 'cartons@sivakasipackaging.in',
    phone: '9443345673',
    address: 'Sattur Road, Sivakasi - 626124',
    lead_time_days: 4,
    payment_terms: 'Net 30',
    reliability_score: 4.7,
    risk_level: 'LOW'
  },
  {
    supplier_id: 'SUP-FUS-004',
    supplier_name: 'National Safety Fuse & Cotton Twine Mills',
    gstin: '33AAACN6677M1ZB',
    state_code: '33',
    email: 'procurement@nationalfuse.in',
    phone: '9443456784',
    address: 'Vembakottai Road, Sivakasi - 626131',
    lead_time_days: 6,
    payment_terms: 'Net 30',
    reliability_score: 4.9,
    risk_level: 'LOW'
  },
  {
    supplier_id: 'SUP-PAP-005',
    supplier_name: 'Seshasayee Paper & Paperboard Board Mills',
    gstin: '33AAACS1122E1Z3',
    state_code: '33',
    email: 'tubes@seshasayeepaper.com',
    phone: '9443567895',
    address: 'Erode-Sivakasi Supply Depot, Sivakasi - 626123',
    lead_time_days: 8,
    payment_terms: 'Net 45',
    reliability_score: 4.8,
    risk_level: 'LOW'
  }
];

async function seedPurchaseData() {
  try {
    const existingPOs = await PurchaseOrder.countDocuments();
    if (existingPOs > 10) {
      console.log(`✓ Purchase orders already exist (${existingPOs} POs). Skipping.`);
      return;
    }

    console.log('📦 Seeding statutory suppliers and inward purchase orders for ITC reconciliation...');
    for (const sup of RAW_SUPPLIERS) {
      await Supplier.findOneAndUpdate(
        { supplier_id: sup.supplier_id },
        sup,
        { upsert: true, new: true }
      );
    }

    const warehouseMgr = await StaffUser.findOne({ role: { $in: ['WAREHOUSE_MGR', 'BUSINESS_OWNER', 'ADMIN'] } });

    // Generate 20 realistic monthly inward purchase orders over the last 90 days
    // Total estimated purchase value ~₹4.5M (giving ~₹810,000 in eligible ITC)
    const poBatches = [
      { name: 'Potassium Nitrate 99.5% Tech Grade (25 MT)', cost: 350000, sup: RAW_SUPPLIERS[0] },
      { name: 'Pyrotechnic Dark Aluminum Flake Powder (5 MT)', cost: 420000, sup: RAW_SUPPLIERS[1] },
      { name: 'Heavy Duty 5-Ply Export Quality Cartons (15,000 pcs)', cost: 225000, sup: RAW_SUPPLIERS[2] },
      { name: 'Fast Ignition Green Visco Fuse Spools (20,000 meters)', cost: 180000, sup: RAW_SUPPLIERS[3] },
      { name: 'Kraft Paperboard Spiral Tubes (50,000 units)', cost: 195000, sup: RAW_SUPPLIERS[4] },
      { name: 'Sulfur Flakes Pure Grade (10 MT)', cost: 140000, sup: RAW_SUPPLIERS[0] },
      { name: 'Atomized Aluminum Powder Grade 120 (3 MT)', cost: 310000, sup: RAW_SUPPLIERS[1] },
      { name: 'Printed Multi-color Display Cartons (25,000 pcs)', cost: 340000, sup: RAW_SUPPLIERS[2] },
      { name: 'Red Electric Match Igniters & Delay Fuse', cost: 165000, sup: RAW_SUPPLIERS[3] },
      { name: 'High-Strength Kraft Paper Rolls (30 MT)', cost: 280000, sup: RAW_SUPPLIERS[4] },
      { name: 'Barium Nitrate Green Flame Grade (12 MT)', cost: 390000, sup: RAW_SUPPLIERS[0] },
      { name: 'Strontium Nitrate Deep Crimson Grade (8 MT)', cost: 295000, sup: RAW_SUPPLIERS[0] },
      { name: 'Silver Flash Powder Superfine Grade (2 MT)', cost: 260000, sup: RAW_SUPPLIERS[1] },
      { name: 'Moisture Barrier Corrugated Cases (10,000 pcs)', cost: 190000, sup: RAW_SUPPLIERS[2] },
      { name: 'Safety Cotton Braided Twine (5,000 coils)', cost: 95000, sup: RAW_SUPPLIERS[3] },
      { name: 'Spiral Wound Launcher Tubes (30,000 units)', cost: 210000, sup: RAW_SUPPLIERS[4] },
      { name: 'Titanium Sponge Granules for Sparklers (1 MT)', cost: 380000, sup: RAW_SUPPLIERS[1] },
      { name: 'Polythene Waterproof Inner Liners (40,000 pcs)', cost: 115000, sup: RAW_SUPPLIERS[2] }
    ];

    const posToInsert = [];
    const now = Date.now();

    poBatches.forEach((batch, idx) => {
      const daysAgo = Math.floor((idx / poBatches.length) * 85);
      const poDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
      const poId = `PO-2026-${String(idx + 101).padStart(4, '0')}`;

      posToInsert.push({
        po_id: poId,
        supplier_name: batch.sup.supplier_name,
        supplier_email: batch.sup.email,
        warehouse_mgr_id: warehouseMgr?._id,
        warehouse_mgr_name: warehouseMgr?.full_name || 'Enjar Depot Manager',
        branch_id: 'WH-ENJAR-01',
        status: idx % 6 === 0 ? 'DISPATCHED' : 'RECEIVED',
        total_estimated_cost: batch.cost,
        created_at: poDate,
        dispatched_at: poDate,
        received_at: new Date(poDate.getTime() + 4 * 24 * 60 * 60 * 1000),
        items: [
          {
            sku_barcode: `RAW-${1000 + idx}`,
            product_name: batch.name,
            quantity_ordered: 1,
            unit_cost: batch.cost,
            total_cost: batch.cost
          }
        ]
      });
    });

    await PurchaseOrder.insertMany(posToInsert);
    console.log(`✅ Successfully seeded ${posToInsert.length} inward Purchase Orders for ITC reconciliation.`);
  } catch (err) {
    console.error('Seed purchase data error:', err);
  }
}

module.exports = { seedPurchaseData };
