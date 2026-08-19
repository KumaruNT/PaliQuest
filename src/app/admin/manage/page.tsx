import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, BookOpen } from 'lucide-react';
import DeleteStoryButton from '@/components/DeleteStoryButton';

export const revalidate = 0;

export default async function AdminManagePage() {
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getSession();
  
  if (!session?.session?.user || session.session.user.user_metadata?.role !== 'admin') {
    redirect('/');
  }

  // Fetch all parts and stories
  const { data: parts } = await supabase.from('parts').select('id, title').order('display_order');
  
  const { data: stories } = await supabase
    .from('stories')
    .select(`
      *,
      sentences (count)
    `)
    .order('part_id')
    .order('gaeng_number');

  const partMap = parts?.reduce((acc: any, part) => {
    acc[part.id] = part.title;
    return acc;
  }, {}) || {};

  return (
    <div className="max-w-6xl mx-auto py-10 px-6">
      <div className="flex items-center space-x-4 mb-2">
        <Link href="/admin" className="text-zen-ink/60 hover:text-zen-ink transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-bold text-zen-ink">จัดการข้อมูลเก็ง</h1>
      </div>
      <p className="text-zen-ink/60 mb-8 ml-10">ตรวจสอบและลบข้อมูลเก็งที่ไม่ต้องการออกจากระบบ</p>

      <div className="bg-white rounded-2xl shadow-sm border border-zen-border overflow-hidden">
        {(!stories || stories.length === 0) ? (
          <div className="p-12 text-center text-zen-ink/60 font-medium">
            ไม่มีข้อมูลเก็งในระบบ
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zen-bg border-b border-zen-border">
                  <th className="px-6 py-4 font-semibold text-sm text-zen-ink/80">ภาค</th>
                  <th className="px-6 py-4 font-semibold text-sm text-zen-ink/80">เก็งที่</th>
                  <th className="px-6 py-4 font-semibold text-sm text-zen-ink/80">ชื่อเรื่อง</th>
                  <th className="px-6 py-4 font-semibold text-sm text-zen-ink/80">ประโยค</th>
                  <th className="px-6 py-4 font-semibold text-sm text-zen-ink/80 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zen-border">
                {stories.map(story => (
                  <tr key={story.id} className="hover:bg-zen-bg/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zen-ink">
                      {partMap[story.part_id] || 'ไม่ระบุ'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zen-ink/80">
                      {story.gaeng_number}
                    </td>
                    <td className="px-6 py-4 text-sm font-serif text-zen-ink">
                      {story.story_title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zen-ink/60">
                      {story.sentences?.[0]?.count || 0} ประโยค
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <Link 
                          href={`/gaeng/${story.id}`}
                          className="p-2 text-zen-ink/50 hover:bg-zen-bg hover:text-zen-ink rounded-lg transition-colors"
                          title="ดูเนื้อหา"
                        >
                          <BookOpen className="w-5 h-5" />
                        </Link>
                        <DeleteStoryButton storyId={story.id} storyTitle={story.story_title} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
