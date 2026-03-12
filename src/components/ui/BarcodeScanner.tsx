'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface BarcodeScannerProps {
  onDetected: (value: string) => void;
  onClose: () => void;
  hint?: string;
}

export default function BarcodeScanner({ onDetected, onClose, hint = 'Point camera at barcode or QR code' }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [manualEntry, setManualEntry] = useState('');
  const [supported, setSupported] = useState(true);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const handleDetected = useCallback((value: string) => {
    stopCamera();
    onDetected(value);
  }, [stopCamera, onDetected]);

  useEffect(() => {
    // Check BarcodeDetector support
    if (!('BarcodeDetector' in window)) {
      setSupported(false);
      return;
    }

    let active = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; }
        setScanning(true);

        // @ts-expect-error BarcodeDetector not in TS lib yet
        const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'qr_code', 'code_128', 'code_39', 'upc_a', 'upc_e', 'itf'] });

        const detect = async () => {
          if (!active || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              handleDetected(codes[0].rawValue);
              return;
            }
          } catch { /* ignore */ }
          if (active) requestAnimationFrame(detect);
        };

        videoRef.current?.addEventListener('loadedmetadata', () => requestAnimationFrame(detect), { once: true });
      } catch (err) {
        setError('Camera access denied. Use manual entry below.');
      }
    };

    startCamera();
    return () => { active = false; stopCamera(); };
  }, [stopCamera, handleDetected]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1a1920] border border-[#2a2836] rounded-2xl p-5 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-bold text-white">📷 Barcode Scanner</div>
            <div className="text-xs text-[#8a8695]">{hint}</div>
          </div>
          <button onClick={onClose} className="text-[#8a8695] hover:text-white p-1">✕</button>
        </div>

        {supported && !error ? (
          <div className="relative bg-black rounded-xl overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {/* Scan guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-32 border-2 border-amber-400 rounded-lg" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)' }}>
                <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-amber-400 rounded-tl" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-amber-400 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-amber-400 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-amber-400 rounded-br" />
              </div>
            </div>
            {scanning && (
              <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-amber-400 font-semibold animate-pulse">
                Scanning...
              </div>
            )}
          </div>
        ) : (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-xs text-orange-300 mb-4">
            {error || 'Barcode scanner not supported in this browser. Use Chrome on Android for best results.'}
          </div>
        )}

        {/* Manual entry fallback */}
        <div className="space-y-2">
          <div className="text-xs text-[#8a8695] font-medium">Or enter manually:</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualEntry}
              onChange={e => setManualEntry(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && manualEntry && handleDetected(manualEntry)}
              placeholder="SKU / Barcode / QR value"
              className="flex-1 bg-black/30 border border-[#2a2836] rounded-xl px-3 py-2 text-sm text-white placeholder:text-[#5a5668] focus:outline-none focus:border-amber-500/50"
              autoFocus={!supported || !!error}
            />
            <button
              onClick={() => manualEntry && handleDetected(manualEntry)}
              className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold px-4 rounded-xl transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
