import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import LearningInterface from '@/components/LearningInterface';

export default async function GaengLearningPage({ params }: { params: Promise<{ gaengId: string }> }) {
  const resolvedParams = await params;
  const gaengId = resolvedParams.gaengId;
  const supabase = await createClient();

  const { data: gaeng, error: gaengError } = await supabase
    .from('stories')
    .select('*')
    .eq('id', gaengId)
    .single();

  if (gaengError || !gaeng) {
    return notFound();
  }

  const { data: part } = await supabase
    .from('parts')
    .select('*')
    .eq('id', gaeng.part_id)
    .single();

  const { data: storySentences } = await supabase
    .from('sentences')
    .select('*')
    .eq('story_id', gaeng.id)
    .order('sentence_order', { ascending: true });

  const { data: session } = await supabase.auth.getSession();
  
  let completedIds: string[] = [];
  if (session?.session?.user) {
    const { data: progress } = await supabase
      .from('user_progress')
      .select('sentence_id')
      .eq('user_id', session.session.user.id)
      .eq('story_id', gaeng.id);
      
    if (progress) {
      completedIds = progress.map(p => p.sentence_id);
    }
  }

  const isAdmin = session?.session?.user?.user_metadata?.role === 'admin';

  return (
    <div className="bg-[#fdfaf6] min-h-[calc(100vh-64px)]">
      <LearningInterface 
        part={part || { id: gaeng.part_id, title: 'ไม่ทราบชื่อ' }}
        gaeng={gaeng} 
        sentences={storySentences || []} 
        initialCompletedIds={completedIds} 
        isLoggedIn={!!session?.session?.user} 
        isAdmin={isAdmin}
      />
    </div>
  );
}
