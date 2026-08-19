import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function MyLearningPage() {
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getSession();
  
  if (!session?.session?.user?.id) {
    redirect('/login');
  }

  // Note: user_progress table was not mentioned in the schema.
  // We'll mock it as empty for now to prevent breaking.
  const completedByGaeng: Record<string, number> = {};
  
  const learningStats: any[] = []; // Empty for now

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold text-[#2d4a3e] mb-8 font-noto-thai">การเรียนของฉัน</h1>
      
      {learningStats.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-[#e5e0d8] text-center shadow-sm">
          <p className="text-lg text-[#6b675d] mb-4">ระบบติดตามความคืบหน้ากำลังอยู่ระหว่างการพัฒนา (รอเพิ่มตาราง user_progress)</p>
          <Link href="/" className="inline-block bg-[#c19a5b] text-white px-6 py-2 rounded-full font-medium hover:bg-[#a6844d] transition-colors">
            ไปหน้าแรกเพื่อเริ่มเรียน
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Real implementation would go here once user_progress is added */}
        </div>
      )}
    </div>
  );
}
