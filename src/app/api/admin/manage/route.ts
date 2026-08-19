import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check admin auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user || session.user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { storyId } = body;

    if (!storyId) {
      return NextResponse.json({ error: 'Missing storyId' }, { status: 400 });
    }

    // Delete sentences first to avoid foreign key violations
    const { error: sentenceError } = await supabase
      .from('sentences')
      .delete()
      .eq('story_id', storyId);
      
    if (sentenceError) {
      throw new Error(`Failed to delete sentences: ${sentenceError.message}`);
    }

    // Delete the story
    const { error: storyError } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId);
      
    if (storyError) {
      throw new Error(`Failed to delete story: ${storyError.message}`);
    }

    return NextResponse.json({ success: true, message: 'ลบเก็งสำเร็จ' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
