'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface UserInfo {
  name: string | null;
  email: string | null;
  phone: string | null;
  image: string | null;
}

export default function DigitalCardClient({ user }: { user: UserInfo }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [shopName, setShopName] = useState(user.name || 'My Shop');
  const [tagline, setTagline] = useState('Quality Products & Service');
  const [address, setAddress] = useState('');
  const [upiId, setUpiId] = useState('');
  const [website, setWebsite] = useState('');
  const [copied, setCopied] = useState(false);

  const cardUrl = typeof window !== 'undefined' ? window.location.href : '';
  const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${shopName}\nTEL:${user.phone || ''}\nEMAIL:${user.email || ''}\nADR:;;${address};;;;\nURL:${website}\nEND:VCARD`;

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, vcard, { width: 120, margin: 1, color: { dark: '#000', light: '#fff' } });
  }, [vcard]);

  const copyLink = () => {
    navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadVCard = () => {
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${shopName.replace(/\s/g, '_')}.vcf`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-[#1e1d24] pb-4">
        <h1 className="text-2xl font-bold text-white">Digital Visiting Card</h1>
        <p className="text-[#8a8695] text-sm mt-0.5">Share your shop details digitally — generate a vCard or QR code</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white">Customize Your Card</h3>
          {[
            { label: 'Shop Name', val: shopName, set: setShopName, placeholder: 'e.g. Rajan Electronics' },
            { label: 'Tagline', val: tagline, set: setTagline, placeholder: 'e.g. Best prices in town' },
            { label: 'Address', val: address, set: setAddress, placeholder: 'Full address' },
            { label: 'UPI ID', val: upiId, set: setUpiId, placeholder: 'yourshop@upi' },
            { label: 'Website', val: website, set: setWebsite, placeholder: 'https://yourshop.com' },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-[10px] font-bold text-[#8a8695] uppercase tracking-wider mb-1">{f.label}</label>
              <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                className="w-full bg-black/30 border border-[#2a2836] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#5a5668] focus:outline-none focus:border-amber-500/50" />
            </div>
          ))}
          {user.phone && <div className="text-xs text-[#8a8695] bg-black/20 rounded-xl p-3">📱 Phone: <span className="text-white font-mono">{user.phone}</span></div>}
          {user.email && <div className="text-xs text-[#8a8695] bg-black/20 rounded-xl p-3">📧 Email: <span className="text-white">{user.email}</span></div>}
        </div>

        {/* Preview */}
        <div>
          <h3 className="text-sm font-bold text-white mb-4">Preview</h3>
          <div ref={cardRef} className="bg-gradient-to-br from-[#1a1920] to-black border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute top-[-30px] right-[-30px] w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />

            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xl font-black text-white">{shopName}</div>
                <div className="text-xs text-amber-400 mt-0.5 font-medium">{tagline}</div>
              </div>
              <div className="bg-white p-1.5 rounded-lg">
                <canvas ref={canvasRef} width={120} height={120} />
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-[#8a8695]">
              {user.phone && <div className="flex items-center gap-2"><span>📱</span><span className="text-white font-mono">{user.phone}</span></div>}
              {user.email && <div className="flex items-center gap-2"><span>📧</span><span className="text-white">{user.email}</span></div>}
              {address && <div className="flex items-center gap-2"><span>📍</span><span className="text-white">{address}</span></div>}
              {upiId && <div className="flex items-center gap-2"><span>💳</span><span className="text-amber-400 font-mono">{upiId}</span></div>}
              {website && <div className="flex items-center gap-2"><span>🌐</span><span className="text-blue-400">{website}</span></div>}
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 text-[9px] text-[#5a5668] tracking-wider uppercase">
              Powered by Neevbill
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={downloadVCard} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold py-2.5 rounded-xl transition-colors text-center">
              ⬇ Download vCard
            </button>
            <button onClick={copyLink} className="flex-1 bg-white/10 hover:bg-white/20 text-white text-sm font-bold py-2.5 rounded-xl transition-colors">
              {copied ? '✓ Copied!' : '🔗 Share Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
