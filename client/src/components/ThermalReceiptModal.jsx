import React, { useState } from 'react';
import { X, Printer, Download, CheckCircle, Shield, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const ThermalReceiptModal = ({ isOpen, onClose, invoice, items = [] }) => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const downloadPdfReceipt = async () => {
    const printableElement = document.getElementById('printable-thermal-receipt');
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
        format: [80, Math.max(120, (canvas.height * 80) / canvas.width)]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, 80, (canvas.height * 80) / canvas.width);
      const safeName = (invoice.invoice_no || 'REC').replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`POS_Receipt_${safeName}.pdf`);
    } catch (err) {
      console.error('POS Receipt PDF error:', err);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const downloadHtmlReceipt = () => {
    const printableElement = document.getElementById('printable-thermal-receipt');
    if (!printableElement) return;
    const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt ${invoice.invoice_no}</title>
  <style>
    body {
      font-family: 'Courier New', Courier, monospace;
      max-width: 80mm;
      margin: 0 auto;
      padding: 10px;
      color: #000;
      background: #fff;
    }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 4px 0; }
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
    a.download = `Receipt_${invoice.invoice_no}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTextReceipt = () => {
    let text = `========================================\n`;
    text += `       SMARTLEDGER AI ERP (POS)         \n`;
    text += `    Branch: ${invoice.branch_id || 'BR-CENTRAL-01'} \n`;
    text += `    GSTIN: 29AAACT2727Q1ZW               \n`;
    text += `========================================\n`;
    text += `Invoice: ${invoice.invoice_no}\n`;
    text += `Date: ${new Date(invoice.invoice_timestamp || Date.now()).toLocaleString()}\n`;
    text += `Cashier: ${invoice.cashier_name || 'Cashier 1'}\n`;
    text += `Customer: ${invoice.customer_name || 'Retail Customer'}\n`;
    text += `Geo-Token: Lat ${invoice.terminal_geo_token?.lat}, Lng ${invoice.terminal_geo_token?.lng} (Verified)\n`;
    text += `----------------------------------------\n`;
    items.forEach(it => {
      text += `${it.product_name || it.sku_barcode} x ${it.quantity}\n`;
      text += `   ₹${it.unit_price} | GST ${it.gst_rate}% -> ₹${it.line_total}\n`;
    });
    text += `----------------------------------------\n`;
    text += `Subtotal:    ₹${invoice.subtotal}\n`;
    text += `Total Tax:   ₹${invoice.total_tax}\n`;
    text += `Discount:    ₹${invoice.discount_amount || 0}\n`;
    text += `GRAND TOTAL: ₹${invoice.net_total}\n`;
    text += `Payment:     ${invoice.payment_method} (${invoice.payment_status})\n`;
    text += `----------------------------------------\n`;
    text += `SHA-256 BLOCK HASH:\n${invoice.crypto_hash}\n`;
    text += `PREV BLOCK HASH:\n${invoice.prev_hash}\n`;
    text += `========================================\n`;
    text += `       THANK YOU FOR YOUR BUSINESS!     \n`;
    text += `========================================\n`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${invoice.invoice_no}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.55)',
      backdropFilter: 'blur(6px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }} onClick={onClose} className="no-print">
      <div style={{
        background: '#ffffff',
        borderRadius: 22,
        padding: '2rem',
        maxWidth: 480,
        width: '100%',
        boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.15)',
        maxHeight: '92vh',
        overflowY: 'auto',
        border: '1px solid #eef2f6'
      }} onClick={e => e.stopPropagation()}>
        {/* Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: 800, fontSize: '0.9rem' }}>
            <CheckCircle size={18} /> Checkout Successful
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Printable Thermal Paper Card ── */}
        <div id="printable-thermal-receipt" style={{
          background: '#fcfcfc',
          border: '1px dashed #cbd5e1',
          borderRadius: 14,
          padding: '1.5rem',
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: '0.82rem',
          color: '#1e293b'
        }}>
          {/* Isolated Print Styles for Thermal Printers */}
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #printable-thermal-receipt, #printable-thermal-receipt * { visibility: visible !important; }
              #printable-thermal-receipt {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 80mm !important;
                margin: 0 auto !important;
                padding: 10px !important;
                border: none !important;
                background: #ffffff !important;
                box-shadow: none !important;
              }
              .no-print { display: none !important; }
            }
          `}</style>

          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '1px', color: '#0f172a' }}>
              SMARTLEDGER AI ERP
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              FLAGSHIP RETAIL &amp; WHOLESALE TERMINAL
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Branch: {invoice.branch_id || 'BR-CENTRAL-01'} | GSTIN: 29AAACT2727Q1ZW
            </div>
            <div style={{ fontSize: '0.7rem', color: '#2563eb', marginTop: '0.2rem' }}>
              GPS: {invoice.terminal_geo_token?.lat?.toFixed(4)}, {invoice.terminal_geo_token?.lng?.toFixed(4)} [Geo-Verified]
            </div>
          </div>

          <div style={{ borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.5rem', marginBottom: '0.75rem', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Invoice: <strong>{invoice.invoice_no}</strong></span>
              <span>{new Date(invoice.invoice_timestamp || Date.now()).toLocaleTimeString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
              <span>Cashier: {invoice.cashier_name || 'Staff Cashier'}</span>
              <span>{new Date(invoice.invoice_timestamp || Date.now()).toLocaleDateString()}</span>
            </div>
            <div style={{ marginTop: '0.2rem' }}>
              Customer: <strong>{invoice.customer_name || 'Walk-in Customer'}</strong>
            </div>
          </div>

          {/* Line Items */}
          <table style={{ width: '100%', marginBottom: '0.75rem', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px dashed #94a3b8' }}>
                <th style={{ textAlign: 'left', paddingBottom: '0.35rem' }}>Item</th>
                <th style={{ textAlign: 'center', paddingBottom: '0.35rem' }}>Qty</th>
                <th style={{ textAlign: 'right', paddingBottom: '0.35rem' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td style={{ paddingTop: '0.35rem' }}>
                    <div style={{ fontWeight: 700 }}>{it.product_name || it.sku_barcode}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      ₹{it.unit_price} (GST {it.gst_rate}%)
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', paddingTop: '0.35rem' }}>{it.quantity}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, paddingTop: '0.35rem' }}>₹{it.line_total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary Totals */}
          <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '0.5rem', marginBottom: '0.75rem', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Taxable Subtotal:</span>
              <span>₹{invoice.subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Total GST (CGST+SGST):</span>
              <span>+ ₹{invoice.total_tax}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                <span>Discount Applied:</span>
                <span>- ₹{invoice.discount_amount}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900, marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px dashed #cbd5e1' }}>
              <span>NET TOTAL:</span>
              <span style={{ color: '#2563eb' }}>₹{Number(invoice.net_total).toFixed(2)}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem', textAlign: 'right' }}>
              Paid via: <strong>{invoice.payment_method}</strong> ({invoice.payment_status})
            </div>
          </div>

          {/* SHA-256 Cryptographic Block Signature */}
          <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '0.65rem', marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Shield size={12} color="#2563eb" /> Cryptographic SHA-256 Signature
            </div>
            <div style={{ fontSize: '0.65rem', wordBreak: 'break-all', fontFamily: 'monospace', color: '#334155', marginTop: '0.2rem', lineHeight: 1.3 }}>
              {invoice.crypto_hash}
            </div>
            <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '0.3rem' }}>
              Chained to block: {invoice.prev_hash?.slice(0, 16)}...
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '0.85rem', fontSize: '0.68rem', color: '#94a3b8' }}>
            *** Computer Generated POS Tax Invoice ***
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <button
            onClick={downloadPdfReceipt}
            disabled={downloadingPdf}
            className="btn btn-primary"
            style={{ flex: 1, minWidth: '130px', borderRadius: 12, padding: '0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            {downloadingPdf ? (
              <span className="loading-spinner" style={{ width: 14, height: 14, borderTopColor: '#ffffff' }} />
            ) : (
              <Download size={16} />
            )}
            <span>Download PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-secondary"
            style={{ flex: 1, minWidth: '130px', borderRadius: 12, padding: '0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            <Printer size={16} /> Print / Save PDF
          </button>
          <button
            onClick={downloadHtmlReceipt}
            className="btn btn-secondary"
            style={{ borderRadius: 12, padding: '0.75rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            title="Download offline HTML document"
          >
            <FileText size={16} /> HTML
          </button>
          <button
            onClick={downloadTextReceipt}
            className="btn btn-secondary"
            style={{ borderRadius: 12, padding: '0.75rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            title="Download plain text file"
          >
            TXT
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThermalReceiptModal;
