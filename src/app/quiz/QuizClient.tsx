'use client';

import { useState } from 'react';
import { submitQuizAnswers } from '@/app/actions/quiz';
import { useRouter } from 'next/navigation';

type Question = {
  id: string;
  question_text: string;
  option_data: string[];
};

export default function QuizClient({ quizId, questions }: { quizId: string, questions: Question[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number, total: number } | null>(null);
  const router = useRouter();

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (option: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: option
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const res = await submitQuizAnswers(quizId, answers);
    if (res.success) {
      setResult({ score: res.score!, total: res.total! });
    } else {
      alert(res.error || 'เกิดข้อผิดพลาดในการส่งคำตอบ');
    }
    setIsSubmitting(false);
  };

  if (result) {
    return (
      <div className="bg-white p-10 rounded-xl shadow-sm border border-zen-border text-center">
        <h1 className="text-3xl font-serif text-zen-ink mb-6">สรุปผลการทดสอบ</h1>
        <div className="text-5xl font-serif text-zen-accent mb-4">{result.score} / {result.total}</div>
        <p className="text-zen-ink/60 mb-8">คุณได้รับ {result.score * 5} คะแนน</p>
        <button 
          onClick={() => router.push('/dashboard')}
          className="px-8 py-3 bg-zen-ink text-white rounded-lg font-medium hover:bg-opacity-90 transition-all shadow-sm"
        >
          กลับไปหน้าแดชบอร์ด
        </button>
      </div>
    );
  }

  const hasAnsweredCurrent = !!answers[currentQuestion.id];
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm border border-zen-border">
      <div className="flex justify-between items-center text-sm font-medium text-zen-ink/50 mb-8">
        <span>คำถามที่ {currentIndex + 1} จาก {questions.length}</span>
      </div>

      <div className="mb-10">
        <h3 className="text-xs text-zen-accent/80 mb-4 uppercase tracking-widest font-semibold">แปลประโยคนี้ให้ถูกต้อง</h3>
        <p className="text-2xl md:text-3xl leading-loose text-zen-ink font-serif text-center mb-8">
          {currentQuestion.question_text}
        </p>

        <div className="space-y-4">
          {currentQuestion.option_data.map((option, idx) => {
            const isSelected = answers[currentQuestion.id] === option;
            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(option)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all font-serif text-lg ${
                  isSelected 
                    ? 'border-zen-accent bg-zen-accent/5 text-zen-ink' 
                    : 'border-zen-border/50 hover:border-zen-accent/30 text-zen-ink/80'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-zen-border/50">
        {isLastQuestion ? (
          <button
            onClick={handleSubmit}
            disabled={!hasAnsweredCurrent || isSubmitting}
            className="px-8 py-3 bg-zen-accent text-white rounded-full font-medium hover:bg-opacity-90 shadow-sm transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'กำลังส่งคำตอบ...' : 'ส่งคำตอบ'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!hasAnsweredCurrent}
            className="px-8 py-3 bg-zen-ink text-white rounded-full font-medium hover:bg-opacity-90 shadow-sm transition-all disabled:opacity-50"
          >
            ข้อถัดไป
          </button>
        )}
      </div>
    </div>
  );
}
