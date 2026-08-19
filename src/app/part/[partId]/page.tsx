import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, CheckCircle2, Circle, ArrowRight } from 'lucide-react';

export default async function PartSelectionPage({ params }: { params: Promise<{ partId: string }> }) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  
  const { data: part, error: partError } = await supabase
    .from('parts')
    .select('*')
    .eq('id', resolvedParams.partId)
    .single();

  if (partError || !part) return notFound();

  // Fetch all published stories for this part
  const { data: partGaengs } = await supabase
    .from('stories')
    .select('*')
    .eq('part_id', part.id)
    .eq('status', 'published')
    .order('display_order', { ascending: true })
    .order('gaeng_number', { ascending: true });

  const storyIds = partGaengs ? partGaengs.map(g => g.id) : [];

  // Get sentence counts for each gaeng
  const countsMap: Record<string, number> = {};
  if (storyIds.length > 0) {
    const { data: sentencesCountData } = await supabase
      .from('sentences')
      .select('story_id')
      .in('story_id', storyIds);
      
    if (sentencesCountData) {
      sentencesCountData.forEach(s => {
        countsMap[s.story_id] = (countsMap[s.story_id] || 0) + 1;
      });
    }
  }

  // Get user progress for each gaeng
  const progressMap: Record<string, number> = {};
  if (userId && storyIds.length > 0) {
    const { data: progressData } = await supabase
      .from('user_progress')
      .select('story_id')
      .eq('user_id', userId)
      .in('story_id', storyIds);
      
    if (progressData) {
      progressData.forEach(p => {
        progressMap[p.story_id] = (progressMap[p.story_id] || 0) + 1;
      });
    }
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-24 font-sans text-slate-800">
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto py-12 px-6">
          <Link href="/#parts" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors mb-6">
            <ChevronLeft size={16} className="mr-1" /> กลับไปหน้าแผนที่การเรียน
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">{part.title}</h1>
          <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl">{part.description}</p>
        </div>
      </div>

      {/* ROADMAP SECTION */}
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">เส้นทางการเรียน (Roadmap)</h2>
          <span className="text-sm text-slate-400 font-bold">{partGaengs?.length || 0} เก็งในบทนี้</span>
        </div>

        {!partGaengs || partGaengs.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
            <p className="text-xl text-slate-800 mb-2 font-bold">ยังไม่มีเก็งในภาคนี้</p>
            <p className="text-sm text-slate-500 font-medium">เนื้อหากำลังอยู่ในระหว่างการจัดทำ อดใจรออีกนิดนะครับ</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical Line for Roadmap */}
            <div className="absolute left-[27px] top-8 bottom-8 w-1 bg-slate-200 hidden md:block z-0 rounded-full"></div>

            <div className="space-y-6 relative z-10">
              {partGaengs.map((story, index) => {
                const totalSentences = countsMap[story.id] || 0;
                const completedSentences = progressMap[story.id] || 0;
                
                let status = 'upcoming';
                if (completedSentences > 0 && completedSentences >= totalSentences) {
                  status = 'completed';
                } else if (completedSentences > 0) {
                  status = 'current';
                }

                return (
                  <div key={story.id} className="flex gap-6 group">
                    {/* Status Icon Indicator (Desktop) */}
                    <div className="hidden md:flex flex-col items-center pt-5">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-white border-4 z-10 transition-colors ${
                        status === 'completed' ? 'border-amber-400 text-amber-500' :
                        status === 'current' ? 'border-indigo-500 text-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.2)]' :
                        'border-slate-200 text-slate-300'
                      }`}>
                        {status === 'completed' ? <CheckCircle2 size={24} fill="currentColor" className="text-white" /> :
                         status === 'current' ? <div className="w-3 h-3 rounded-full bg-indigo-500"></div> :
                         <Circle size={20} />}
                      </div>
                    </div>

                    {/* Card */}
                    <Link href={`/gaeng/${story.id}`} className={`flex-1 block animate-slide-up opacity-0`} style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}>
                      <div className={`rounded-3xl p-6 md:p-8 border transition-all duration-300 hover:-translate-y-1 ${
                        status === 'current' 
                          ? 'bg-white border-indigo-200 shadow-md hover:shadow-lg ring-1 ring-indigo-100' 
                          : status === 'completed' 
                            ? 'border-slate-200 bg-slate-50 hover:bg-white hover:shadow-sm' 
                            : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-100'
                      }`}>
                        
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full transition-colors ${
                              status === 'completed' ? 'bg-amber-100 border border-amber-200 text-amber-600' :
                              status === 'current' ? 'bg-indigo-100 border border-indigo-200 text-indigo-700 shadow-sm' :
                              'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}>
                              เก็งที่ {story.gaeng_number}
                            </span>
                            {status === 'completed' && <span className="text-xs text-amber-500 font-bold flex items-center"><CheckCircle2 size={12} className="mr-1" /> เรียนจบแล้ว</span>}
                            {status === 'current' && <span className="text-xs text-indigo-600 font-bold animate-pulse">กำลังเรียน</span>}
                          </div>
                          <span className="text-sm font-bold text-slate-400">หน้า {story.book_page_start} - {story.book_page_end}</span>
                        </div>
                        
                        <h3 className={`text-2xl font-bold mb-6 transition-colors ${
                          status === 'completed' ? 'text-slate-600' : 'text-slate-800 group-hover:text-indigo-600'
                        }`}>
                          {story.title}
                        </h3>
                        
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="text-sm font-bold text-slate-400 w-24">
                              {completedSentences} / {totalSentences} ประโยค
                            </div>
                            <div className="h-2.5 w-full sm:w-32 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${
                                  status === 'completed' ? 'bg-amber-400' : 'bg-indigo-500'
                                }`} 
                                style={{ width: `${Math.min(100, totalSentences === 0 ? 0 : (completedSentences / totalSentences) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="hidden sm:flex items-center text-sm font-bold text-indigo-600 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                            เข้าเรียน <ArrowRight size={16} className="ml-1" />
                          </div>
                        </div>
                        
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
