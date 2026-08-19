'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function recordSentenceProgress(storyId: string, sentenceId: string) {
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getSession();
  
  if (!session?.session?.user) {
    return { success: false, error: 'Unauthorized' };
  }
  
  const userId = session.session.user.id;
  const adminClient = createAdminClient();
  
  try {
    // 1. Insert progress
    // RLS allows users to insert their own progress
    const { error: insertError } = await supabase
      .from('user_progress')
      .insert({
        user_id: userId,
        story_id: storyId,
        sentence_id: sentenceId
      })
      .select('id')
      .single();
      
    if (insertError) {
      // 23505 is unique violation in Postgres
      if (insertError.code === '23505') {
        return { success: true, message: 'Already completed' };
      }
      throw insertError;
    }
    
    // 2. Update reading score securely
    const { data: existingScore } = await adminClient
      .from('user_scores')
      .select('reading_score, total_score')
      .eq('user_id', userId)
      .single();
      
    if (!existingScore) {
      const displayName = session.session.user.user_metadata?.name || session.session.user.email?.split('@')[0] || 'User';
      await adminClient.from('user_scores').insert({
        user_id: userId,
        display_name: displayName,
        reading_score: 1,
        total_score: 1
      });
    } else {
      await adminClient.from('user_scores')
        .update({
          reading_score: existingScore.reading_score + 1,
          total_score: existingScore.total_score + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    }
    
    // 3. Update streak securely
    await updateStreak(userId, adminClient);
    
    revalidatePath('/dashboard');
    revalidatePath(`/gaeng/${storyId}`);
    return { success: true };
  } catch (err: any) {
    console.error('Failed to record progress:', err);
    return { success: false, error: err.message };
  }
}

async function updateStreak(userId: string, adminClient: any) {
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
    return;
  }
  
  if (streak.last_activity_date === today) {
    return; // Already active today
  }
  
  // Calculate if consecutive
  const lastActivity = new Date(streak.last_activity_date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  let newCurrent = streak.current_streak;
  if (streak.last_activity_date === yesterdayStr) {
    newCurrent += 1;
  } else {
    newCurrent = 1; // Streak broken
  }
  
  const newLongest = Math.max(newCurrent, streak.longest_streak);
  
  await adminClient.from('user_streaks').update({
    current_streak: newCurrent,
    longest_streak: newLongest,
    last_activity_date: today
  }).eq('user_id', userId);
}
