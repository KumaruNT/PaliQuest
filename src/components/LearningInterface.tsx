'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Edit3, BookOpen, Eye, EyeOff, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { recordSentenceProgress } from '@/app/actions/progress';

type Sentence = {
  id: string;
  gaengId: string;
  sentenceOrder: number;
  pali: string;
  translation: string;
  status: string;
};

type Props = {
  part: any;
  gaeng: any;
  sentences: Sentence[];
  initialCompletedIds: string[];
  isLoggedIn: boolean;
  isAdmin?: boolean;
};

export default function LearningInterface({ part, gaeng, sentences, initialCompletedIds, isLoggedIn, isAdmin = false }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(true);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set(initialCompletedIds));
  const [isMarking, setIsMarking] = useState(false);
  const router = useRouter();

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editPali, setEditPali] = useState('');
  const [editTranslation, setEditTranslation] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const currentSentence = sentences[currentIndex];
  const isCompleted = currentSentence && completedIds.has(currentSentence.id);
  const progressPercent = sentences.length > 0 ? (completedIds.size / sentences.length) * 100 : 0;

  useEffect(() => {
    setIsEditing(false);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (!isLoggedIn) {
      alert('กรุณาเข้าสู่ระบบเพื่อบันทึกความคืบหน้า');
      return;
    }
    
    if (isCompleted || isMarking) return;

    setIsMarking(true);
    
    const res = await recordSentenceProgress(gaeng.id, currentSentence.id);
    
    if (res.success) {
      setCompletedIds(prev => {
        const newSet = new Set(prev);
        newSet.add(currentSentence.id);
        return newSet;
      });
      // Auto-advance after a short delay if not at the end
      if (currentIndex < sentences.length - 1) {
        setTimeout(() => handleNext(), 800);
      }
    } else {
      alert(res.error || 'เกิดข้อผิดพลาดในการบันทึก');
    }
    setIsMarking(false);
  };

  const handleEdit = () => {
    setEditPali(currentSentence.pali);
    setEditTranslation(currentSentence.translation);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editPali.trim() || !editTranslation.trim()) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/sentences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentSentence.id,
          pali: editPali,
          translation: editTranslation
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'บันทึกไม่สำเร็จ');
      }

      // Optimistic Update
      currentSentence.pali = editPali;
      currentSentence.translation = editTranslation;
      setIsEditing(false);
      router.refresh(); 
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
    setIsSaving(false);
  };

  if (!currentSentence) return <div className="p-12 text-center text-zen-ink/50 bg-white rounded-2xl max-w-2xl mx-auto mt-12 border border-zen-border shadow-sm">ยังไม่มีข้อมูลประโยคในเก็งนี้</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-sans text-slate-800 pb-32">
      {/* Top Navigation */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
        <Link href={`/part/${part.id}`} className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 transition-all bg-white px-4 py-2.5 rounded-full shadow-sm border border-slate-200 hover:shadow-md hover:-translate-x-1 self-start">
          <LayoutGrid size={16} className="mr-2" /> กลับไปหน้าเลือกเก็ง
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-full md:w-64 bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner border border-slate-200/50">
            <div className="bg-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}>
            </div>
          </div>
          <span className="text-sm font-bold text-slate-500 whitespace-nowrap">{Math.round(progressPercent)}%</span>
        </div>
      </div>

      {/* Header Info */}
      <div className="text-center mb-10 animate-slide-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-bold tracking-widest uppercase mb-4 shadow-sm">
          <BookOpen size={14} className="animate-pulse" /> เก็งที่ {gaeng.gaeng_number}
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-slate-800 mb-3">{gaeng.story_title}</h1>
        <p className="text-slate-500 text-sm md:text-base font-medium">เนื้อหาหนังสือหน้า {gaeng.book_page_start} - {gaeng.book_page_end}</p>
      </div>

      {/* Main Sentence Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-12 mb-8 relative min-h-[450px] flex flex-col transition-all duration-500 animate-slide-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
        
        {/* Card Header */}
        <div className="flex flex-wrap justify-between items-center mb-10 gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-lg border border-slate-200 shadow-sm">
              {currentIndex + 1}
            </span>
            <span className="text-slate-400 font-bold text-sm">จาก {sentences.length} ประโยค</span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && !isEditing && (
              <button 
                onClick={handleEdit}
                className="flex items-center text-xs bg-slate-50 text-slate-500 px-4 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors font-bold border border-slate-200"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" /> แก้ไข
              </button>
            )}
            <button 
              onClick={() => setShowTranslation(!showTranslation)}
              className={`flex items-center text-xs px-4 py-2 rounded-lg transition-colors font-bold border ${
                showTranslation 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100' 
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {showTranslation ? <><EyeOff size={14} className="mr-1.5"/> ซ่อนคำแปล</> : <><Eye size={14} className="mr-1.5"/> แสดงคำแปล</>}
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="flex-grow flex flex-col justify-center space-y-10">
          {isEditing ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs text-zen-accent/80 mb-2 uppercase tracking-widest font-semibold flex items-center">
                  <Edit3 className="w-3 h-3 mr-1" /> แก้ไข PALI
                </h3>
                <textarea 
                  value={editPali} 
                  onChange={(e) => setEditPali(e.target.value)} 
                  className="w-full p-6 border border-zen-border rounded-2xl bg-zen-bg/50 text-2xl md:text-3xl leading-loose font-serif min-h-[150px] focus:outline-none focus:border-zen-accent/50 focus:ring-4 focus:ring-zen-accent/10 resize-y transition-all"
                  placeholder="ข้อความภาษาบาลี..."
                />
              </div>
              <div>
                <h3 className="text-xs text-zen-accent/80 mb-2 uppercase tracking-widest font-semibold flex items-center">
                  <Edit3 className="w-3 h-3 mr-1" /> แก้ไข คำแปล
                </h3>
                <textarea 
                  value={editTranslation} 
                  onChange={(e) => setEditTranslation(e.target.value)} 
                  className="w-full p-6 border border-zen-border rounded-2xl bg-zen-bg/50 text-xl md:text-2xl leading-loose font-serif min-h-[150px] focus:outline-none focus:border-zen-accent/50 focus:ring-4 focus:ring-zen-accent/10 resize-y transition-all"
                  placeholder="คำแปลภาษาไทย..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-8 border-t border-zen-border/50 pt-6">
                <button 
                  onClick={() => setIsEditing(false)} 
                  className="px-6 py-2.5 text-sm font-medium text-zen-ink/60 hover:bg-zen-bg hover:text-zen-ink transition-colors rounded-xl"
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={isSaving} 
                  className="px-8 py-2.5 text-sm font-bold bg-zen-ink text-white rounded-xl hover:bg-zen-ink-light transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-12 pb-4">
              {/* PALI SECTION */}
              <div className="relative">
                <h3 className="absolute -top-6 left-0 text-[10px] text-indigo-400 uppercase tracking-widest font-bold font-sans">Pali</h3>
                <p className="text-2xl md:text-3xl leading-relaxed md:leading-[2.5] text-slate-800 font-bold text-justify whitespace-pre-wrap">
                  {currentSentence.pali}
                </p>
              </div>

              {/* TRANSLATION SECTION */}
              <div className={`transition-all duration-500 ease-in-out relative ${showTranslation ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 invisible h-0 overflow-hidden'}`}>
                <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-indigo-200 rounded-full"></div>
                <div className="pl-6 md:pl-8">
                  <h3 className="absolute -top-6 left-6 md:left-8 text-[10px] text-slate-400 uppercase tracking-widest font-bold font-sans">Translation</h3>
                  <p className="text-xl md:text-2xl leading-relaxed md:leading-[2.2] text-slate-600 font-medium text-justify whitespace-pre-wrap">
                    {currentSentence.translation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Credit Section */}
      <div className="text-center mb-12 animate-slide-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
        <p className="text-xs text-slate-400">
          ข้อมูลต้นฉบับอ้างอิงจาก{' '}
          <a href="https://pali.purivaro.com/page/dhammabot/ebook.php" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-600 hover:underline transition-colors font-medium">
            pali.purivaro.com
          </a>
        </p>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 z-40 transform transition-transform shadow-[0_-4px_20px_rgba(0,0,0,0.02)] animate-slide-up opacity-0" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-4 relative">
          
          <button 
            onClick={handlePrev}
            disabled={currentIndex === 0 || isEditing}
            className="flex items-center justify-center w-12 h-12 md:w-auto md:px-6 md:py-3.5 rounded-full bg-white text-slate-700 hover:bg-slate-50 hover:shadow-sm disabled:opacity-30 disabled:hover:bg-white transition-all duration-300 font-bold border border-slate-200"
            aria-label="Previous Sentence"
          >
            <ChevronLeft size={20} className="md:mr-2" /> <span className="hidden md:inline">ก่อนหน้า</span>
          </button>

          <button 
            onClick={handleComplete}
            disabled={isCompleted || isMarking || isEditing}
            className={`flex-1 max-w-sm flex justify-center items-center px-6 py-4 rounded-full font-bold transition-all duration-300 relative overflow-hidden group ${
              isCompleted 
                ? 'bg-slate-100 border-transparent text-slate-500 cursor-default' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0'
            }`}
          >
            {isCompleted ? (
              <span className="flex items-center animate-in fade-in zoom-in duration-300">
                <CheckCircle size={20} className="mr-2" /> ผ่านแล้ว
              </span>
            ) : (
              <span className="flex items-center relative z-10">
                {isMarking ? 'กำลังบันทึก...' : 'บันทึกว่าอ่านแล้ว'}
              </span>
            )}
          </button>

          <button 
            onClick={handleNext}
            disabled={currentIndex === sentences.length - 1 || isEditing}
            className="flex items-center justify-center w-12 h-12 md:w-auto md:px-6 md:py-3.5 rounded-full bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 transition-colors font-bold border border-transparent"
            aria-label="Next Sentence"
          >
            <span className="hidden md:inline">ถัดไป</span> <ChevronRight size={20} className="md:ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
