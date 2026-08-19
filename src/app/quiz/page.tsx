import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { generatePersonalizedQuiz } from '@/app/actions/quiz';
import QuizClient from './QuizClient';
import { createAdminClient } from '@/lib/supabase/server';

export default async function QuizPage({ searchParams }: { searchParams: Promise<{ quizId?: string }> }) {
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getSession();
  
  if (!session?.session?.user) {
    redirect('/login');
  }

  const resolvedSearchParams = await searchParams;
  let quizId = resolvedSearchParams.quizId;
  let generateError = '';
  
  if (!quizId) {
    const res = await generatePersonalizedQuiz(5);
    if (res.success && res.quizId) {
      redirect(`/quiz?quizId=${res.quizId}`);
    } else {
      generateError = res.error || 'เกิดข้อผิดพลาดในการสร้างแบบทดสอบ';
    }
  }

  if (generateError) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zen-bg flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-zen-border text-center max-w-md w-full">
          <h1 className="text-2xl font-serif text-zen-ink mb-4">ไม่สามารถสร้างแบบทดสอบได้</h1>
          <p className="text-zen-ink/60 mb-6">{generateError}</p>
          <a href="/dashboard" className="px-6 py-2.5 bg-zen-accent text-white rounded-full font-medium inline-block hover:bg-opacity-90">กลับไปหน้าแดชบอร์ด</a>
        </div>
      </div>
    );
  }

  // Fetch Questions (excluding correct_option) for the client
  const adminClient = createAdminClient();
  const { data: questions } = await adminClient
    .from('quiz_questions')
    .select('id, question_text, option_data')
    .eq('quiz_id', quizId);

  if (!questions || questions.length === 0) {
    return <div className="text-center p-10">ไม่พบคำถามสำหรับแบบทดสอบนี้</div>;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zen-bg flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        <QuizClient quizId={quizId!} questions={questions as any} />
      </div>
    </div>
  );
}
