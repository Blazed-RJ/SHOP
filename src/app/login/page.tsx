'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
    <div className="min-h-screen bg-[#0e0d12] flex items-center justify-center p-4 font-sans antialiased text-white">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-3xl font-black text-black mx-auto mb-4 shadow-xl shadow-amber-500/20">
            B
          </div>
          <h1 className="text-2xl font-bold">Blazed ERP</h1>
          <p className="text-[#8a8695] text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Main Card */}
        <div className="bg-[#1a1920] border border-[#2a2836] rounded-3xl p-8 shadow-2xl">
          
          {/* Tabs */}
          <div className="flex bg-[#0e0d12] p-1 rounded-xl mb-6">
            <button
              onClick={() => { setTab('email'); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === 'email' ? 'bg-[#2a2836] text-white shadow' : 'text-[#8a8695] hover:text-white'}`}
            >
              Email
            </button>
            <button
              onClick={() => { setTab('phone'); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === 'phone' ? 'bg-[#2a2836] text-white shadow' : 'text-[#8a8695] hover:text-white'}`}
            >
              Phone OTP
            </button>
          </div>

          {/* Form */}
          {tab === 'email' ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#8a8695] uppercase tracking-wider mb-2">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@blazed.local"
                  className="w-full bg-[#0e0d12] border border-[#2a2836] rounded-xl px-4 py-3 text-white placeholder:text-[#5a5668] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8a8695] uppercase tracking-wider mb-2">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  className="w-full bg-[#0e0d12] border border-[#2a2836] rounded-xl px-4 py-3 text-white placeholder:text-[#5a5668] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl transition-colors mt-2">
                {loading ? 'Signing in...' : 'Sign In with Email'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePhoneLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#8a8695] uppercase tracking-wider mb-2">Phone Number</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} disabled={otpSent} required placeholder="9876543210"
                  className="w-full bg-[#0e0d12] border border-[#2a2836] rounded-xl px-4 py-3 text-white placeholder:text-[#5a5668] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all disabled:opacity-50"
                />
              </div>
              {otpSent && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-[#8a8695] uppercase tracking-wider">6-Digit OTP</label>
                    <button type="button" onClick={() => setOtpSent(false)} className="text-[10px] text-amber-500 font-bold hover:underline">CHANGE PHONE</button>
                  </div>
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required placeholder="123456" maxLength={6}
                    className="w-full bg-[#0e0d12] border border-[#2a2836] rounded-xl px-4 py-3 text-white text-center tracking-[0.5em] text-lg placeholder:text-[#5a5668] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
              )}
              <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl transition-colors mt-2">
                {loading ? 'Please wait...' : (otpSent ? 'Verify OTP & Login' : 'Send OTP')}
              </button>
            </form>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-500 text-sm text-center font-medium">
              {error}
            </div>
          )}

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px bg-[#2a2836] flex-1"></div>
            <span className="text-[#5a5668] text-xs font-semibold uppercase">Or continue with</span>
            <div className="h-px bg-[#2a2836] flex-1"></div>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>

        {/* Info */}
        <div className="mt-8 text-center text-[#5a5668] text-xs">
          <p>Role Permissions</p>
          <div className="flex justify-center gap-4 mt-2">
            <span>👑 <strong className="text-[#8a8695]">Admin:</strong> Full Access</span>
            <span>🛒 <strong className="text-[#8a8695]">Cashier:</strong> POS Only</span>
          </div>
        </div>
      </div>
    </div>
  );
}

