import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'),
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
});

export const SentenceSchema = z.object({
  id: z.string(),
  order: z.number(),
  pali: z.string(),
  translation: z.string(),
  source_page: z.number().nullable().optional(),
  status: z.string().default('verified'),
});

export const GaengImportSchema = z.object({
  id: z.string(),
  order: z.number(),
  story_title: z.string(),
  source: z.object({
    book_page_start: z.number().nullable().optional(),
    book_page_end: z.number().nullable().optional(),
    start_marker: z.string().nullable().optional(),
    end_marker: z.string().nullable().optional(),
  }),
  sentences: z.array(SentenceSchema),
});
