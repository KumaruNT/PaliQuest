import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { BookOpen, Trophy, Flame, Target, ChevronRight, Play, History } from 'lucide-react';
import { getUserScore, getUserRank, getUserStreak, getLeaderboard } from '@/app/actions/scores';
import RandomGaengButton from '@/components/RandomGaengButton';

export default async function Home() {
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;

  // 1. Fetch Parts & Gaeng Counts
  const { data: allParts } = await supabase
    .from('parts')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  const { data: publishedStories } = await supabase
    .from('stories')
    .select('id, part_id, story_title, gaeng_number, book_page_start, book_page_end')
    .eq('status', 'published');

  const gaengCounts: Record<string, number> = {};
  if (publishedStories) {
    for (const s of publishedStories) {
      gaengCounts[s.part_id] = (gaengCounts[s.part_id] || 0) + 1;
    }
  }

  const partsWithStats = allParts?.map(part => ({
    ...part,
    gaengCount: gaengCounts[part.id] || 0
  })) || [];

  // 2. Fetch User Data (If logged in)
  let latestStory: any = null;
  let userScore: any = null;
  let userStreak: any = null;
  let leaderboard: any[] = [];
  let historyStories: any[] = [];
  let rank = 0;
  
  if (user) {
    const [scoreData, streakData, topUsers] = await Promise.all([
      getUserScore(user.id),
      getUserStreak(user.id),
      getLeaderboard()
    ]);
    
    userScore = scoreData;
    userStreak = streakData;
    leaderboard = topUsers || [];
    rank = await getUserRank(user.id, scoreData?.total_score || 0);

    // Fetch Latest Progress and History
    const { data: progressHistory } = await supabase
      .from('user_progress')
      .select('story_id, completed_at, stories(title, part_id)')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    const seenStoryIds = new Set();
    if (progressHistory) {
      for (const p of progressHistory) {
        if (!seenStoryIds.has(p.story_id)) {
          const storyData: any = Array.isArray(p.stories) ? p.stories[0] : p.stories;
          historyStories.push({
            id: p.story_id,
            title: storyData?.title,
            part_id: storyData?.part_id,
            completed_at: p.completed_at
          });
          seenStoryIds.add(p.story_id);
        }
        if (historyStories.length >= 5) break; // Keep top 5
      }
    }
    latestStory = historyStories.length > 0 ? historyStories[0] : null;
  }

  return (
    <div className="bg-zen-bg min-h-screen text-zen-ink font-sans pb-24 scroll-smooth">
      
      {/* SECTION 1: HERO (Thunder Style) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#EEF2FF] via-[#F4F7FB] to-white border-b border-zen-border pb-16 pt-8">
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-[100px]"></div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 text-center relative z-10">
          <div className="animate-fade-in inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white text-indigo-700 text-sm font-bold tracking-wide mb-8 border border-indigo-100 shadow-sm">
            <BookOpen size={16} className="text-indigo-500" /> แผนที่การเรียนรู้ภาษาบาลี
          </div>
          
          <h1 className="animate-slide-up opacity-0 delay-100 text-5xl md:text-7xl font-sans font-extrabold text-slate-800 mb-6 tracking-tight drop-shadow-sm">
            เรียนบาลี <span className="text-indigo-600 block md:inline mt-2 md:mt-0">ประโยค ๑–๒</span>
          </h1>
          
          <p className="animate-slide-up opacity-0 delay-200 text-lg md:text-xl mb-10 font-medium text-slate-500 max-w-2xl mx-auto leading-relaxed">
            ครบทั้งเส้นทางในหน้าเดียว ตั้งแต่อักษรตัวแรก จนถึงหน้าห้องสอบ ให้การเรียนบาลีเป็นเรื่องง่ายและสนุกกว่าที่เคย
          </p>
          
          {/* Pills row mimicking Thunder */}
          <div className="animate-slide-up opacity-0 delay-300 flex flex-wrap justify-center gap-3 mb-12">
            <span className="bg-white text-slate-600 px-5 py-2.5 rounded-full text-sm font-bold border border-slate-200 shadow-sm flex items-center gap-2"><BookOpen size={16} className="text-blue-500"/> เนื้อหา ๔ ภาคหลัก</span>
            <span className="bg-white text-slate-600 px-5 py-2.5 rounded-full text-sm font-bold border border-slate-200 shadow-sm flex items-center gap-2"><Play size={16} className="text-indigo-500"/> ฝึกจำสไตล์เกม</span>
            <span className="bg-white text-slate-600 px-5 py-2.5 rounded-full text-sm font-bold border border-slate-200 shadow-sm flex items-center gap-2"><Target size={16} className="text-pink-500"/> บอกจุดออกสอบบ่อย</span>
          </div>

          <div className="animate-slide-up opacity-0 delay-400 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link href="/api/continue" className="px-10 py-4 bg-indigo-600 text-white rounded-full font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:bg-indigo-700 flex items-center gap-2 text-lg">
                <Play fill="currentColor" size={18} /> เรียนต่อล่าสุด
              </Link>
            ) : (
              <Link href="/register" className="px-10 py-4 bg-indigo-600 text-white rounded-full font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:bg-indigo-700 flex items-center gap-2 text-lg">
                เริ่มเรียนฟรี
              </Link>
            )}
            <Link href="#parts" className="px-10 py-4 bg-white border border-slate-200 text-slate-700 rounded-full font-bold hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5 transition-all text-lg">
              ดูหลักสูตรทั้งหมด
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 space-y-16 mt-8 relative z-20">
        
        {/* SECTION 2: PERSONAL DASHBOARD (If Logged In) */}
        {user ? (
          <section id="dashboard" className="space-y-6 scroll-mt-24">
            {/* STATS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center text-center">
                <Trophy className="text-amber-500 mb-3" size={28} />
                <div className="text-2xl font-bold text-slate-800 mb-1">{(userScore?.total_score || 0).toLocaleString()}</div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">XP รวม</div>
              </div>
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center text-center">
                <Flame className="text-orange-500 mb-3" size={28} />
                <div className="text-2xl font-bold text-slate-800 mb-1">{userStreak?.current_streak || 0} วัน</div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">ความสม่ำเสมอ</div>
              </div>
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center text-center">
                <Target className="text-slate-400 mb-3" size={28} />
                <div className="text-2xl font-bold text-slate-800 mb-1">#{rank}</div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">อันดับของคุณ</div>
              </div>
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center text-center">
                <BookOpen className="text-indigo-500 mb-3" size={28} />
                <div className="text-2xl font-bold text-slate-800 mb-1">{userScore?.reading_score || 0}</div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">ประโยคที่ผ่านตา</div>
              </div>
            </div>

            {/* CONTINUE & HISTORY */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-bl-full -z-0"></div>
                <div className="relative z-10">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
                    <Play size={20} className="text-indigo-600" fill="currentColor" /> เป้าหมายปัจจุบัน
                  </h2>
                  
                  {latestStory ? (
                    <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                      <div>
                        <div className="text-sm text-slate-500 font-medium mb-1">เก็งล่าสุดที่กำลังศึกษา</div>
                        <h3 className="text-xl font-bold text-slate-800">{latestStory.title}</h3>
                      </div>
                      <Link href={`/gaeng/${latestStory.id}`} className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 hover:shadow-md transition-all shrink-0 w-full sm:w-auto text-center">
                        เรียนต่อ
                      </Link>
                    </div>
                  ) : (
                    <div className="bg-slate-50/80 rounded-2xl p-8 border border-slate-100 text-center">
                      <p className="text-slate-500 font-medium mb-6">คุณยังไม่ได้เริ่มต้นศึกษาเก็งใดๆ ในระบบ</p>
                      <Link href="#parts" className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 hover:shadow-md transition-all inline-block">
                        เริ่มเรียนเก็งแรก
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center justify-between text-slate-800">
                  <span>ประวัติการอ่าน</span>
                  <History size={18} className="text-slate-400" />
                </h2>
                {historyStories.length > 0 ? (
                  <ul className="space-y-4">
                    {historyStories.map((story, idx) => (
                      <li key={idx} className="flex items-start gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5 text-indigo-500">
                          <BookOpen size={14} />
                        </div>
                        <div>
                          <Link href={`/gaeng/${story.id}`} className="font-bold text-sm text-slate-700 hover:text-indigo-600 transition-colors line-clamp-1">
                            {story.title}
                          </Link>
                          <div className="text-xs font-medium text-slate-400 mt-1">
                            {new Date(story.completed_at).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8 text-sm font-medium text-slate-400 bg-slate-50 rounded-2xl">ยังไม่มีประวัติการอ่าน</div>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between w-full gap-6 text-center md:text-left">
            <div>
              <h3 className="text-2xl font-bold mb-2 text-slate-800">เริ่มต้นการเรียนของคุณ</h3>
              <p className="text-slate-500 font-medium">เข้าสู่ระบบเพื่อบันทึกความก้าวหน้า สะสมคะแนน และดูประวัติการเรียน</p>
            </div>
            <Link href="/login" className="px-10 py-3.5 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 hover:shadow-md transition-all shrink-0 whitespace-nowrap">
              เข้าสู่ระบบ
            </Link>
          </section>
        )}

        {/* SECTION 3: LEARNING MAP */}
        <section id="parts" className="scroll-mt-24">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">แผนที่การเรียน</h2>
              <p className="text-slate-500 font-medium">เลือกภาคที่คุณต้องการศึกษา</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {partsWithStats.map((part, idx) => {
              const hasData = part.gaengCount > 0;
              return (
                <div 
                  key={part.id}
                  className={`animate-slide-up opacity-0 group relative overflow-hidden rounded-3xl p-8 border transition-all duration-300 flex flex-col ${
                    hasData 
                      ? 'bg-white border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 hover:-translate-y-1' 
                      : 'bg-slate-50 border-slate-100 opacity-80'
                  }`}
                  style={{ animationDelay: `${idx * 150}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <h3 className="text-2xl font-bold text-slate-800 group-hover:text-indigo-700 transition-colors duration-300">
                      {part.title}
                    </h3>
                    {hasData ? (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                        พร้อมเรียน
                      </span>
                    ) : (
                      <span className="text-xs bg-slate-100 text-slate-400 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                        กำลังจัดทำ
                      </span>
                    )}
                  </div>
                  
                  <p className="text-slate-500 mb-8 flex-grow leading-relaxed relative z-10 font-medium">{part.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto relative z-10">
                    <div className="text-sm font-bold text-slate-400">
                      {hasData ? `${part.gaengCount} เก็งในบทนี้` : 'ยังไม่มีข้อมูล'}
                    </div>
                    {hasData && (
                      <Link 
                        href={`/part/${part.id}`}
                        className="inline-flex items-center gap-1 text-indigo-600 font-bold group-hover:gap-2 transition-all"
                      >
                        เข้าสู่บทเรียน <ChevronRight size={16} />
                      </Link>
                    )}
                  </div>

                  {/* Decorative faint icon */}
                  {hasData && (
                    <BookOpen className="absolute -bottom-6 -right-6 w-32 h-32 text-indigo-50 rotate-12 group-hover:scale-110 transition-all duration-300 z-0" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
          
          {/* SECTION 4: PRACTICE */}
          <section id="practice" className="md:col-span-2 scroll-mt-24">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">ฝึกวันนี้</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Random Card */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                    <Play size={24} fill="currentColor" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-800 group-hover:text-blue-700 transition-colors">สุ่มเก็ง</h3>
                  <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">ให้ระบบเลือกเก็งที่เหมาะกับคุณเพื่อทบทวนความรู้</p>
                </div>
                {user ? (
                  <RandomGaengButton gaengs={publishedStories || []} />
                ) : (
                  <Link href="/login" className="block w-full text-center px-4 py-3.5 bg-slate-50 text-slate-400 rounded-full font-bold hover:bg-slate-100 transition-colors">
                    เข้าสู่ระบบเพื่อสุ่ม
                  </Link>
                )}
              </div>

              {/* Quiz Card */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-100 transition-all">
                    <Target size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-800 group-hover:text-indigo-700 transition-colors">ทดสอบความรู้</h3>
                  <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">ทำแบบทดสอบจากเก็งที่คุณเคยอ่านผ่านตามาแล้ว</p>
                </div>
                {user ? (
                  <Link href="/quiz" className="block w-full text-center px-4 py-3.5 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 hover:shadow-md transition-all shadow-sm">
                    เริ่มทดสอบ
                  </Link>
                ) : (
                  <Link href="/login" className="block w-full text-center px-4 py-3.5 bg-slate-50 text-slate-400 rounded-full font-bold hover:bg-slate-100 transition-colors">
                    เข้าสู่ระบบเพื่อทดสอบ
                  </Link>
                )}
              </div>

            </div>
          </section>

          {/* SECTION 5: SCOREBOARD */}
          <section id="scoreboard" className="md:col-span-1 scroll-mt-24">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">อันดับผู้นำ <Trophy size={20} className="text-amber-500" /></h2>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
              {user ? (
                <>
                  {leaderboard.length > 0 ? (
                    <ul className="space-y-3">
                      {leaderboard.slice(0, 10).map((u, idx) => (
                        <li key={idx} className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${idx === 0 ? 'bg-amber-50/50 border-amber-200 shadow-sm' : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200'}`}>
                          <div className="flex items-center gap-4">
                            <span className={`font-bold w-6 text-center ${idx === 0 ? 'text-amber-500 text-lg' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-orange-400' : 'text-slate-300'}`}>
                              {idx + 1}
                            </span>
                            <span className={`font-bold text-sm truncate max-w-[100px] text-slate-700 ${idx === 0 && 'text-amber-700'}`}>{u.display_name}</span>
                          </div>
                          <span className={`font-bold text-sm ${idx === 0 ? 'text-amber-600' : 'text-indigo-600'}`}>{u.total_score.toLocaleString()} XP</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-6 text-sm font-medium text-slate-400">ยังไม่มีข้อมูล</div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="mx-auto text-slate-200 mb-4" size={40} />
                  <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">เข้าสู่ระบบเพื่อดูอันดับและการแข่งขันกับเพื่อนร่วมเรียน</p>
                  <Link href="/login" className="inline-block px-8 py-3 bg-indigo-50 text-indigo-700 rounded-full font-bold hover:bg-indigo-100 hover:shadow-sm transition-all">
                    เข้าสู่ระบบ
                  </Link>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
