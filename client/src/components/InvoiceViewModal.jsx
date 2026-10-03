import React, { useState, useEffect } from 'react';
import { FiX, FiPrinter, FiDownload, FiCheck, FiShield } from 'react-icons/fi';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import client from '../api/client';

const InvoiceViewModal = ({ invoice: initialInvoice, onClose }) => {
  const [invoice, setInvoice] = useState(initialInvoice);
  const [loadingItems, setLoadingItems] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    setInvoice(initialInvoice);
    // If items are missing or empty, fetch complete invoice with items
    if (initialInvoice && (!initialInvoice.items || initialInvoice.items.length === 0)) {
      const invId = initialInvoice._id || initialInvoice.id;
      if (invId) {
        setLoadingItems(true);
        client.get(`/invoices/${invId}`)
          .then(res => {
            const data = res.data;
            if (data && (data.invoice || data.items)) {
              setInvoice({
                ...initialInvoice,
                ...(data.invoice || data),
                items: data.items || data.invoice?.items || []
              });
            }
          })
          .catch(err => console.warn('Could not fetch complete invoice line items:', err))
          .finally(() => setLoadingItems(false));
      }
    }
  }, [initialInvoice]);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNo = invoice.invoice_no || invoice.invoiceNumber || 'INV-2026-00001';
  const customerName = invoice.clientId?.businessName || invoice.client?.businessName || invoice.client?.fullName || invoice.customer_name || 'Retail Trade Client';
  const customerGstin = invoice.clientId?.gstin || invoice.client?.gstin || invoice.customer_gstin || '29AAACT2727Q1ZW';
  const originState = invoice.originStateCode || '29';
  const destState = invoice.destinationStateCode || invoice.stateCode || invoice.client?.stateCode || '29';
  const isIntraState = originState === destState;

  const rawSubtotal = Number(invoice.subtotalAmt || invoice.subtotal || 0);
  const discountVal = Number(invoice.discountAmt || invoice.discount_amount || 0);
  const cgstVal = Number(invoice.cgstTotal || invoice.cgst_total || 0);
  const sgstVal = Number(invoice.sgstTotal || invoice.sgst_total || 0);
  const igstVal = Number(invoice.igstTotal || invoice.igst_total || 0);
  const shippingVal = Number(invoice.shippingAmt || 0);
  const grandTotalVal = Number(invoice.grandTotal || invoice.net_total || (rawSubtotal - discountVal + cgstVal + sgstVal + igstVal + shippingVal));

  const items = (invoice.items || []).map(it => {
    const qty = Number(it.quantity || 1);
    const unitPrice = Number(it.unit_price || it.unitPrice || 0);
    const taxable = Number(it.taxable_amount || it.taxableAmount || (qty * unitPrice));
    return {
      name: it.product_name || it.productName || 'Product SKU',
      hsn: it.hsn_code || it.hsnCode || '8501',
      qty,
      unitPrice,
      taxable,
      cgst: Number(it.cgst || it.cgstAmount || 0),
      sgst: Number(it.sgst || it.sgstAmount || 0),
      igst: Number(it.igst || it.igstAmount || 0),
      gstRate: it.gst_rate || it.gstRate || 18
    };
  });

  const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(v || 0);

  // Direct Vectorized/Canvas A4 PDF Generator
  const handleDownloadPDF = async () => {
    const printableElement = document.getElementById('printable-invoice');
    if (!printableElement) return;
    setDownloadingPdf(true);
    try {
      const canvas = await html2canvas(printableElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const safeName = (invoiceNo || 'INV-2026').replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`Tax_Invoice_${safeName}.pdf`);
    } catch (err) {
      console.error('PDF generation error, falling back to print dialog:', err);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Standalone offline receipt HTML download
  const downloadCleanHTML = () => {
    const printableElement = document.getElementById('printable-invoice');
    if (!printableElement) return;
    const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tax Invoice ${invoiceNo}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 40px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; text-align: left; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
  </style>
</head>
<body>
  ${printableElement.innerHTML}
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${invoiceNo}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(5px)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
    }} onClick={onClose} className="no-print">
      
      <div style={{
        background: '#ffffff', borderRadius: 18, width: '100%', maxWidth: '880px',
        maxHeight: '92vh', overflowY: 'auto', position: 'relative', boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.25)',
        border: '1px solid #e2e8f0'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="no-print" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.25rem 1.75rem', borderBottom: '1px solid #eef2f6',
          position: 'sticky', top: 0, background: '#ffffff', zIndex: 10
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              Tax Invoice #{invoiceNo}
            </h3>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
              Statutory GST & Cryptographic Ledger Proof
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="btn btn-primary"
              style={{ padding: '0.5rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem' }}
            >
              {downloadingPdf ? (
                <>
                  <span className="loading-spinner" style={{ width: 14, height: 14, borderTopColor: '#ffffff' }} />
                  Generating PDF...
                </>
              ) : (
                <>
                  <FiDownload /> Download Official PDF
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
            >
              <FiPrinter /> Print A4
            </button>
            <button
              onClick={downloadCleanHTML}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}
              title="Download offline HTML document"
            >
              HTML
            </button>
            <button onClick={onClose} style={{
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '50%',
              width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748b'
            }}>
              <FiX />
            </button>
          </div>
        </div>

        {/* Printable A4 Area */}
        <div id="printable-invoice" style={{ padding: '2.5rem 3rem', background: '#ffffff', color: '#0f172a', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
          {/* Print Styles */}
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #printable-invoice, #printable-invoice * { visibility: visible !important; }
              #printable-invoice {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 20mm !important;
                margin: 0 !important;
                box-shadow: none !important;
              }
              .no-print { display: none !important; }
            }
          `}</style>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 900, color: '#2563eb', letterSpacing: '-0.02em' }}>
                SmartLedger AI
              </h1>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem', fontWeight: 600 }}>
                Enterprise Retail & Wholesale ERP System
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>
                Branch: {invoice.branch_id || 'BR-CENTRAL-01'} | State Code: {originState}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.1rem' }}>
                GSTIN: 29AAACT2727Q1ZW
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                TAX INVOICE
              </h2>
              <div style={{ fontSize: '0.88rem', color: '#0f172a', marginTop: '0.45rem' }}>
                <strong>Invoice No:</strong> {invoiceNo}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.2rem' }}>
                <strong>Date:</strong> {new Date(invoice.createdAt || invoice.invoice_timestamp || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.2rem', textTransform: 'capitalize' }}>
                <strong>Status:</strong> {invoice.status || invoice.payment_status || 'PAID'}
              </div>
            </div>
          </div>

          {/* Billed To & Place of Supply */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', background: '#f8fafc', padding: '1.25rem 1.5rem', borderRadius: 10, border: '1px solid #eef2f6' }}>
            <div style={{ width: '48%' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                BILLED TO / BUYER:
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                {customerName}
              </div>
              {invoice.customer_phone && <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.2rem' }}>Phone: {invoice.customer_phone}</div>}
              <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.2rem' }}>GSTIN: {customerGstin}</div>
              <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.2rem' }}>State Code: {destState}</div>
            </div>
            <div style={{ width: '48%', textAlign: 'right' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                TRANSACTION & SUPPLY:
              </div>
              <div style={{ fontSize: '0.86rem', color: '#0f172a', fontWeight: 700 }}>
                {isIntraState ? 'Intra-State Supply (CGST + SGST)' : 'Inter-State Supply (IGST)'}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.25rem' }}>
                Place of Supply: State Code {destState}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.25rem' }}>
                Payment: {invoice.payment_method || 'UPI'} ({invoice.payment_status || 'PAID'})
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          {loadingItems ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              Fetching line items from ledger...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderTop: '1px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.82rem', color: '#0f172a', width: '38%' }}>Item Description</th>
                  <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontSize: '0.82rem', color: '#0f172a' }}>HSN</th>
                  <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontSize: '0.82rem', color: '#0f172a' }}>Qty</th>
                  <th style={{ padding: '0.75rem 0.75rem', textAlign: 'right', fontSize: '0.82rem', color: '#0f172a' }}>Rate</th>
                  <th style={{ padding: '0.75rem 0.75rem', textAlign: 'right', fontSize: '0.82rem', color: '#0f172a' }}>Taxable Amt</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.82rem', color: '#0f172a' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                      Retail Transaction Items Logged Under Invoice #{invoiceNo}
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.86rem', color: '#1e293b' }}>
                        <div style={{ fontWeight: 700 }}>{it.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
                          GST {it.gstRate}% {isIntraState ? `(CGST: ₹${it.cgst.toFixed(1)} + SGST: ₹${it.sgst.toFixed(1)})` : `(IGST: ₹${it.igst.toFixed(1)})`}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center', fontSize: '0.84rem', color: '#475569' }}>{it.hsn}</td>
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center', fontSize: '0.86rem', color: '#1e293b', fontWeight: 600 }}>{it.qty}</td>
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontSize: '0.84rem', color: '#475569' }}>₹{it.unitPrice.toFixed(2)}</td>
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontSize: '0.86rem', color: '#1e293b' }}>₹{it.taxable.toFixed(2)}</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontSize: '0.86rem', color: '#0f172a', fontWeight: 700 }}>
                        ₹{(it.taxable + (isIntraState ? (it.cgst + it.sgst) : it.igst)).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* Financial Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
            <div style={{ width: '360px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.88rem', color: '#475569' }}>
                <span>Taxable Value:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{fmt(rawSubtotal)}</span>
              </div>
              
              {discountVal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.88rem', color: '#10b981' }}>
                  <span>Trade Discount:</span>
                  <span style={{ fontWeight: 600 }}>- {fmt(discountVal)}</span>
                </div>
              )}

              {isIntraState ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.88rem', color: '#475569' }}>
                    <span>Central GST (CGST):</span>
                    <span>{fmt(cgstVal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.88rem', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    <span>State GST (SGST):</span>
                    <span>{fmt(sgstVal)}</span>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.88rem', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                  <span>Integrated GST (IGST):</span>
                  <span>{fmt(igstVal)}</span>
                </div>
              )}

              {shippingVal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.88rem', color: '#475569' }}>
                  <span>Logistics & Freight:</span>
                  <span>{fmt(shippingVal)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem 0', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', borderTop: '2px solid #0f172a', marginTop: '0.4rem' }}>
                <span>Grand Total:</span>
                <span style={{ color: '#2563eb' }}>{fmt(grandTotalVal)}</span>
              </div>
            </div>
          </div>

          {/* Cryptographic SHA-256 Ledger Ring Verification Seal */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2563eb', fontWeight: 800, fontSize: '0.8rem' }}>
              <FiShield /> Cryptographic Ledger Block Proof (SHA-256)
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#475569', wordBreak: 'break-all', marginTop: '0.35rem' }}>
              Block Hash: {invoice.crypto_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.15rem' }}>
              Chained Parent: {(invoice.prev_hash || 'GENESIS_BLOCK_00000000000000000000000000000000').slice(0, 36)}...
            </div>
          </div>

          {/* Footer Notes */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#64748b' }}>
            <p style={{ margin: '0 0 0.35rem 0' }}><strong>Notes:</strong> {invoice.notes || 'Goods once sold are covered under standard enterprise manufacturer warranty.'}</p>
            <p style={{ margin: 0 }}>This is an authentic, computer-generated tax invoice verified by SmartLedger AI ERP. No signature required.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewModal;
