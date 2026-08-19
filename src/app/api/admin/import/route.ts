import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session?.user || session.session.user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { partNumber, data: validData } = payload;

    if (!partNumber || typeof partNumber !== 'number') {
      return NextResponse.json({ error: 'ไม่พบข้อมูลภาคที่เลือก' }, { status: 400 });
    }

    // Find Part (Do NOT create if it doesn't exist)
    const { data: part } = await supabase
      .from('parts')
      .select('id')
      .eq('part_number', partNumber)
      .single();

    if (!part?.id) {
      return NextResponse.json({ error: `ไม่พบข้อมูลภาคที่ ${partNumber} ในระบบ กรุณาสร้างภาคก่อนทำการ Import` }, { status: 400 });
    }

    const partId = part.id;

    // Check if Story exists
    let { data: existingStory } = await supabase
      .from('stories')
      .select('*')
      .eq('external_id', validData.id)
      .single();

    let storyId = existingStory?.id;
    let isNewStory = false;
    let oldSentences: any[] = [];
    
    if (!storyId) {
      // Fallback check by part_id and gaeng_number
      const { data: fallbackStory } = await supabase
        .from('stories')
        .select('*')
        .eq('part_id', partId)
        .eq('gaeng_number', validData.order)
        .single();
        
      storyId = fallbackStory?.id;
      existingStory = fallbackStory;
    }

    const newStoryData = {
      story_title: validData.story_title,
      book_page_start: validData.source?.book_page_start || null,
      book_page_end: validData.source?.book_page_end || null,
      start_marker: validData.source?.start_marker || null,
      end_marker: validData.source?.end_marker || null,
      external_id: validData.id
    };

    if (storyId) {
      // Backup old sentences for Rollback
      const { data: osData } = await supabase.from('sentences').select('*').eq('story_id', storyId);
      oldSentences = osData || [];
      
      // Update existing Story
      await supabase.from('stories').update(newStoryData).eq('id', storyId);
      
      // Delete old sentences to replace them
      await supabase.from('sentences').delete().eq('story_id', storyId);
    } else {
      isNewStory = true;
      // Insert new Story
      const { data: newStory, error: newStoryError } = await supabase.from('stories').insert({
        part_id: partId,
        gaeng_number: validData.order,
        status: 'published',
        display_order: validData.order,
        ...newStoryData
      }).select('id').single();
      
      if (newStoryError) throw newStoryError;
      storyId = newStory.id;
    }

    // Insert Sentences with Rollback Try-Catch
    try {
      if (validData.sentences.length > 0) {
        const sentencesToInsert = validData.sentences.map((s: any) => ({
          story_id: storyId,
          sentence_order: s.order,
          pali: s.pali,
          translation: s.translation,
          source_page: s.source_page || null,
          status: s.status || 'verified',
        }));
        
        const { error: sentenceError } = await supabase.from('sentences').insert(sentencesToInsert);
        if (sentenceError) throw sentenceError;
      }
    } catch (insertError: any) {
      // ROLLBACK LOGIC
      console.error('Sentence Insert Failed. Rolling back...', insertError);
      
      if (isNewStory) {
        // If it was a new story, just delete the story and it will cascade or remove it entirely
        await supabase.from('stories').delete().eq('id', storyId);
      } else {
        // Revert story metadata
        await supabase.from('stories').update({
          story_title: existingStory.story_title,
          book_page_start: existingStory.book_page_start,
          book_page_end: existingStory.book_page_end,
          start_marker: existingStory.start_marker,
          end_marker: existingStory.end_marker,
          external_id: existingStory.external_id
        }).eq('id', storyId);

        // Delete any partially inserted sentences (just in case)
        await supabase.from('sentences').delete().eq('story_id', storyId);
        
        // Restore old sentences
        if (oldSentences.length > 0) {
          await supabase.from('sentences').insert(oldSentences);
        }
      }
      throw new Error('บันทึกประโยคล้มเหลว ระบบได้ทำการยกเลิก (Rollback) เรียบร้อยแล้ว: ' + insertError.message);
    }

    return NextResponse.json({ 
      success: true,
      message: `นำเข้าเก็ง ${validData.order} สำเร็จ`,
      stats: {
        created: isNewStory ? validData.sentences.length : 0,
        updated: !isNewStory ? validData.sentences.length : 0,
        storyId
      }
    });

  } catch (error: any) {
    console.error('Import Error:', error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
