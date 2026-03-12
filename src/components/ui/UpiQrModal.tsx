'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface UpiQrModalProps {
  amount: number; // in rupees (decimal)
  invoiceNumber: string;
  shopName?: string;
  upiId?: string; // e.g. shopowner@upi
  onClose: () => void;
}

export default function UpiQrModal({ amount, invoiceNumber, shopName = 'Neevbill Shop', upiId, onClose }: UpiQrModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copyNote, setCopyNote] = useState('');

  const upiLink = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(shopName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Inv ' + invoiceNumber)}`
    : null;

  useEffect(() => {
    if (!canvasRef.current) return;
    const content = upiLink || `Pay ₹${amount.toFixed(2)} for Invoice ${invoiceNumber}`;
    QRCode.toCanvas(canvasRef.current, content, {
      width: 240,
      margin: 2,
      color: { dark: '#111', light: '#fff' },
    });
  }, [upiLink, amount, invoiceNumber]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `upi-qr-${invoiceNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopyUpi = () => {
    if (upiId) {
      navigator.clipboard.writeText(upiId);
      setCopyNote('Copied!');
      setTimeout(() => setCopyNote(''), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1a1920] border border-[#2a2836] rounded-2xl p-6 max-w-xs w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-4">
          <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">UPI Payment QR</div>
          <div className="text-2xl font-black text-white">₹{amount.toFixed(2)}</div>
          <div className="text-xs text-[#8a8695] mt-0.5">Invoice #{invoiceNumber}</div>
        </div>

        <div className="flex justify-center mb-4">
          <div className="bg-white p-3 rounded-xl">
            <canvas ref={canvasRef} />
          </div>
        </div>

        {upiId ? (
          <div className="text-center mb-4">
            <div className="text-xs text-[#8a8695] mb-1">UPI ID</div>
            <button
              onClick={handleCopyUpi}
              className="font-mono text-sm text-amber-400 bg-black/30 px-3 py-1 rounded-lg border border-amber-500/20 hover:border-amber-500/60 transition-all"
            >
              {upiId} {copyNote ? `✓ ${copyNote}` : '⧉'}
            </button>
          </div>
        ) : (
          <div className="text-xs text-[#8a8695] text-center mb-4">
            Add your UPI ID in Settings to enable smart payment links
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold py-2.5 rounded-xl transition-colors"
          >
            ⬇ Download QR
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-[#8a8695] hover:text-white bg-white/5 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
