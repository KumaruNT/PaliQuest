'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateUserName(newName: string) {
  if (!newName || newName.trim().length < 2) {
    return { success: false, error: 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร' };
  }

  const supabase = await createClient();
  const { data: session } = await supabase.auth.getSession();
  
  if (!session?.session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const userId = session.session.user.id;
  const adminClient = createAdminClient();

  // 1. Update Auth user metadata
  const { error: authError } = await supabase.auth.updateUser({
    data: { name: newName.trim() }
  });

  if (authError) {
    return { success: false, error: 'อัปเดตชื่อผู้ใช้ล้มเหลว (Auth)' };
  }

  // 2. Update user_scores display_name
  const { data: scoreRec } = await adminClient
    .from('user_scores')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (scoreRec) {
    await adminClient
      .from('user_scores')
      .update({ display_name: newName.trim() })
      .eq('user_id', userId);
  }

  revalidatePath('/', 'layout');
  
  return { success: true };
}
