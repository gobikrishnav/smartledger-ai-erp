/**
 * SmartLedger AI ERP — Cryptographic SHA-256 Invoice Hash Engine
 * Implements immutable block hash chaining across sequential POS transactions.
 */
const crypto = require('crypto');

/**
 * Computes a deterministic SHA-256 hash for an invoice block.
 * @param {Object} params
 * @param {string} params.invoiceNo
 * @param {number} params.netTotal
 * @param {string|Date} params.timestamp
 * @param {string} [params.prevHash='0000000000000000000000000000000000000000000000000000000000000000']
 * @param {string} [params.branchId='BR-CENTRAL-01']
 * @returns {string} SHA-256 hex string (64 characters)
 */
function generateInvoiceBlockHash({
  invoiceNo,
  netTotal,
  timestamp,
  prevHash = '0000000000000000000000000000000000000000000000000000000000000000',
  branchId = 'BR-CENTRAL-01'
}) {
  const tsString = timestamp instanceof Date ? timestamp.toISOString() : String(timestamp);
  const formattedTotal = Number(netTotal).toFixed(2);
  
  const rawPayload = `${invoiceNo}|${formattedTotal}|${tsString}|${prevHash}|${branchId}`;

  return crypto
    .createHash('sha256')
    .update(rawPayload)
    .digest('hex');
}

/**
 * Validates whether an invoice hash matches its declared properties.
 */
function verifyInvoiceHash(invoice) {
  const recomputed = generateInvoiceBlockHash({
    invoiceNo: invoice.invoice_no,
    netTotal: invoice.net_total,
    timestamp: invoice.invoice_timestamp,
    prevHash: invoice.prev_hash,
    branchId: invoice.branch_id
  });
  return recomputed === invoice.crypto_hash;
}

module.exports = {
  generateInvoiceBlockHash,
  verifyInvoiceHash
};
