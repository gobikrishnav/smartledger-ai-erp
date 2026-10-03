import React, { useState, useEffect, useRef } from 'react';
import { X, Barcode, Zap, Check } from 'lucide-react';

const PRESET_BARCODES = [
  { barcode: '8901001001', name: 'Industrial Solar Core Inverter 5kW', price: 45000, category: 'Solar' },
  { barcode: '8901001002', name: 'Copper MC4 PV Cable 50m Drum', price: 4200, category: 'Solar' },
  { barcode: '8901001003', name: 'Monocrystalline Solar Panel 550W', price: 16500, category: 'Solar' },
  { barcode: '8901001004', name: 'Lithium Iron LiFePO4 Battery 48V', price: 78000, category: 'Storage' },
  { barcode: '8901001005', name: 'DC Surge Protection Breaker 1000V', price: 1850, category: 'Switchgear' },
  { barcode: '8901001006', name: 'Solar Crimping Tool Set Pro', price: 3200, category: 'Tools' },
  { barcode: '8901001007', name: 'Optical Patch Cord Single-Mode 10m', price: 850, category: 'Telecom' },
  { barcode: '8901001008', name: 'Dual-Band Gigabit Industrial Router', price: 9400, category: 'Telecom' }
];

const BarcodeScannerModal = ({ isOpen, onClose, onScanProduct }) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedFeedback, setScannedFeedback] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    triggerScan(barcodeInput.trim());
  };

  const triggerScan = (code) => {
    playBeep();
    setScannedFeedback(code);
    onScanProduct(code);
    setBarcodeInput('');
    setTimeout(() => {
      setScannedFeedback(null);
    }, 1200);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(6px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff',
        borderRadius: 22,
        padding: '2rem',
        maxWidth: 540,
        width: '100%',
        boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.12)',
        border: '1px solid #eef2f6'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: '#eff6ff',
              border: '1px solid #dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb'
            }}>
              <Barcode size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>
                High-Speed Barcode / SKU Scanner
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                Hardware Gun emulation &amp; 1-click test barcodes
              </p>
            </div>
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

        {/* Input for Barcode Guns */}
        <form onSubmit={handleManualSubmit} style={{ marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Scan or type barcode (e.g. 8901001001)..."
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                fontSize: '1rem',
                padding: '0.85rem 1.25rem',
                borderRadius: 12,
                background: '#ffffff',
                border: '2px solid #2563eb',
                color: '#0f172a',
                fontWeight: 700,
                letterSpacing: '0.05em',
                outline: 'none',
                boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.12)'
              }}
            />
          </div>
        </form>

        {/* Laser Animation Bar */}
        <div style={{
          height: 3,
          background: 'linear-gradient(90deg, transparent, #2563eb, #38bdf8, transparent)',
          marginBottom: '1.5rem',
          borderRadius: 2,
          boxShadow: '0 0 8px rgba(37, 99, 235, 0.4)'
        }} />

        {/* Preset Quick Scan Buttons */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            1-Click Preset Barcodes
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', maxHeight: '240px', overflowY: 'auto' }}>
            {PRESET_BARCODES.map(item => (
              <button
                key={item.barcode}
                type="button"
                onClick={() => triggerScan(item.barcode)}
                style={{
                  textAlign: 'left',
                  padding: '0.75rem',
                  borderRadius: 12,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                  <span style={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 600 }}>{item.barcode}</span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>₹{item.price.toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {scannedFeedback && (
          <div style={{
            marginTop: '1.25rem',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 12,
            padding: '0.65rem 1rem',
            color: '#065f46',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 700
          }}>
            <Check size={16} /> Barcode '{scannedFeedback}' successfully injected into POS cart!
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeScannerModal;
