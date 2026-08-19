'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Play, RotateCw, Trophy, ArrowRight, X } from 'lucide-react';

type Gaeng = {
  id: string;
  story_title: string;
  gaeng_number: number;
  book_page_start: number;
  book_page_end: number;
};

export default function RandomGaengButton({ gaengs }: { gaengs: Gaeng[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<Gaeng | null>(null);
  const [displayIndex, setDisplayIndex] = useState(0);
  const router = useRouter();

  // Audio Context
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && !audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContext();
    }
    return () => {
      if (!isOpen && audioCtxRef.current?.state !== 'closed') {
        audioCtxRef.current?.close();
        audioCtxRef.current = null;
      }
    };
  }, [isOpen]);

  const playTickSound = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  };

  const playTadaSound = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    playNote(261.63, 0, 0.2); // C4
    playNote(329.63, 0.15, 0.2); // E4
    playNote(392.00, 0.3, 0.2); // G4
    playNote(523.25, 0.45, 1.0); // C5
    playNote(392.00, 0.45, 1.0); // G4
    playNote(329.63, 0.45, 1.0); // E4
  };

  const startSpin = () => {
    if (isSpinning || !gaengs || gaengs.length === 0) return;
    setIsSpinning(true);
    setResult(null);

    const winnerIndex = Math.floor(Math.random() * gaengs.length);
    const totalSpins = 30 + Math.floor(Math.random() * 10);
    
    let currentSpin = 0;
    let delay = 50;
    let currentIndex = displayIndex;

    const spinStep = () => {
      currentIndex = (currentIndex + 1) % gaengs.length;
      setDisplayIndex(currentIndex);
      playTickSound();
      
      currentSpin++;
      
      if (currentSpin < totalSpins) {
        if (currentSpin > totalSpins - 15) delay += 25;
        else if (currentSpin > totalSpins - 5) delay += 50;
        setTimeout(spinStep, delay);
      } else {
        setDisplayIndex(winnerIndex);
        setResult(gaengs[winnerIndex]);
        setIsSpinning(false);
        setTimeout(playTadaSound, 200);
      }
    };

    spinStep();
  };

  const closeModal = () => {
    if (isSpinning) return;
    setIsOpen(false);
    setResult(null);
  };

  const openModal = () => {
    if (!gaengs || gaengs.length === 0) {
      alert("ยังไม่มีเก็งในระบบตอนนี้");
      return;
    }
    setIsOpen(true);
  };

  const currentDisplay = result ? result : (gaengs && gaengs.length > 0 ? gaengs[displayIndex] : null);

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-lg flex flex-col items-center text-center relative overflow-hidden transform animate-in zoom-in-95 duration-200">
        
        <button 
          onClick={closeModal} 
          disabled={isSpinning}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 disabled:opacity-50 p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-slate-800 mb-2">สุ่มเก็ง</h2>
        <p className="text-sm text-slate-500 font-medium mb-8">ให้ระบบช่วยเลือกเก็งเพื่อทบทวนความรู้</p>

        <div className="relative w-full">
          {/* Pointer Triangle */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-180 text-indigo-500 z-10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 22h20L12 2z" />
            </svg>
          </div>

          {/* Wheel Display Area */}
          <div className={`w-full py-10 px-4 rounded-3xl mb-8 transition-colors duration-300 ${result ? 'bg-amber-50 border-2 border-amber-200 shadow-inner' : 'bg-slate-50 border-2 border-slate-200'}`}>
            {currentDisplay ? (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 text-slate-500 rounded-full text-[10px] font-bold tracking-widest uppercase mb-4 shadow-sm">
                  เก็งที่ {currentDisplay.gaeng_number}
                </div>
                
                <h3 className={`text-xl md:text-2xl font-bold mb-3 transition-colors ${result ? 'text-amber-600' : 'text-slate-800'}`}>
                  {currentDisplay.story_title}
                </h3>
                
                <p className="text-slate-400 font-bold text-xs">
                  หน้า {currentDisplay.book_page_start} - {currentDisplay.book_page_end}
                </p>
              </>
            ) : (
              <p className="text-slate-500 font-bold">ไม่พบเก็ง</p>
            )}
          </div>
        </div>

        {/* Controls */}
        {result ? (
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button 
              onClick={startSpin}
              className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-full font-bold text-sm hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCw size={18} /> สุ่มใหม่
            </button>
            <button 
              onClick={() => router.push(`/gaeng/${result.id}`)}
              className="flex-1 py-3.5 bg-indigo-600 text-white rounded-full font-bold text-sm hover:bg-indigo-700 hover:shadow-md hover:-translate-y-1 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Trophy size={18} /> อ่านเก็งนี้ <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <button 
            onClick={startSpin}
            disabled={isSpinning || !gaengs || gaengs.length === 0}
            className="w-full py-4 bg-indigo-600 text-white rounded-full font-bold text-lg hover:bg-indigo-700 hover:shadow-md hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2 shadow-sm"
          >
            {isSpinning ? (
              <span className="animate-pulse">กำลังหมุน...</span>
            ) : (
              <>
                <Play size={20} fill="currentColor" /> สุ่มเลย!
              </>
            )}
          </button>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <button 
        onClick={openModal}
        className="block w-full text-center px-4 py-3.5 bg-blue-50 text-blue-700 rounded-full font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm"
      >
        สุ่มเก็งเลย
      </button>

      {mounted && typeof document !== 'undefined' && createPortal(modalContent, document.body)}
    </>
  );
}
