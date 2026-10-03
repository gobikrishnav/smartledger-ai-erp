import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, Plus, Minus, X } from 'lucide-react';
import { getProducts } from '../api/inventory';
import { createInvoice } from '../api/pos';
import { usePOSStore } from '../stores/posStore';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';

export default function CashierPOS() {
  const { data: products, isLoading } = useQuery({ queryKey: ['products'], queryFn: () => getProducts() });
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { cart, addItem, updateQuantity, removeItem, getTotals, clearCart } = usePOSStore();
  const { subtotal, totalCGST, totalSGST, grandTotal } = getTotals();
  
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);

  const checkoutMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: (data) => {
      setLastInvoice(data);
      setShowReceipt(true);
      clearCart();
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredProducts = products?.filter(p => 
    p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku_code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleCheckout = () => {
    if (cart.length === 0) return;
    checkoutMutation.mutate({
      items: cart.map(c => ({
        product_id: c.product.product_id,
        quantity: c.quantity,
        unit_price: c.unit_price,
        cgst_amount: c.cgst_amount,
        sgst_amount: c.sgst_amount,
        line_total: c.line_total
      })),
      payment_mode: paymentMode
    });
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* LEFT PANEL */}
      <div className="w-[65%] flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-black" size={20} />
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Search products (Press / to focus)"
            className="w-full border border-gray-400 pl-10 pr-4 py-3 bg-white text-black placeholder-gray-500 focus:outline-none focus:border-black"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-gray-200 animate-pulse border border-gray-300 rounded"></div>)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <p className="text-gray-500 italic text-center py-8">No products found</p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <div 
                  key={product.product_id}
                  onClick={() => addItem(product)}
                  className="bg-white border border-gray-300 p-4 rounded cursor-pointer hover:bg-gray-50 transition flex flex-col justify-between h-32"
                >
                  <div>
                    <h3 className="font-bold text-black leading-tight line-clamp-2">{product.product_name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{product.sku_code}</p>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <span className="font-semibold text-black">₹{product.base_price.toFixed(2)}</span>
                    {product.stock_quantity > product.reorder_level ? (
                      <span className="bg-black text-white px-2 py-0.5 text-[10px] rounded font-bold">IN STOCK</span>
                    ) : (
                      <span className="bg-gray-300 text-black px-2 py-0.5 text-[10px] rounded font-bold">LOW STOCK</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - CART */}
      <div className="w-[35%] bg-[#f9f9f9] border border-gray-300 rounded flex flex-col">
        <div className="p-4 border-b border-gray-300">
          <h2 className="text-xl font-bold text-black flex justify-between items-center">
            Cart <span className="bg-black text-white text-sm px-2.5 py-0.5 rounded-full">{cart.length}</span>
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 && <p className="text-gray-500 italic text-center py-8">Cart is empty</p>}
          {cart.map(item => (
            <div key={item.product.product_id} className="flex justify-between items-center border-b border-gray-200 pb-3">
              <div className="flex-1">
                <p className="font-bold text-black text-sm">{item.product.product_name}</p>
                <p className="text-xs text-gray-500">₹{item.unit_price.toFixed(2)} / unit</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-black rounded bg-white">
                  <button onClick={() => updateQuantity(item.product.product_id, item.quantity - 1)} className="px-2 py-1 text-black hover:bg-gray-200"><Minus size={14} /></button>
                  <span className="px-2 font-medium text-sm text-black">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.product_id, item.quantity + 1)} className="px-2 py-1 text-black hover:bg-gray-200"><Plus size={14} /></button>
                </div>
                <div className="font-bold text-black w-20 text-right">₹{item.line_total.toFixed(2)}</div>
                <button onClick={() => removeItem(item.product.product_id)} className="text-gray-500 hover:text-black">
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-white border-t border-gray-300">
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="text-black font-medium">₹{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">CGST (9%)</span><span className="text-black font-medium">₹{totalCGST.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">SGST (9%)</span><span className="text-black font-medium">₹{totalSGST.toFixed(2)}</span></div>
            <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between items-center">
              <span className="text-xl font-bold text-black">GRAND TOTAL</span>
              <span className="text-2xl font-bold text-black">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            {['CASH', 'CARD', 'UPI', 'SPLIT'].map(mode => (
              <button
                key={mode}
                onClick={() => setPaymentMode(mode)}
                className={`flex-1 py-2 text-xs font-bold border ${paymentMode === mode ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-400 hover:bg-gray-100'}`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkoutMutation.isPending}
            className="w-full bg-black text-white font-bold py-4 text-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex justify-center"
          >
            {checkoutMutation.isPending ? <LoadingSpinner size="sm" /> : 'PROCESS PAYMENT'}
          </button>
        </div>
      </div>

      <Modal isOpen={showReceipt} onClose={() => setShowReceipt(false)} title="Receipt">
        {lastInvoice && (
          <div className="text-black">
            <h2 className="text-2xl font-bold text-center mb-4">INVOICE</h2>
            <div className="text-sm mb-4">
              <p>Invoice #: {lastInvoice.invoice_number}</p>
              <p>Date: {new Date(lastInvoice.invoice_date).toLocaleString()}</p>
              <p>Payment: {lastInvoice.payment_mode}</p>
            </div>
            <table className="w-full text-sm mb-4 border-t border-b border-black">
              <thead>
                <tr className="border-b border-gray-300"><th className="text-left py-2">Item</th><th className="text-right">Qty</th><th className="text-right">Total</th></tr>
              </thead>
              <tbody>
                {lastInvoice.items?.map((item: any, i: number) => (
                  <tr key={i}><td className="py-1">{item.product_name}</td><td className="text-right">{item.quantity}</td><td className="text-right">₹{item.line_total.toFixed(2)}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="text-right font-bold text-lg mb-6">Total: ₹{lastInvoice.grand_total.toFixed(2)}</div>
            <div className="flex justify-end gap-2">
              <button className="border border-black px-4 py-2 hover:bg-gray-100 font-bold" onClick={() => setShowReceipt(false)}>PRINT</button>
              <button className="bg-black text-white px-4 py-2 font-bold hover:bg-gray-800" onClick={() => setShowReceipt(false)}>DONE</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
