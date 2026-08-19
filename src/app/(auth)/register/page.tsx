'use client';

import { useState } from 'react';
import { register } from '@/app/actions/auth';
import Link from 'next/link';

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await register(formData);
      if (res?.error) {
        setError(res.error);
      }
    } catch (e) {
      // Handled by Next.js redirect on success
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zen-bg py-12 px-4">
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-zen-border w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-serif text-zen-ink mb-2">PALI QUEST</h1>
          <p className="text-zen-ink/60 text-sm tracking-wide">สมัครสมาชิก</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zen-ink/80 mb-2">ชื่อ</label>
            <input 
              type="text" 
              name="name" 
              required 
              className="w-full px-4 py-2.5 rounded-lg border border-zen-border/70 text-zen-ink bg-zen-bg/30 focus:ring-1 focus:ring-zen-accent focus:border-zen-accent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zen-ink/80 mb-2">Email</label>
            <input 
              type="email" 
              name="email" 
              required 
              className="w-full px-4 py-2.5 rounded-lg border border-zen-border/70 text-zen-ink bg-zen-bg/30 focus:ring-1 focus:ring-zen-accent focus:border-zen-accent outline-none transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zen-ink/80 mb-2">Password</label>
            <input 
              type="password" 
              name="password" 
              required 
              className="w-full px-4 py-2.5 rounded-lg border border-zen-border/70 text-zen-ink bg-zen-bg/30 focus:ring-1 focus:ring-zen-accent focus:border-zen-accent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zen-ink/80 mb-2">Confirm Password</label>
            <input 
              type="password" 
              name="confirmPassword" 
              required 
              className="w-full px-4 py-2.5 rounded-lg border border-zen-border/70 text-zen-ink bg-zen-bg/30 focus:ring-1 focus:ring-zen-accent focus:border-zen-accent outline-none transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-zen-accent text-white py-3 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 mt-4 shadow-sm"
          >
            {isLoading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-zen-ink/60">
          มีบัญชีอยู่แล้ว?{' '}
          <Link href="/login" className="text-zen-accent hover:underline font-medium">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}
