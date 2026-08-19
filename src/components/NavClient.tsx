'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, User } from 'lucide-react';

type NavClientProps = {
  user: any;
  signOutAction: () => Promise<void>;
};

export default function NavClient({ user, signOutAction }: NavClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'หน้าแรก' },
    { href: '/#parts', label: 'เก็ง' },
    { href: '/#practice', label: 'ฝึก' },
    { href: '/#scoreboard', label: 'อันดับ' },
  ];

  const isAdmin = user?.user_metadata?.role === 'admin';
  if (isAdmin) {
    navLinks.push({ href: '/admin', label: 'Admin' });
  }

  return (
    <>
      <div className="hidden md:flex space-x-6 items-center">
        {navLinks.map(link => (
          <Link key={link.href} href={link.href} className="text-zen-ink/80 hover:text-zen-accent transition-colors font-medium text-sm">
            {link.label}
          </Link>
        ))}
      </div>

      <div className="hidden md:flex items-center space-x-4 ml-6 pl-6 border-l border-zen-border">
        {user ? (
          <div className="relative">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 text-sm font-medium text-zen-ink hover:text-zen-accent transition-colors"
            >
              <div className="w-8 h-8 bg-zen-accent/10 rounded-full flex items-center justify-center text-zen-accent">
                <User size={16} />
              </div>
              <span>{user.user_metadata?.name || user.email?.split('@')[0]}</span>
            </button>
            
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-zen-border rounded-xl shadow-lg py-2 z-50">
                <button 
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    const newName = window.prompt('เปลี่ยนชื่อผู้ใช้:', user.user_metadata?.name || user.email?.split('@')[0]);
                    if (newName && newName.trim().length >= 2) {
                      import('@/app/actions/user').then(m => m.updateUserName(newName)).then(res => {
                        if (!res.success) alert(res.error);
                        else window.location.reload();
                      });
                    } else if (newName !== null) {
                      alert('ชื่อต้องมีอย่างน้อย 2 ตัวอักษร');
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-zen-ink hover:bg-zen-bg transition-colors"
                >
                  ตั้งค่าบัญชี (เปลี่ยนชื่อ)
                </button>
                <form action={signOutAction}>
                  <button type="submit" className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-xl">
                    ออกจากระบบ
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link href="/register" className="text-sm font-medium text-zen-ink/70 hover:text-zen-accent-dark transition-colors">
              สมัครเรียน
            </Link>
            <Link href="/login" className="text-sm font-bold bg-white text-zen-accent-dark border border-zen-accent/30 px-5 py-2 rounded-full hover:bg-zen-accent-light hover:border-zen-accent transition-all shadow-sm flex items-center gap-2">
              เข้าสู่ระบบ
            </Link>
          </>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <div className="md:hidden flex items-center">
        <button onClick={() => setIsOpen(!isOpen)} className="text-zen-ink p-2">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-white border-b border-zen-border shadow-lg md:hidden p-4 z-40">
          <div className="flex flex-col space-y-4">
            {navLinks.map(link => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="text-zen-ink font-medium px-4 py-2 hover:bg-zen-bg rounded-lg"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-zen-border pt-4 px-4">
              {user ? (
                <div className="flex flex-col space-y-4">
                  <span className="text-sm text-zen-ink/60">สวัสดี, {user.user_metadata?.name || user.email?.split('@')[0]}</span>
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      const newName = window.prompt('เปลี่ยนชื่อผู้ใช้:', user.user_metadata?.name || user.email?.split('@')[0]);
                      if (newName && newName.trim().length >= 2) {
                        import('@/app/actions/user').then(m => m.updateUserName(newName)).then(res => {
                          if (!res.success) alert(res.error);
                          else window.location.reload();
                        });
                      } else if (newName !== null) {
                        alert('ชื่อต้องมีอย่างน้อย 2 ตัวอักษร');
                      }
                    }}
                    className="text-zen-ink font-medium w-full text-left"
                  >
                    ตั้งค่าบัญชี (เปลี่ยนชื่อ)
                  </button>
                  <form action={signOutAction}>
                    <button type="submit" className="text-red-600 font-medium w-full text-left">ออกจากระบบ</button>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col space-y-4">
                  <Link href="/login" onClick={() => setIsOpen(false)} className="font-medium text-zen-ink block">เข้าสู่ระบบ</Link>
                  <Link href="/register" onClick={() => setIsOpen(false)} className="text-center font-medium bg-zen-ink text-white px-4 py-2 rounded-full block">เริ่มเรียน</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
