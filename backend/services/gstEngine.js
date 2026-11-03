/**
 * SmartLedger AI ERP — Dynamic GST Calculation Engine
 * Complies with Indian Goods and Services Tax statutory brackets: 0%, 5%, 12%, 18%, 28%.
 */

const HSN_RATE_MAP = {
  '01': 0,   // Agri & Live Animals
  '04': 5,   // Dairy products
  '07': 0,   // Edible vegetables
  '10': 5,   // Cereals & Flour
  '19': 18,  // Packaged Foods
  '27': 18,  // Mineral Fuels & Oils
  '30': 12,  // Pharmaceutical Products
  '36': 18,  // Fireworks, Pyrotechnics & Combustibles (Sivakasi Master Category)
  '39': 18,  // Plastics & Articles
  '52': 5,   // Cotton & Textiles
  '61': 12,  // Apparels & Clothing
  '72': 18,  // Iron & Steel
  '84': 18,  // Nuclear Reactors, Boilers, Machinery
  '85': 18,  // Electrical Machinery & Equipment
  '87': 28,  // Vehicles & Automobile Parts
  '90': 18,  // Optical & Medical Instruments
  '99': 18   // Services
};

/**
 * Computes GST breakdown for an item or invoice line.
 * @param {Object} params
 * @param {number} params.unitPrice
 * @param {number} params.quantity
 * @param {number} [params.discountPercent=0]
 * @param {number} [params.customGstRate]
 * @param {string} [params.hsnCode='85']
 * @param {string} [params.originStateCode='29']
 * @param {string} [params.destStateCode='29']
 */
function computeGSTLineItem({
  unitPrice,
  quantity,
  discountPercent = 0,
  customGstRate,
  hsnCode = '85',
  originStateCode = '29',
  destStateCode = '29'
}) {
  const gross = Number(unitPrice) * Number(quantity);
  const discountAmt = (gross * Number(discountPercent || 0)) / 100;
  const taxableAmount = Math.max(0, gross - discountAmt);

  // Determine rate: custom rate if passed, else check HSN prefix, else fallback 18%
  let gstRate = 18;
  if (customGstRate !== undefined && customGstRate !== null) {
    gstRate = Number(customGstRate);
  } else if (hsnCode && hsnCode.length >= 2) {
    const prefix = hsnCode.slice(0, 2);
    gstRate = HSN_RATE_MAP[prefix] !== undefined ? HSN_RATE_MAP[prefix] : 18;
  }

  const isIntraState = String(originStateCode || '29') === String(destStateCode || '29');
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isIntraState) {
    // 50/50 split between Central and State GST
    const halfRate = gstRate / 2;
    cgst = Number(((taxableAmount * halfRate) / 100).toFixed(2));
    sgst = Number(((taxableAmount * halfRate) / 100).toFixed(2));
  } else {
    // Full Integrated GST
    igst = Number(((taxableAmount * gstRate) / 100).toFixed(2));
  }

  const totalTax = Number((cgst + sgst + igst).toFixed(2));
  const lineTotal = Number((taxableAmount + totalTax).toFixed(2));

  return {
    grossAmount: Number(gross.toFixed(2)),
    discountAmount: Number(discountAmt.toFixed(2)),
    taxableAmount: Number(taxableAmount.toFixed(2)),
    gstRate,
    isIntraState,
    cgst,
    sgst,
    igst,
    totalTax,
    lineTotal
  };
}

const HSN_DIRECTORY = [
  { code: '3604', chapter: '36', rate: 18, name: 'Fireworks & Pyrotechnic Articles', description: 'Sparklers, flowerpots, rockets, ground chakkars, aerial shells, and sound crackers' },
  { code: '8471', chapter: '84', rate: 18, name: 'Automatic Data Processing Machines', description: 'Point of sale terminals, computer systems, and microcomputers' },
  { code: '8501', chapter: '85', rate: 18, name: 'Electrical Motors & Generators', description: 'Industrial automation units and electrical machinery' },
  { code: '3923', chapter: '39', rate: 18, name: 'Plastic Packaging Articles', description: 'Boxes, cases, crates, and packaging materials' },
  { code: '4819', chapter: '48', rate: 12, name: 'Cartons, Boxes & Paper Packaging', description: 'Corrugated cartons and cardboard packaging containers' },
  { code: '1006', chapter: '10', rate: 5, name: 'Cereals & Grains', description: 'Processed rice, flour, and agricultural grains' },
  { code: '0402', chapter: '04', rate: 5, name: 'Dairy & Milk Products', description: 'Milk powder, packaged butter, and condensed dairy products' },
  { code: '3004', chapter: '30', rate: 12, name: 'Medicaments & Formulations', description: 'Pharmaceutical drugs and medical formulations' },
  { code: '8708', chapter: '87', rate: 28, name: 'Motor Vehicle Parts & Accessories', description: 'Automotive spares and mechanical transport parts' },
  { code: '9983', chapter: '99', rate: 18, name: 'Professional & Technical Services', description: 'IT consulting, ERP platform maintenance, and logistics support' }
];

module.exports = {
  HSN_RATE_MAP,
  HSN_DIRECTORY,
  computeGSTLineItem,
  calculateLineGst: (amount, rate, originState, destState) => {
    return computeGSTLineItem({
      unitPrice: amount,
      quantity: 1,
      customGstRate: rate,
      originStateCode: originState,
      destStateCode: destState
    });
  }
};
