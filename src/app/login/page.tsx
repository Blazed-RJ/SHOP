'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Mail, Phone, Lock, ChevronRight, Fingerprint } from 'lucide-react';

export default function LoginPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [tab, setTab] = useState<'email' | 'phone'>('email');
  
  // Forms
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  
  // State
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => setIsMounted(true), 0);
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');

    const res = await signIn('credentials', { email, password, redirect: false });
    
    if (res?.ok) {
      router.push('/');
      router.refresh();
    } else {
      setError('Invalid email or password');
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      setError('Enter a valid phone number');
      return;
    }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) return handleSendOtp();
    
    setLoading(true); setError('');
    const res = await signIn('phone-otp', { phone, otp, redirect: false });
    
    if (res?.ok) {
      router.push('/');
      router.refresh();
    } else {
      setError('Invalid or expired OTP');
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    signIn('google', { callbackUrl: '/' });
  };

  if (!isMounted) return null; // Avoid hydration mismatch for animations

  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center relative overflow-hidden font-sans antialiased text-white selection:bg-amber-500/30">
      
      {/* Animated Abstract Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[10%] left-[20%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-amber-600/10 rounded-full blur-[100px] md:blur-[160px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-slate-800/20 rounded-full blur-[120px] md:blur-[180px] animate-[pulse_10s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-[40%] right-[30%] w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-orange-600/5 rounded-full blur-[80px] md:blur-[140px]" />
        
        {/* Fine Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.015] mix-blend-screen pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      </div>
      
      {/* Main Centered Floating Glass Portal */}
      <div 
        className="relative z-10 w-[92%] sm:w-full max-w-[480px] p-6 sm:p-8 md:p-12 mx-auto"
        style={{ transform: `translateY(${isMounted ? '0' : '20px'})`, opacity: isMounted ? 1 : 0, transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        
        {/* Glowing Border Wrap */}
        <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-white/10 to-transparent p-[1px] shadow-2xl overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-tr before:from-amber-600/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-700">
          <div className="absolute inset-0 rounded-[2.5rem] bg-[#0a0a0a]/60 backdrop-blur-3xl" />
        </div>

        <div className="relative z-20 flex flex-col pt-4">
          
          {/* Brand Header */}
          <div className="text-center mb-10">
            <div className="group mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-2xl font-black text-black shadow-[0_0_40px_rgba(245,158,11,0.2)] mb-6 transition-transform duration-500 hover:scale-105 hover:shadow-[0_0_60px_rgba(245,158,11,0.3)]">
              N
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white/90">
              Welcome back
            </h1>
            <p className="text-[#737373] text-sm mt-2 font-medium">Log in to your Neevbill access node.</p>
          </div>

          {/* Premium Tab Bar */}
          <div className="relative flex bg-[#141414] p-1.5 rounded-2xl mb-8 border border-white/[0.03] shadow-inner">
            <button
              onClick={() => { setTab('email'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all duration-500 ${tab === 'email' ? 'bg-[#222222] text-white shadow-md shadow-black/50 border border-white/[0.06] scale-100' : 'text-[#737373] hover:text-white hover:bg-white/[0.02] scale-[0.98]'}`}
            >
              <Mail size={16} className={tab === 'email' ? 'text-amber-500' : ''} /> 
              Email
            </button>
            <button
              onClick={() => { setTab('phone'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all duration-500 ${tab === 'phone' ? 'bg-[#222222] text-white shadow-md shadow-black/50 border border-white/[0.06] scale-100' : 'text-[#737373] hover:text-white hover:bg-white/[0.02] scale-[0.98]'}`}
            >
              <Phone size={16} className={tab === 'phone' ? 'text-amber-500' : ''} /> 
              Phone OTP
            </button>
          </div>

          {/* Dynamic Forms */}
          <div className="min-h-[220px]">
            {tab === 'email' ? (
              <form onSubmit={handleEmailLogin} className="space-y-5 animate-[fadeIn_0.5s_ease-out]">
                <style jsx>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#525252] group-focus-within:text-amber-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email Address"
                    className="w-full bg-[#121212] border border-white/[0.06] rounded-xl pl-14 sm:pl-12 pr-4 py-4 text-white text-sm placeholder:text-[#525252] focus:outline-none focus:border-amber-500/50 focus:bg-[#1a1a1a] transition-all"
                  />
                </div>
                
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#525252] group-focus-within:text-amber-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Password"
                    className="w-full bg-[#121212] border border-white/[0.06] rounded-xl pl-14 sm:pl-12 pr-4 py-4 text-white text-sm tracking-widest placeholder:tracking-normal placeholder:text-[#525252] focus:outline-none focus:border-amber-500/50 focus:bg-[#1a1a1a] transition-all"
                  />
                </div>
                
                <button type="submit" disabled={loading} className="group relative w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 disabled:opacity-50 text-black py-4 rounded-xl transition-all shadow-lg shadow-white/5 mt-6 font-bold text-sm overflow-hidden">
                  <span className="relative z-10">{loading ? 'Authenticating...' : 'Sign In Node'}</span>
                  {!loading && <ChevronRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />}
                  <div className="absolute inset-0 h-full w-full object-cover opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,1)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_2s_infinite]" />
                </button>
              </form>
            ) : (
              <form onSubmit={handlePhoneLogin} className="space-y-5 animate-[fadeIn_0.5s_ease-out]">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#525252] group-focus-within:text-amber-500 transition-colors">
                    <Phone size={18} />
                  </div>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} disabled={otpSent} required placeholder="Phone Number"
                    className="w-full bg-[#121212] border border-white/[0.06] rounded-xl pl-14 sm:pl-12 pr-4 py-4 text-white text-sm placeholder:text-[#525252] focus:outline-none focus:border-amber-500/50 focus:bg-[#1a1a1a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                
                {otpSent && (
                  <div className="space-y-2 animate-[fadeIn_0.5s_ease-out]">
                    <div className="flex justify-between items-end px-1">
                      <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">Verification Code</span>
                      <button type="button" onClick={() => setOtpSent(false)} className="text-[11px] text-amber-500 font-bold hover:text-amber-400 transition-colors">Change Number</button>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-amber-500/50 group-focus-within:text-amber-500 transition-colors">
                        <Fingerprint size={18} />
                      </div>
                      <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required placeholder="••••••" maxLength={6}
                        className="w-full bg-amber-500/5 border border-amber-500/30 rounded-xl pl-12 pr-4 py-4 text-amber-500 text-xl tracking-[0.5em] font-medium placeholder:text-amber-500/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-[0_0_20px_rgba(245,158,11,0.05)]"
                      />
                    </div>
                  </div>
                )}
                
                <button type="submit" disabled={loading} className="group relative w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 disabled:opacity-50 text-black py-4 rounded-xl transition-all shadow-lg shadow-white/5 mt-6 font-bold text-sm overflow-hidden">
                  <span className="relative z-10">{loading ? 'Processing...' : (otpSent ? 'Verify Protocol' : 'Request Security Code')}</span>
                  {!loading && <ChevronRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-semibold text-center animate-[fadeIn_0.3s_ease-out]">
              {error}
            </div>
          )}

          {/* Separation Divider */}
          <div className="mt-8 mb-6 flex items-center gap-4 px-2">
            <div className="h-[1px] bg-gradient-to-r from-transparent to-white/10 flex-1"></div>
            <span className="text-[#525252] text-[10px] font-bold uppercase tracking-widest">Enterprise Access</span>
            <div className="h-[1px] bg-gradient-to-l from-transparent to-white/10 flex-1"></div>
          </div>

          {/* Social Auto-login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-transparent hover:bg-white/[0.03] border border-white/[0.08] hover:border-white/20 text-[#a3a3a3] hover:text-white font-semibold py-4 rounded-xl transition-all duration-300 disabled:opacity-50 text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google Workspace
          </button>
          
        </div>
      </div>
    </div>
  );
}

