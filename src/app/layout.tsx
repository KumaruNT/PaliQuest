import type { Metadata } from 'next';
import { Inter, Noto_Serif_Thai } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoThai = Noto_Serif_Thai({ subsets: ['thai'], variable: '--font-noto-thai' });

export const metadata: Metadata = {
  title: 'Pali Quest',
  description: 'เรียนรู้ภาษาบาลี ผ่านเรื่องราวในธรรมบท',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${inter.variable} ${notoThai.variable}`}>
      <body className="bg-zen-bg min-h-screen text-zen-ink font-sans antialiased flex flex-col">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
      </body>
    </html>
  );
}
