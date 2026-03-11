'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Mail, Phone, Lock, ChevronRight, Fingerprint, Activity, Zap } from 'lucide-react';

export default function LoginPage() {
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

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center relative overflow-hidden font-sans antialiased text-white p-4">
      {/* Ambient Glowing Orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-amber-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-[1050px] bg-[#0a0a0a]/80 border border-white/[0.08] shadow-2xl rounded-[2rem] overflow-hidden backdrop-blur-2xl flex flex-col md:flex-row min-h-[650px] transform transition-all">
        
        {/* Left Branding / Abstract Visual */}
        <div className="hidden md:flex w-[45%] relative bg-gradient-to-br from-[#120f0a] to-[#0a0a0a] p-12 flex-col justify-between border-r border-white/[0.04]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>
          
          <div className="relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-2xl font-black text-[#030303] shadow-lg shadow-amber-500/20 mb-8">
              B
            </div>
            <h1 className="text-4xl font-semibold tracking-tight leading-tight text-white mb-4">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Blazed ERP</span>
            </h1>
            <p className="text-[#8a8695] leading-relaxed max-w-sm text-lg">
              The next-generation retail intelligence platform. Secure, instantaneous, and built for scale.
            </p>
          </div>

          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-500"><Zap size={20} /></div>
              <div>
                <h4 className="text-sm font-semibold text-white">Lightning Fast</h4>
                <p className="text-xs text-[#8a8695] mt-0.5">Optimized edge architecture</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-500"><Activity size={20} /></div>
              <div>
                <h4 className="text-sm font-semibold text-white">Live Analytics</h4>
                <p className="text-xs text-[#8a8695] mt-0.5">Real-time business insights</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Area */}
        <div className="w-full md:w-[55%] p-8 md:p-14 flex flex-col justify-center relative bg-[#0a0a0a]">
          <div className="max-w-[400px] w-full mx-auto">
            
            <div className="md:hidden mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-xl font-black text-[#030303] shadow-lg shadow-amber-500/20 mb-4">B</div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">Blazed ERP</h2>
            </div>
            
            <h2 className="text-2xl font-medium tracking-tight text-white mb-2">Access Portal</h2>
            <p className="text-[#8a8695] text-sm mb-8">Choose your preferred login method to continue.</p>

            {/* Premium Tabs */}
            <div className="flex bg-[#121212] p-1.5 rounded-2xl mb-8 border border-white/[0.04] shadow-inner">
              <button
                onClick={() => { setTab('email'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${tab === 'email' ? 'bg-[#222222] text-white shadow-md border border-white/[0.05]' : 'text-[#8a8695] hover:text-white hover:bg-white/[0.02]'}`}
              >
                <Mail size={16} /> Email
              </button>
              <button
                onClick={() => { setTab('phone'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${tab === 'phone' ? 'bg-[#222222] text-white shadow-md border border-white/[0.05]' : 'text-[#8a8695] hover:text-white hover:bg-white/[0.02]'}`}
              >
                <Phone size={16} /> Phone OTP
              </button>
            </div>

            {/* Form */}
            {tab === 'email' ? (
              <form onSubmit={handleEmailLogin} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8a8695] uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#5a5668]"><Mail size={18} /></div>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@blazed.local"
                      className="w-full bg-[#121212] border border-white/[0.06] rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-[#5a5668] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all hover:border-white/[0.1] shadow-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8a8695] uppercase tracking-wider ml-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#5a5668]"><Lock size={18} /></div>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                      className="w-full bg-[#121212] border border-white/[0.06] rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-[#5a5668] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all hover:border-white/[0.1] shadow-sm"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-black font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 mt-4 active:scale-[0.98]">
                  {loading ? 'Authenticating...' : 'Sign In'}
                  {!loading && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePhoneLogin} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8a8695] uppercase tracking-wider ml-1">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#5a5668]"><Phone size={18} /></div>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} disabled={otpSent} required placeholder="9876543210"
                      className="w-full bg-[#121212] border border-white/[0.06] rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-[#5a5668] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all hover:border-white/[0.1] shadow-sm disabled:opacity-50"
                    />
                  </div>
                </div>
                {otpSent && (
                  <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[11px] font-bold text-[#8a8695] uppercase tracking-wider">6-Digit Code</label>
                      <button type="button" onClick={() => setOtpSent(false)} className="text-[10px] text-amber-500 font-semibold hover:text-amber-400 transition-colors">Edit number</button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#5a5668]"><Fingerprint size={18} /></div>
                      <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required placeholder="123456" maxLength={6}
                        className="w-full bg-[#121212] border border-amber-500/30 rounded-xl pl-11 pr-4 py-3.5 text-white text-lg tracking-[0.5em] font-medium placeholder:text-[#5a5668]/50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                      />
                    </div>
                  </div>
                )}
                <button type="submit" disabled={loading} className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-black font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 mt-4 active:scale-[0.98]">
                  {loading ? 'Please wait...' : (otpSent ? 'Verify & Login' : 'Send One-Time Code')}
                  {!loading && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>
            )}

            {error && (
              <div className="mt-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium animate-in fade-in zoom-in-95 duration-300">
                {error}
              </div>
            )}

            {/* Divider */}
            <div className="mt-10 mb-6 flex items-center gap-4">
              <div className="h-px bg-gradient-to-r from-transparent to-white/[0.08] flex-1"></div>
              <span className="text-[#5a5668] text-[10px] font-bold uppercase tracking-wider">Enterprise Single Sign-On</span>
              <div className="h-px bg-gradient-to-l from-transparent to-white/[0.08] flex-1"></div>
            </div>

            {/* Google Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.1] text-white font-medium py-3.5 rounded-xl transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google Workspace
            </button>
            
          </div>
        </div>
      </div>
    </div>
  );
}

