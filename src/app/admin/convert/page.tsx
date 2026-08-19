'use client';

import { useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, ArrowLeft, Eye, Download, Code } from 'lucide-react';
import Link from 'next/link';
import * as mammoth from 'mammoth';

export default function AdminImportPage() {
  const [partNumber, setPartNumber] = useState<number>(1);
  const [gaengOrder, setGaengOrder] = useState<number>(1);
  const gaengId = `part${partNumber}-gaeng${gaengOrder.toString().padStart(2, '0')}`;
  const [file, setFile] = useState<File | null>(null);
  const [canonicalJson, setCanonicalJson] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'validating' | 'ready' | 'importing' | 'success' | 'error'>('idle');
  const [importResult, setImportResult] = useState<{message: string, stats: any} | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const handleDownloadJson = () => {
    if (!canonicalJson) return;
    const blob = new Blob([JSON.stringify(canonicalJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${canonicalJson.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setStatus('idle');
      setError('');
      setCanonicalJson(null);
      setImportResult(null);
      setShowRawJson(false);
    }
  };

  const parseUnstructuredWord = (html: string, inputId: string, inputOrder: number) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // We want to process block-level elements linearly
    const elements = Array.from(doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li'));

    let bookPageStart = null;
    let bookPageEnd = null;
    let storyTitle = '';

    const sentences: any[] = [];
    let currentPali: string | null = null;
    
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const text = el.textContent?.trim() || '';
      if (!text) continue;

      // Extract Metadata from text patterns
      const pageMatch = text.match(/หน้า\s*(\d+)\s*-\s*(\d+)/);
      if (pageMatch && !bookPageStart) {
        bookPageStart = parseInt(pageMatch[1]);
        bookPageEnd = parseInt(pageMatch[2]);
      }

      const titleMatch = text.match(/^หน้า\s*\d+\s*-\s*(.+)/);
      if (titleMatch && !storyTitle) {
        storyTitle = titleMatch[1].trim();
      }

      // Check for Pali (Bullet point or starts with •)
      const isListItem = el.tagName.toLowerCase() === 'li';
      const startsWithBullet = text.startsWith('•') || text.startsWith('·');

      if (isListItem || startsWithBullet) {
        if (currentPali !== null) {
          throw new Error(`ประโยคบาลีไม่มีคำแปลตามหลัง: "${currentPali}"`);
        }
        
        const cleanedPali = text.replace(/^[•·]\s*/, '').trim();
        currentPali = cleanedPali;
        continue;
      }

      // If we have an active Pali, this text must be the translation
      if (currentPali !== null) {
        sentences.push({
          order: sentences.length + 1,
          pali: currentPali,
          translation: text,
          source_page: null,
          status: 'verified'
        });
        currentPali = null; // Reset for next sentence
      }
    }

    if (currentPali !== null) {
      throw new Error(`ประโยคบาลีสุดท้ายไม่มีคำแปลตามหลัง: "${currentPali}"`);
    }

    if (!storyTitle) {
      throw new Error("ไม่สามารถหา 'ชื่อเรื่อง' ได้ (ต้องมีข้อความรูปแบบ 'หน้า X - ชื่อเรื่อง')");
    }

    if (sentences.length === 0) {
      throw new Error("ไม่พบประโยคบาลีเลย (บาลีต้องขึ้นต้นด้วยจุด Bullet • หรือเป็นลิสต์)");
    }

    // Set markers from first and last sentence
    const startMarker = sentences.length > 0 ? sentences[0].pali.substring(0, 50) + "..." : "";
    const endMarker = sentences.length > 0 ? sentences[sentences.length - 1].pali.substring(0, 50) + "..." : "";

    return {
      id: inputId,
      order: inputOrder,
      story_title: storyTitle,
      source: {
        book_page_start: bookPageStart,
        book_page_end: bookPageEnd,
        start_marker: startMarker,
        end_marker: endMarker,
      },
      sentences: sentences.map(s => ({
        ...s,
        id: `${inputId}-s${s.order}`
      }))
    };
  };

  const validateCanonicalJson = (json: any) => {
    if (!json.id) throw new Error("Missing required field: id");
    if (json.order === null || isNaN(json.order)) throw new Error("order must be integer");
    if (!json.story_title) throw new Error("Missing required field: story_title");
    
    if (!json.source) throw new Error("Missing source object");
    if (json.source.book_page_start === null || isNaN(json.source.book_page_start)) throw new Error("book_page_start must be valid integer");
    if (json.source.book_page_end === null || isNaN(json.source.book_page_end)) throw new Error("book_page_end must be valid integer");
    if (!json.source.start_marker) throw new Error("Missing required field: start_marker");
    if (!json.source.end_marker) throw new Error("Missing required field: end_marker");

    if (!json.sentences || !Array.isArray(json.sentences) || json.sentences.length === 0) {
      throw new Error("sentences must be non-empty");
    }

    const seenOrders = new Set<number>();
    const seenIds = new Set<string>();
    const validStatuses = ['draft', 'verified', 'published'];

    for (let i = 0; i < json.sentences.length; i++) {
      const s = json.sentences[i];
      if (s.order === null || isNaN(s.order)) throw new Error(`Sentence ${s.order || i}: sentence order cannot be missing`);
      if (seenOrders.has(s.order)) throw new Error(`Duplicate sentence order: ${s.order}`);
      seenOrders.add(s.order);

      if (!s.pali) throw new Error(`Sentence ${s.order}: empty pali`);
      if (!s.translation) throw new Error(`Sentence ${s.order}: empty translation`);
      
      if (s.source_page !== null && isNaN(s.source_page)) throw new Error(`Sentence ${s.order}: source_page must be null or integer`);
      if (!validStatuses.includes(s.status)) throw new Error(`Sentence ${s.order}: invalid status '${s.status}'`);

      if (!s.id) throw new Error(`Sentence ${s.order}: missing id`);
      if (seenIds.has(s.id)) throw new Error(`Sentence ${s.order}: duplicate generated sentence id ${s.id}`);
      seenIds.add(s.id);
    }
  };

  const handleValidate = async () => {
    if (!gaengOrder || gaengOrder <= 0) {
      setError('กรุณาระบุเก็งที่ (Order) ให้ถูกต้องก่อนทำการอัปโหลด');
      return;
    }
    if (!file) {
      setError('กรุณาเลือกไฟล์ Word ก่อน');
      return;
    }

    setStatus('validating');
    setError('');
    
    try {
      let canonical: any = null;

      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        
        canonical = parseUnstructuredWord(result.value, gaengId, gaengOrder);
      } else {
        throw new Error('ประเภทไฟล์ไม่รองรับ กรุณาอัปโหลดไฟล์ .docx เท่านั้น');
      }

      validateCanonicalJson(canonical);
      
      setCanonicalJson(canonical);
      setStatus('ready');
    } catch (e: any) {
      setError(e.message || 'Validation failed');
      setStatus('error');
    }
  };

  const importCanonicalGaeng = async (json: any) => {
    const res = await fetch('/api/admin/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partNumber,
        data: json
      })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'การนำเข้าล้มเหลว');
    }
    return data;
  };

  const handleImport = async () => {
    if (!canonicalJson) return;
    setStatus('importing');
    setError('');

    try {
      const data = await importCanonicalGaeng(canonicalJson);
      setImportResult({ message: data.message, stats: data.stats });
      setStatus('success');
      setFile(null);
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/admin" className="text-zen-ink/60 hover:text-zen-ink transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold text-zen-ink">แปลง Word เป็น JSON</h1>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-zen-border">
        {status === 'success' && importResult ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 mb-4 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Import สำเร็จ</h2>
            
            <div className="bg-white rounded-lg p-6 max-w-sm mx-auto mb-8 text-left shadow-sm border border-green-100 space-y-2">
              <div className="flex justify-between border-b border-green-50 pb-2">
                <span className="text-gray-500">Gaeng:</span>
                <span className="font-bold text-gray-800">{canonicalJson?.story_title || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-green-50 pb-2">
                <span className="text-gray-500">Sentences:</span>
                <span className="font-bold text-gray-800">
                  {importResult.stats.updated > 0 ? importResult.stats.updated : importResult.stats.created}
                </span>
              </div>
              <div className="flex justify-between border-b border-green-50 pb-2">
                <span className="text-gray-500">Part:</span>
                <span className="font-bold text-gray-800">{partNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Gaeng Number:</span>
                <span className="font-bold text-gray-800">{canonicalJson?.order || '-'}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => { setStatus('idle'); setImportResult(null); setFile(null); setCanonicalJson(null); }}
                className="px-6 py-2.5 bg-white text-green-700 border border-green-300 rounded-lg hover:bg-green-50 font-medium w-full sm:w-auto transition-colors"
              >
                นำเข้าไฟล์อื่น
              </button>
              
              {importResult.stats.storyId && (
                <Link 
                  href={`/gaeng/${importResult.stats.storyId}`}
                  className="flex items-center justify-center px-6 py-2.5 bg-zen-accent text-white rounded-lg hover:bg-opacity-90 font-medium w-full sm:w-auto transition-colors"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  ดูเนื้อหา
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Part Selection */}
              <div>
                <label className="block text-sm font-bold text-zen-ink mb-2">ภาค (Part)</label>
                <select 
                  value={partNumber} 
                  onChange={(e) => setPartNumber(Number(e.target.value))}
                  className="w-full p-3 border border-zen-border rounded-xl bg-zen-bg text-zen-ink focus:outline-none focus:ring-2 focus:ring-zen-accent"
                >
                  <option value={1}>ภาค 1</option>
                  <option value={2}>ภาค 2</option>
                  <option value={3}>ภาค 3</option>
                  <option value={4}>ภาค 4</option>
                </select>
              </div>

              {/* Gaeng Order */}
              <div>
                <label className="block text-sm font-bold text-zen-ink mb-2">เก็งที่ (Order)</label>
                <input 
                  type="number"
                  value={gaengOrder}
                  onChange={(e) => setGaengOrder(parseInt(e.target.value) || 1)}
                  className="w-full p-3 border border-zen-border rounded-xl bg-zen-bg text-zen-ink focus:outline-none focus:ring-2 focus:ring-zen-accent"
                  placeholder="เช่น 1"
                />
              </div>

              {/* Gaeng ID */}
              <div>
                <label className="block text-sm font-bold text-zen-ink mb-2">รหัส ID (สร้างอัตโนมัติ)</label>
                <input 
                  type="text"
                  value={gaengId}
                  readOnly
                  disabled
                  className="w-full p-3 border border-zen-border rounded-xl bg-zen-bg/50 text-zen-ink/60 focus:outline-none font-mono text-sm cursor-not-allowed"
                />
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-bold text-zen-ink mb-2">เลือกไฟล์ข้อมูล Word ต้นฉบับ</label>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-zen-border border-dashed rounded-xl cursor-pointer bg-zen-bg hover:bg-zen-border/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-10 h-10 text-zen-ink/40 mb-3" />
                    <p className="mb-2 text-sm text-zen-ink/60">
                      <span className="font-semibold text-zen-ink">คลิกเพื่ออัปโหลด</span> หรือลากไฟล์มาวาง
                    </p>
                    <p className="text-xs text-zen-ink/50">รองรับไฟล์ Word (.docx ข้อความอิสระ) เท่านั้น</p>
                  </div>
                  <input id="dropzone-file" type="file" className="hidden" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} />
                </label>
              </div>
            </div>

            {file && status === 'idle' && (
              <div className="flex flex-col sm:flex-row justify-between items-center bg-zen-bg p-4 rounded-xl border border-zen-border gap-4">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-zen-ink break-all">{file.name}</span>
                  <span className="ml-3 text-xs bg-zen-border text-zen-ink/60 px-2 py-1 rounded font-medium uppercase shrink-0">
                    {file.name.split('.').pop()}
                  </span>
                </div>
                <div className="flex space-x-3 shrink-0">
                  <button 
                    onClick={() => { setFile(null); }}
                    className="text-xs text-zen-ink/50 hover:text-red-500 transition-colors font-medium underline px-2"
                  >
                    ลบไฟล์/เลือกใหม่
                  </button>
                  <button 
                    onClick={handleValidate}
                    className="px-5 py-2 bg-zen-accent text-white text-sm rounded-lg hover:bg-opacity-90 transition-colors font-medium shadow-sm"
                  >
                    ตรวจสอบข้อมูล
                  </button>
                </div>
              </div>
            )}

            {status === 'validating' && (
              <div className="text-center p-4 text-zen-accent font-medium animate-pulse">กำลังแปลงข้อความเป็น Canonical JSON...</div>
            )}

            {error && (
              <div className="flex items-start bg-red-50 p-4 rounded-xl border border-red-100 text-red-700">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">เกิดข้อผิดพลาดในการตรวจสอบไฟล์</p>
                  <pre className="text-sm mt-2 whitespace-pre-wrap font-sans">{error}</pre>
                </div>
              </div>
            )}

            {canonicalJson && (status === 'ready' || status === 'importing') && (
              <div className="border border-zen-border rounded-xl overflow-hidden shadow-sm">
                <div className="bg-zen-bg px-6 py-4 border-b border-zen-border flex justify-between items-center">
                  <h3 className="font-bold text-zen-ink">3. Preview (Canonical JSON)</h3>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setShowRawJson(!showRawJson)}
                      className="flex items-center px-3 py-1.5 bg-white border border-zen-border text-zen-ink/80 rounded hover:bg-zen-border/30 transition-colors text-xs font-medium"
                    >
                      <Code className="w-3.5 h-3.5 mr-1" />
                      {showRawJson ? 'ซ่อน JSON' : 'ดู JSON'}
                    </button>
                    <button 
                      onClick={handleDownloadJson}
                      className="flex items-center px-3 py-1.5 bg-white border border-zen-border text-zen-ink/80 rounded hover:bg-zen-border/30 transition-colors text-xs font-medium"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      ดาวน์โหลด JSON
                    </button>
                  </div>
                </div>

                <div className="p-6 text-zen-ink space-y-4 text-sm bg-white">
                  {showRawJson ? (
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                      {JSON.stringify(canonicalJson, null, 2)}
                    </pre>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-zen-border pb-6">
                        <div>
                          <h4 className="font-bold text-zen-ink/60 uppercase text-xs mb-3 tracking-wider">Metadata</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between"><span className="text-zen-ink/60">id:</span> <span className="font-mono">{canonicalJson.id}</span></div>
                            <div className="flex justify-between"><span className="text-zen-ink/60">order:</span> <span className="font-bold">{canonicalJson.order}</span></div>
                            <div className="flex justify-between"><span className="text-zen-ink/60">story_title:</span> <span className="font-bold">{canonicalJson.story_title}</span></div>
                            <div className="flex justify-between"><span className="text-zen-ink/60">book pages:</span> <span>{canonicalJson.source.book_page_start} - {canonicalJson.source.book_page_end}</span></div>
                            <div className="flex justify-between"><span className="text-zen-ink/60">start_marker:</span> <span className="truncate ml-2" title={canonicalJson.source.start_marker}>{canonicalJson.source.start_marker}</span></div>
                            <div className="flex justify-between"><span className="text-zen-ink/60">end_marker:</span> <span className="truncate ml-2" title={canonicalJson.source.end_marker}>{canonicalJson.source.end_marker}</span></div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-zen-ink/60 uppercase text-xs mb-3 tracking-wider">Statistics</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between"><span className="text-zen-ink/60">sentence count:</span> <span className="font-bold text-lg">{canonicalJson.sentences.length}</span></div>
                            <div className="flex flex-col mt-4">
                              <span className="text-zen-ink/60">First 3 sentences:</span>
                              {canonicalJson.sentences.slice(0, 3).map((s: any, idx: number) => (
                                <span key={idx} className="italic text-xs mt-1 bg-zen-bg p-2 rounded truncate">{s.pali}</span>
                              ))}
                            </div>
                            <div className="flex flex-col mt-2">
                              <span className="text-zen-ink/60">Last 3 sentences:</span>
                              {canonicalJson.sentences.slice(-3).map((s: any, idx: number) => (
                                <span key={idx} className="italic text-xs mt-1 bg-zen-bg p-2 rounded truncate">{s.pali}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="bg-zen-bg px-6 py-4 border-t border-zen-border flex justify-end items-center gap-4">
                  <button
                    onClick={() => { setCanonicalJson(null); setStatus('idle'); }}
                    className="px-6 py-2.5 text-zen-ink/60 hover:text-zen-ink font-medium transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    onClick={handleImport}
                    disabled={status === 'importing'}
                    className="px-8 py-2.5 bg-zen-accent text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 font-bold shadow-md transition-colors"
                  >
                    {status === 'importing' ? 'กำลังนำเข้า...' : 'นำเข้า Supabase'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
