import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getSession();
  
  if (!session?.session?.user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Find the latest user_progress entry
  const { data: progress } = await supabase
    .from('user_progress')
    .select('story_id')
    .eq('user_id', session.session.user.id)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();
    
  if (progress) {
    return NextResponse.redirect(new URL(`/gaeng/${progress.story_id}`, request.url));
  }
  
  // Fallback to random if no progress
  return NextResponse.redirect(new URL('/api/random', request.url));
}
