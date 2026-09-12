'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState('a.rivera@acme-infra.internal');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    await login(email, password);
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    demoLogin('sre');
  };

  return (
    <div className="min-h-screen bg-white text-[#0f172a] flex items-center justify-center p-4 sm:p-6 lg:p-12 select-none">
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          
          {/* Left Column: Striking 3D Holographic Artwork */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[460px] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/80 border border-slate-100 bg-slate-900 group">
              <img
                src="/login-art.jpg"
                alt="PULSE60 Holographic Core Sculpture"
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Right Column: Clean Modern Sign-In Form */}
          <div className="flex justify-center lg:justify-start">
            <div className="w-full max-w-[400px] px-2 sm:px-6 py-4">
              
              {/* Heading */}
              <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] font-display tracking-tight">
                  Sign in
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 font-sans">
                  Welcome back! Please sign in to continue
                </p>
              </div>

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-3.5 px-5 rounded-full bg-[#f1f3f6] hover:bg-[#e5e8ed] active:scale-[0.99] transition-all flex items-center justify-center gap-3 text-slate-700 font-semibold text-sm shadow-sm cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Google</span>
              </button>

              {/* Divider */}
              <div className="relative my-7 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative bg-white px-4 text-xs text-slate-400 font-sans">
                  or sign in with email
                </span>
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handleManualLogin} className="space-y-4">
                {/* Email input */}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email id"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-full border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5c67f2] focus:ring-2 focus:ring-[#5c67f2]/15 transition-all font-sans"
                  />
                </div>

                {/* Password input */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-full border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5c67f2] focus:ring-2 focus:ring-[#5c67f2]/15 transition-all font-sans"
                  />
                </div>

                {/* Remember me & Forgot Password */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-slate-500 cursor-pointer select-none font-sans">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-[#5c67f2] focus:ring-0 w-3.5 h-3.5 accent-[#5c67f2]"
                    />
                    <span>Remember me</span>
                  </label>
                  <a
                    href="#forgot"
                    className="text-slate-500 hover:text-slate-900 font-sans transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-full bg-[#5c67f2] hover:bg-[#4d59f0] active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-[#5c67f2]/25 transition-all font-sans cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <span>Login</span>
                  )}
                </button>
              </form>

              {/* Sign up prompt */}
              <p className="text-center text-xs text-slate-500 mt-6 font-sans">
                Don't have an account?{' '}
                <a href="#signup" className="text-[#5c67f2] font-semibold hover:underline">
                  Sign up
                </a>
              </p>

              {/* Seamless 1-Click Role Switcher for Demo Evaluation */}
              <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-sans">
                <span className="font-mono text-[11px] text-slate-400">1-Click Demo:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => demoLogin('sre')}
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 hover:bg-[#06d6a0]/15 hover:text-[#065f46] text-slate-600 transition-colors"
                  >
                    Alex Rivera (SRE)
                  </button>
                  <button
                    type="button"
                    onClick={() => demoLogin('admin')}
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 hover:bg-[#ef476f]/15 hover:text-[#be123c] text-slate-600 transition-colors"
                  >
                    Sarah Chen (Admin)
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
