import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  
  // Fetch all published stories
  const { data: publishedStories } = await supabase
    .from('stories')
    .select('id')
    .eq('status', 'published');
    
  if (!publishedStories || publishedStories.length === 0) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  const randomIndex = Math.floor(Math.random() * publishedStories.length);
  const randomStoryId = publishedStories[randomIndex].id;
  
  return NextResponse.redirect(new URL(`/gaeng/${randomStoryId}`, request.url));
}
