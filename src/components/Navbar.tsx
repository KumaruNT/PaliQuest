import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import NavClient from './NavClient';

export default async function Navbar() {
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;

  const signOutAction = async () => {
    'use server';
    const supabaseServer = await createClient();
    await supabaseServer.auth.signOut();
    redirect('/');
  };

  return (
    <nav className="bg-zen-paper/95 backdrop-blur-sm border-b border-zen-border text-zen-ink sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold tracking-widest text-indigo-700 flex items-center group">
          PALI<span className="text-slate-800">QUEST</span>
        </Link>
          
          <div className="flex items-center flex-1 justify-end">
            <NavClient user={user} signOutAction={signOutAction} />
          </div>
        </div>
      </div>
    </nav>
  );
}
