-- 1. user_progress (Relational, no arrays for sentences)
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  sentence_id UUID REFERENCES sentences(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sentence_id) -- Prevent duplicate progress
);
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read their own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);

-- 2. user_scores
CREATE TABLE user_scores (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  reading_score INT DEFAULT 0,
  quiz_score INT DEFAULT 0,
  review_score INT DEFAULT 0,
  streak_score INT DEFAULT 0,
  total_score INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_scores ENABLE ROW LEVEL SECURITY;
-- STRICT RLS: Users can ONLY SELECT public info, and NO ONE can UPDATE from the client
CREATE POLICY "Anyone can read user scores for leaderboard" ON user_scores FOR SELECT USING (true);
-- Notice: NO INSERT/UPDATE/DELETE policies for users. Must be done via Server/RPC.

-- 3. user_streaks
CREATE TABLE user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE
);
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own streak" ON user_streaks FOR SELECT USING (auth.uid() = user_id);

-- 4. quizzes
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  source_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own quizzes" ON quizzes FOR SELECT USING (auth.uid() = user_id);

-- 5. quiz_questions
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  sentence_id UUID REFERENCES sentences(id) ON DELETE CASCADE,
  question_type TEXT,
  question_text TEXT,
  option_data JSONB,
  correct_option TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
-- STRICT RLS: User can only read questions for their quizzes. NO UPDATE/INSERT from client.
CREATE POLICY "Users can read questions for their own quizzes" ON quiz_questions FOR SELECT USING (
  quiz_id IN (SELECT id FROM quizzes WHERE user_id = auth.uid())
);

-- 6. quiz_attempts
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  score INT,
  total INT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own attempts" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);
