'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Basic shuffle
function shuffle<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export async function generatePersonalizedQuiz(questionCount = 5) {
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getSession();
  
  if (!session?.session?.user) {
    return { success: false, error: 'Unauthorized' };
  }
  
  const userId = session.session.user.id;
  const adminClient = createAdminClient();

  // 1. Get user's read stories
  const { data: progress } = await supabase
    .from('user_progress')
    .select('story_id')
    .eq('user_id', userId);
    
  if (!progress || progress.length === 0) {
    return { success: false, error: 'ยังไม่มีประวัติการอ่าน กรุณาเรียนอย่างน้อย 1 เก็งเพื่อสร้างแบบทดสอบ' };
  }
  
  const uniqueStoryIds = Array.from(new Set(progress.map(p => p.story_id)));
  
  // 2. Fetch sentences from these stories
  const { data: sentences } = await adminClient
    .from('sentences')
    .select('*')
    .in('story_id', uniqueStoryIds);
    
  if (!sentences || sentences.length < 4) {
    return { success: false, error: 'ประโยคที่อ่านแล้วมีน้อยเกินไป ไม่สามารถสร้างแบบทดสอบได้ (ต้องการอย่างน้อย 4 ประโยคเพื่อสร้างตัวเลือก)' };
  }
  
  // 3. Select random sentences for questions
  const shuffledSentences = shuffle(sentences);
  const selectedSentences = shuffledSentences.slice(0, Math.min(questionCount, shuffledSentences.length));
  
  // 4. Create Quiz record
  const { data: quiz, error: quizError } = await adminClient
    .from('quizzes')
    .insert({
      user_id: userId,
      title: 'ทบทวนประโยคที่เคยอ่าน',
      source_type: 'personalized'
    })
    .select()
    .single();
    
  if (quizError || !quiz) {
    return { success: false, error: 'สร้าง Quiz ล้มเหลว' };
  }
  
  // 5. Generate Questions
  const questionsToInsert = selectedSentences.map(sentence => {
    // We will do a simple Pali -> Translation question for MVP
    const questionType = 'pali_to_translation';
    const questionText = sentence.pali;
    const correctOption = sentence.translation;
    
    // Pick 3 random wrong options from other sentences
    const otherSentences = sentences.filter(s => s.id !== sentence.id);
    const wrongSentences = shuffle(otherSentences).slice(0, 3);
    const wrongOptions = wrongSentences.map(s => s.translation);
    
    const options = shuffle([correctOption, ...wrongOptions]);
    
    return {
      quiz_id: quiz.id,
      story_id: sentence.story_id,
      sentence_id: sentence.id,
      question_type: questionType,
      question_text: questionText,
      option_data: options,
      correct_option: correctOption
    };
  });
  
  const { error: questionsError } = await adminClient
    .from('quiz_questions')
    .insert(questionsToInsert);
    
  if (questionsError) {
    return { success: false, error: 'สร้างคำถามล้มเหลว' };
  }
  
  return { success: true, quizId: quiz.id };
}

export async function submitQuizAnswers(quizId: string, answers: Record<string, string>) {
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getSession();
  
  if (!session?.session?.user) {
    return { success: false, error: 'Unauthorized' };
  }
  
  const userId = session.session.user.id;
  const adminClient = createAdminClient();
  
  // 1. Fetch questions securely
  const { data: questions } = await adminClient
    .from('quiz_questions')
    .select('id, correct_option')
    .eq('quiz_id', quizId);
    
  if (!questions) return { success: false, error: 'Quiz not found' };
  
  // 2. Check if already attempted
  const { data: existingAttempt } = await adminClient
    .from('quiz_attempts')
    .select('id')
    .eq('quiz_id', quizId)
    .single();
    
  if (existingAttempt) {
    return { success: false, error: 'แบบทดสอบนี้มีการส่งคำตอบไปแล้ว' };
  }
  
  // 3. Calculate Score
  let score = 0;
  for (const q of questions) {
    if (answers[q.id] === q.correct_option) {
      score += 1;
    }
  }
  const total = questions.length;
  
  // 4. Save Attempt
  const { error: attemptError } = await adminClient
    .from('quiz_attempts')
    .insert({
      user_id: userId,
      quiz_id: quizId,
      score,
      total
    });
    
  if (attemptError) return { success: false, error: 'บันทึกคำตอบล้มเหลว' };
  
  // 5. Update user score (assume 5 points per correct answer for quiz score)
  const scoreToAdd = score * 5;
  const { data: existingScore } = await adminClient
    .from('user_scores')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existingScore) {
    await adminClient.from('user_scores').update({
      quiz_score: existingScore.quiz_score + scoreToAdd,
      total_score: existingScore.total_score + scoreToAdd,
      updated_at: new Date().toISOString()
    }).eq('user_id', userId);
  }

  if (!existingScore) {
    const displayName = session.session.user.user_metadata?.name || session.session.user.email?.split('@')[0] || 'User';
    await adminClient.from('user_scores').insert({
      user_id: userId,
      display_name: displayName,
      quiz_score: scoreToAdd,
      total_score: scoreToAdd
    });
  }
  
  // 6. Update streak securely
  const today = new Date().toISOString().split('T')[0];
  const { data: streak } = await adminClient
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (!streak) {
    await adminClient.from('user_streaks').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today
    });
  } else if (streak.last_activity_date !== today) {
    const lastActivity = new Date(streak.last_activity_date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    let newCurrent = streak.current_streak;
    if (streak.last_activity_date === yesterdayStr) {
      newCurrent += 1;
    } else {
      newCurrent = 1;
    }
    const newLongest = Math.max(newCurrent, streak.longest_streak);
    await adminClient.from('user_streaks').update({
      current_streak: newCurrent,
      longest_streak: newLongest,
      last_activity_date: today
    }).eq('user_id', userId);
  }
  
  revalidatePath('/dashboard');
  revalidatePath('/quiz');
  
  return { success: true, score, total };
}
