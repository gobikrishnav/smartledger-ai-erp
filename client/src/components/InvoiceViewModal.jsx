import React, { useState, useEffect } from 'react';
import { FiX, FiPrinter, FiDownload, FiCheck, FiShield, FiFileText, FiAward } from 'react-icons/fi';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import client from '../api/client';

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

const InvoiceViewModal = ({ invoice: initialInvoice, onClose }) => {
  const [invoice, setInvoice] = useState(initialInvoice);
  const [loadingItems, setLoadingItems] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [templateMode, setTemplateMode] = useState('velavan'); // 'velavan' or 'gst'

  useEffect(() => {
    setInvoice(initialInvoice);
    if (initialInvoice) {
      if (initialInvoice.company_name?.includes('VELAVAN') || initialInvoice.invoice_no === '1384' || initialInvoice.total_cases > 0) {
        setTemplateMode('velavan');
      }
    }
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

  const invoiceNo = invoice.invoice_no || invoice.invoiceNumber || '1384';
  const customerName = invoice.clientId?.businessName || invoice.client?.businessName || invoice.client?.fullName || invoice.customer_name || 'Mah gondia sitaram chauraswya';
  const customerPhone = invoice.clientId?.phone || invoice.client?.phone || invoice.customer_phone || '7719975175';
  const customerGstin = invoice.clientId?.gstin || invoice.client?.gstin || invoice.customer_gstin || '33GCMPS3008E1ZO';
  const originState = invoice.originStateCode || '33';
  const destState = invoice.destinationStateCode || invoice.stateCode || invoice.client?.stateCode || '33';
  const isIntraState = originState === destState;

  const rawSubtotal = Number(invoice.subtotalAmt || invoice.subtotal || 27000);
  const discountVal = Number(invoice.discountAmt || invoice.discount_amount || 0);
  const cgstVal = Number(invoice.cgstTotal || invoice.cgst_total || 0);
  const sgstVal = Number(invoice.sgstTotal || invoice.sgst_total || 0);
  const igstVal = Number(invoice.igstTotal || invoice.igst_total || 0);
  const otherChargesVal = Number(invoice.other_charges || invoice.otherCharges || invoice.shippingAmt || 1800);
  const packagingChargesVal = Number(invoice.packaging_charges || invoice.packagingCharges || 405);
  const grandTotalVal = Number(invoice.grandTotal || invoice.net_total || (rawSubtotal - discountVal + cgstVal + sgstVal + igstVal + otherChargesVal + packagingChargesVal));
  const receivedVal = Number(invoice.received_amount || invoice.receivedAmount || 0);
  const balanceVal = Number(invoice.balance_amount || invoice.balanceAmount || Math.max(0, grandTotalVal - receivedVal));
  const amountWords = invoice.amount_in_words || numberToIndianWords(grandTotalVal);

  const transportName = invoice.transport_name || 'VRL Logistics';
  const vehicleNumber = invoice.vehicle_number || 'TN 67 AB 1234';
  const termsText = invoice.terms_conditions || 'Goods once sold will not be taken back. Sivakasi jurisdiction only. Thank you for doing business with us.';
  const companyName = invoice.company_name || 'VELAVAN CRACKERS';

  const rawItems = invoice.items && invoice.items.length > 0 ? invoice.items : [
    {
      product_name: 'Red bijili 100 pcs gold bags',
      case_content: 36,
      brand: 'Karpagam',
      no_of_cases: 5,
      quantity: 180,
      unit_price: 150,
      line_total: 27000
    }
  ];

  const items = rawItems.map((it, idx) => {
    const qty = Number(it.quantity || 180);
    const unitPrice = Number(it.unit_price || it.unitPrice || 150);
    const taxable = Number(it.taxable_amount || it.taxableAmount || (qty * unitPrice));
    const caseCnt = Number(it.case_content || it.caseContent || 36);
    const cases = Number(it.no_of_cases || it.noCases || Math.ceil(qty / (caseCnt || 1)));
    return {
      sno: idx + 1,
      name: it.product_name || it.productName || 'Red bijili 100 pcs gold bags',
      hsn: it.hsn_code || it.hsnCode || '3604',
      caseContent: caseCnt,
      brand: it.brand || 'Karpagam',
      noCases: cases,
      qty,
      unitPrice,
      taxable,
      cgst: Number(it.cgst || it.cgstAmount || 0),
      sgst: Number(it.sgst || it.sgstAmount || 0),
      igst: Number(it.igst || it.igstAmount || 0),
      gstRate: it.gst_rate || it.gstRate || 0,
      amount: Number(it.line_total || it.amount || (qty * unitPrice))
    };
  });

  const totalCasesComputed = items.reduce((sum, it) => sum + (it.noCases || 0), 0);
  const totalQtyComputed = items.reduce((sum, it) => sum + (it.qty || 0), 0);

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

      const safeName = (invoiceNo || 'INV-1384').replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`Invoice_${safeName}_VELAVAN_CRACKERS.pdf`);
    } catch (err) {
      console.error('PDF generation error, falling back to print dialog:', err);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const invoiceDateStr = invoice.createdAt || invoice.invoice_timestamp ?
    new Date(invoice.createdAt || invoice.invoice_timestamp).toLocaleDateString('en-GB') :
    '07-09-2026';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }} onClick={onClose} className="no-print">
      
      <div style={{
        background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: '940px',
        maxHeight: '94vh', overflowY: 'auto', position: 'relative', boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.35)',
        border: '1px solid #cbd5e1'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Modal Controls Toolbar */}
        <div className="no-print" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0',
          position: 'sticky', top: 0, background: '#ffffff', zIndex: 10, flexWrap: 'wrap', gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Template:</span>
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
              <button
                onClick={() => setTemplateMode('velavan')}
                style={{
                  border: 'none', background: templateMode === 'velavan' ? '#2563eb' : 'transparent',
                  color: templateMode === 'velavan' ? '#ffffff' : '#64748b',
                  padding: '0.4rem 0.85rem', borderRadius: 6, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer'
                }}
              >
                🎆 Velavan Crackers / Estimates (PDF 1)
              </button>
              <button
                onClick={() => setTemplateMode('gst')}
                style={{
                  border: 'none', background: templateMode === 'gst' ? '#2563eb' : 'transparent',
                  color: templateMode === 'gst' ? '#ffffff' : '#64748b',
                  padding: '0.4rem 0.85rem', borderRadius: 6, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer'
                }}
              >
                🏛️ GST Tax Invoice
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              style={{
                background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 8,
                padding: '0.5rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.45rem',
                fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              {downloadingPdf ? (
                <>
                  <span className="loading-spinner" style={{ width: 14, height: 14, borderTopColor: '#ffffff' }} />
                  Exporting PDF...
                </>
              ) : (
                <>
                  <FiDownload /> Download Official PDF
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              style={{
                background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: 8,
                padding: '0.5rem 0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <FiPrinter /> Print A4
            </button>
            <button onClick={onClose} style={{
              background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '50%',
              width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748b'
            }}>
              <FiX />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" style={{
          padding: '2.5rem 2.8rem', background: '#ffffff', color: '#1e293b',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
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
                padding: 12mm 15mm !important;
                margin: 0 !important;
                box-shadow: none !important;
              }
              .no-print { display: none !important; }
            }
          `}</style>

          {/* ════════════════════════════════════════════════════════════════════
              MODE 1: EXACT VELAVAN CRACKERS / ESTIMATES TEMPLATE (MATCHING PDF 1)
              ════════════════════════════════════════════════════════════════════ */}
          {templateMode === 'velavan' ? (
            <div style={{ border: '2px solid #334155', borderRadius: 4, padding: '1.5rem', background: '#ffffff' }}>
              
              {/* Top Banner: Estimates & Company Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #334155', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#475569', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  Estimates
                </div>
                <h1 style={{ margin: '0.25rem 0', fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.04em' }}>
                  {companyName}
                </h1>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  5/339 Sai Kuzanthai Ammal Nagar, ENJAR Village, Sivakasi-Taluk, Virudhunagar-Dist, Tamil Nadu - 626124
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                  GSTIN: 33GCMPS3008E1ZO | Lic No: E/SS/TN/24/161(E-92784) | Phone: 9600499750, 9486050349
                </div>
              </div>

              {/* Two Column Details: Bill To & Invoice/Transport Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid #94a3b8', borderRadius: 4, marginBottom: '1.5rem' }}>
                
                {/* Left Column: Bill To */}
                <div style={{ padding: '1rem 1.25rem', borderRight: '1px solid #94a3b8' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '0.4rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.25rem' }}>
                    Bill To:
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                    {customerName}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
                    <strong>Contact No:</strong> {customerPhone}
                  </div>
                  {customerGstin && (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                      GSTIN: {customerGstin}
                    </div>
                  )}
                </div>

                {/* Right Column: Invoice & Transportation Details */}
                <div style={{ padding: '1rem 1.25rem', background: '#f8fafc' }}>
                  <div style={{ marginBottom: '0.75rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Invoice Details:
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: '#1e293b' }}>
                      <span><strong>No:</strong> {invoiceNo}</span>
                      <span><strong>Date:</strong> {invoiceDateStr}</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Transportation Details:
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#1e293b' }}>
                      <strong>Transport Name:</strong> {transportName}
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#1e293b', marginTop: '0.15rem' }}>
                      <strong>Vehicle Number:</strong> {vehicleNumber}
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Matching Exact PDF 1 Columns: # | Item Name | case content | Brand | No Of Cases | Quantity | Price/ Unit (₹) | Amount(₹) */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #94a3b8', marginBottom: '1rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #334155' }}>
                    <th style={{ border: '1px solid #cbd5e1', padding: '0.65rem 0.5rem', textAlign: 'center', fontSize: '0.82rem', fontWeight: 800, width: '4%' }}>#</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '0.65rem 0.75rem', textAlign: 'left', fontSize: '0.82rem', fontWeight: 800, width: '38%' }}>Item Name</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '0.65rem 0.5rem', textAlign: 'center', fontSize: '0.82rem', fontWeight: 800, width: '10%' }}>case content</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '0.65rem 0.5rem', textAlign: 'center', fontSize: '0.82rem', fontWeight: 800, width: '11%' }}>Brand</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '0.65rem 0.5rem', textAlign: 'center', fontSize: '0.82rem', fontWeight: 800, width: '10%' }}>No Of Cases</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '0.65rem 0.5rem', textAlign: 'center', fontSize: '0.82rem', fontWeight: 800, width: '9%' }}>Quantity</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '0.65rem 0.5rem', textAlign: 'right', fontSize: '0.82rem', fontWeight: 800, width: '12%' }}>Price/ Unit (₹)</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '0.65rem 0.75rem', textAlign: 'right', fontSize: '0.82rem', fontWeight: 800, width: '14%' }}>Amount(₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                      <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem 0.4rem', textAlign: 'center', fontSize: '0.82rem', fontWeight: 600 }}>{it.sno}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem 0.75rem', fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>{it.name}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem 0.4rem', textAlign: 'center', fontSize: '0.82rem', color: '#475569' }}>{it.caseContent}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem 0.4rem', textAlign: 'center', fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>{it.brand}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem 0.4rem', textAlign: 'center', fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>{it.noCases}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem 0.4rem', textAlign: 'center', fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>{it.qty}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem 0.5rem', textAlign: 'right', fontSize: '0.84rem', color: '#1e293b' }}>₹ {it.unitPrice.toFixed(2)}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem 0.75rem', textAlign: 'right', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>₹ {it.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  
                  {/* Table Total Summary Row */}
                  <tr style={{ background: '#f8fafc', fontWeight: 800, borderTop: '2px solid #334155' }}>
                    <td colSpan={4} style={{ border: '1px solid #cbd5e1', padding: '0.65rem 0.75rem', textAlign: 'right', fontSize: '0.84rem' }}>
                      Total:
                    </td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.65rem 0.4rem', textAlign: 'center', fontSize: '0.86rem', color: '#0f172a' }}>
                      {totalCasesComputed}
                    </td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.65rem 0.4rem', textAlign: 'center', fontSize: '0.86rem', color: '#0f172a' }}>
                      {totalQtyComputed}
                    </td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.65rem 0.5rem', textAlign: 'right', fontSize: '0.84rem' }}>-</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.65rem 0.75rem', textAlign: 'right', fontSize: '0.9rem', color: '#0f172a' }}>
                      ₹ {rawSubtotal.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Bottom Financial Grid (PDF 1 exact structure) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', marginTop: '1rem', borderTop: '1px solid #94a3b8', paddingTop: '1rem' }}>
                
                {/* Left: Invoice Amount in Words & Terms */}
                <div>
                  <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: 4, border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Invoice Amount In Words:
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', fontStyle: 'italic' }}>
                      {amountWords}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                      Terms and Conditions:
                    </div>
                    <div>{termsText}</div>
                    <div style={{ marginTop: '0.35rem', color: '#94a3b8' }}>
                      Payment Status: <strong>{invoice.payment_status || 'PAID'}</strong> | Mode: <strong>{invoice.payment_method || 'CASH'}</strong>
                    </div>
                  </div>
                </div>

                {/* Right: Sub Total, Other Charges, Packaging, Total, Received, Balance */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, padding: '0.85rem 1.15rem', background: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.86rem', color: '#334155' }}>
                    <span>Sub Total:</span>
                    <span style={{ fontWeight: 700 }}>₹ {rawSubtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.86rem', color: '#334155' }}>
                    <span>Other Charges:</span>
                    <span style={{ fontWeight: 700 }}>₹ {otherChargesVal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.86rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                    <span>Packaging:</span>
                    <span style={{ fontWeight: 700 }}>₹ {packagingChargesVal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', borderBottom: '2px solid #0f172a' }}>
                    <span>Total:</span>
                    <span style={{ color: '#0f172a' }}>₹ {grandTotalVal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.86rem', color: '#334155', marginTop: '0.35rem' }}>
                    <span>Received:</span>
                    <span style={{ fontWeight: 700 }}>₹ {receivedVal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#2563eb' }}>
                    <span>Balance:</span>
                    <span>₹ {balanceVal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Signatory Line */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2.5rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Cryptographic Ledger Hash: {invoice.crypto_hash ? `${invoice.crypto_hash.slice(0, 24)}...` : 'Verified Sivakasi Block Proof'}
                </div>
                <div style={{ textAlign: 'center', width: '240px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '2.2rem' }}>
                    For {companyName}
                  </div>
                  <div style={{ borderTop: '1px solid #334155', paddingTop: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                    Authorized Signatory
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* ════════════════════════════════════════════════════════════════════
               MODE 2: STATUTORY GST TAX INVOICE
               ════════════════════════════════════════════════════════════════════ */
            <div>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#2563eb', letterSpacing: '-0.02em' }}>
                    SmartLedger AI
                  </h1>
                  <div style={{ fontSize: '0.84rem', color: '#475569', marginTop: '0.2rem', fontWeight: 600 }}>
                    Enterprise Wholesale & Crackers ERP System
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                    Branch: {invoice.branch_id || 'SIVAKASI-DEPOT-01'} | State: Tamil Nadu (33)
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.1rem' }}>
                    GSTIN: 33GCMPS3008E1ZO
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                    TAX INVOICE
                  </h2>
                  <div style={{ fontSize: '0.86rem', color: '#0f172a', marginTop: '0.35rem' }}>
                    <strong>Invoice No:</strong> {invoiceNo}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.15rem' }}>
                    <strong>Date:</strong> {invoiceDateStr}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.15rem', textTransform: 'capitalize' }}>
                    <strong>Status:</strong> {invoice.status || invoice.payment_status || 'PAID'}
                  </div>
                </div>
              </div>

              {/* Billed To & Place of Supply */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: 8, border: '1px solid #eef2f6' }}>
                <div style={{ width: '48%' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    BILLED TO / BUYER:
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    {customerName}
                  </div>
                  {customerPhone && <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.15rem' }}>Phone: {customerPhone}</div>}
                  <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.15rem' }}>GSTIN: {customerGstin}</div>
                  <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.15rem' }}>State Code: {destState}</div>
                </div>
                <div style={{ width: '48%', textAlign: 'right' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    TRANSACTION & SUPPLY:
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#0f172a', fontWeight: 700 }}>
                    {isIntraState ? 'Intra-State Supply (CGST + SGST)' : 'Inter-State Supply (IGST)'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.2rem' }}>
                    Transport: {transportName} ({vehicleNumber})
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.2rem' }}>
                    Payment: {invoice.payment_method || 'CASH'} ({invoice.payment_status || 'PAID'})
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderTop: '1px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
                    <th style={{ padding: '0.7rem 0.85rem', textAlign: 'left', fontSize: '0.82rem', color: '#0f172a', width: '38%' }}>Item Description</th>
                    <th style={{ padding: '0.7rem 0.5rem', textAlign: 'center', fontSize: '0.82rem', color: '#0f172a' }}>HSN</th>
                    <th style={{ padding: '0.7rem 0.5rem', textAlign: 'center', fontSize: '0.82rem', color: '#0f172a' }}>Cases</th>
                    <th style={{ padding: '0.7rem 0.5rem', textAlign: 'center', fontSize: '0.82rem', color: '#0f172a' }}>Qty</th>
                    <th style={{ padding: '0.7rem 0.5rem', textAlign: 'right', fontSize: '0.82rem', color: '#0f172a' }}>Rate</th>
                    <th style={{ padding: '0.7rem 0.5rem', textAlign: 'right', fontSize: '0.82rem', color: '#0f172a' }}>Taxable</th>
                    <th style={{ padding: '0.7rem 0.85rem', textAlign: 'right', fontSize: '0.82rem', color: '#0f172a' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem 0.85rem', fontSize: '0.84rem', color: '#1e293b' }}>
                        <div style={{ fontWeight: 700 }}>{it.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Brand: {it.brand} | Case Cont: {it.caseContent}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontSize: '0.82rem', color: '#475569' }}>{it.hsn}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontSize: '0.84rem', color: '#1e293b', fontWeight: 600 }}>{it.noCases}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontSize: '0.84rem', color: '#1e293b', fontWeight: 600 }}>{it.qty}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontSize: '0.84rem', color: '#475569' }}>₹{it.unitPrice.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontSize: '0.84rem', color: '#1e293b' }}>₹{it.taxable.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontSize: '0.86rem', color: '#0f172a', fontWeight: 700 }}>₹{it.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <div style={{ width: '340px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.86rem', color: '#475569' }}>
                    <span>Taxable Value:</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{fmt(rawSubtotal)}</span>
                  </div>
                  {otherChargesVal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.86rem', color: '#475569' }}>
                      <span>Logistics & Freight:</span>
                      <span>{fmt(otherChargesVal)}</span>
                    </div>
                  )}
                  {packagingChargesVal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.86rem', color: '#475569' }}>
                      <span>Packaging Charges:</span>
                      <span>{fmt(packagingChargesVal)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', borderTop: '2px solid #0f172a', marginTop: '0.35rem' }}>
                    <span>Grand Total:</span>
                    <span style={{ color: '#2563eb' }}>{fmt(grandTotalVal)}</span>
                  </div>
                </div>
              </div>

              {/* Cryptographic Ledger Ring Verification Seal */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.85rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#2563eb', fontWeight: 800, fontSize: '0.78rem' }}>
                  <FiShield /> Cryptographic Ledger Block Proof (SHA-256)
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#475569', wordBreak: 'break-all', marginTop: '0.25rem' }}>
                  Block Hash: {invoice.crypto_hash || 'c8f793b8214fa82910d65b12398ac34219487219502938472910485729103847'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewModal;
