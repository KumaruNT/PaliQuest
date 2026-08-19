'use server'

import { createClient } from '@/lib/supabase/server';

export async function getLeaderboard() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_scores')
    .select('display_name, total_score')
    .order('total_score', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
  
  return data;
}

export async function getUserScore(userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_scores')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error) {
    return null;
  }
  
  return data;
}

export async function getUserRank(userId: string, totalScore: number) {
  const supabase = await createClient();
  
  // Count how many users have a higher score
  const { count, error } = await supabase
    .from('user_scores')
    .select('*', { count: 'exact', head: true })
    .gt('total_score', totalScore);
    
  if (error || count === null) return 1;
  return count + 1;
}

export async function getUserStreak(userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error) return null;
  return data;
}
