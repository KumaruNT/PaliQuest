import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, Database, FolderTree } from 'lucide-react';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getSession();
  
  if (!session?.session?.user || session.session.user.user_metadata?.role !== 'admin') {
    redirect('/');
  }

  const { count: partsCount } = await supabase.from('parts').select('*', { count: 'exact', head: true });
  const { count: storiesCount } = await supabase.from('stories').select('*', { count: 'exact', head: true });
  const { count: sentencesCount } = await supabase.from('sentences').select('*', { count: 'exact', head: true });

  const stats = [
    { label: 'ภาคทั้งหมด', value: partsCount || 0, icon: FolderTree, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'เก็งทั้งหมด', value: storiesCount || 0, icon: BookOpen, color: 'text-[#2d4a3e]', bg: 'bg-[#f5f2eb]' },
    { label: 'ประโยคทั้งหมด', value: sentencesCount || 0, icon: Database, color: 'text-[#c19a5b]', bg: 'bg-[#fdfaf6]' },
  ];

  return (
    <div className="max-w-6xl mx-auto py-10 px-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zen-ink">Admin Dashboard</h1>
          <p className="text-zen-ink/60 mt-2">ภาพรวมระบบ Pali Quest</p>
        </div>
        <div className="flex space-x-3">
          <Link 
            href="/admin/manage" 
            className="px-5 py-2.5 bg-zen-bg text-zen-ink border border-zen-border rounded-lg hover:bg-zen-border/50 font-medium transition-colors shadow-sm"
          >
            จัดการข้อมูล
          </Link>
          <Link 
            href="/admin/convert" 
            className="px-5 py-2.5 bg-zen-accent text-white rounded-lg hover:bg-opacity-90 font-medium transition-colors shadow-sm"
          >
            + แปลง Word เป็น JSON
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-[#e5e0d8] flex flex-col justify-center items-center text-center">
            <div className={`p-4 rounded-full ${stat.bg} ${stat.color} mb-4`}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div className="text-4xl font-bold text-[#2d4a3e] mb-1">{stat.value}</div>
            <div className="text-sm text-[#6b675d] font-medium">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
