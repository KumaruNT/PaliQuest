'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { redirect } from 'next/navigation';

const registerSchema = z.object({
  name: z.string().min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirmPassword']
});

export async function login(formData: FormData) {
  const identifier = formData.get('identifier') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  let email = identifier;

  // If identifier doesn't look like an email, assume it's a username
  if (!identifier.includes('@')) {
    // Need a service role client to list users
    const { createClient: createAdminClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Fetch users (fine for small MVP applications)
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (!listError && users) {
      const matchedUser = users.find(u => u.user_metadata?.name === identifier);
      if (matchedUser && matchedUser.email) {
        email = matchedUser.email;
      }
    }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'อีเมล/ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง' };
  }

  redirect('/admin');
}

export async function register(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  
  const validation = registerSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const { name, email, password } = validation.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: 'user'
      }
    }
  });

  if (error) {
    return { error: error.message };
  }
  
  redirect('/admin');
}
