import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check admin auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user || session.user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, pali, translation } = body;

    if (!id || !pali || !translation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update the sentence
    const { error: updateError } = await supabase
      .from('sentences')
      .update({ pali, translation })
      .eq('id', id);
      
    if (updateError) {
      throw new Error(`Failed to update sentence: ${updateError.message}`);
    }

    return NextResponse.json({ success: true, message: 'บันทึกการแก้ไขสำเร็จ' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
