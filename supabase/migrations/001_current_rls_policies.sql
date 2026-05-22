-- RISE Nutrition Tracker — Current RLS Policies
-- Captured: 2026-05-22
-- These policies are already live in Supabase. This file is for documentation/version control.

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_team_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT team_id FROM public.user_profiles WHERE id = auth.uid();
$$;

-- ========== user_profiles ==========
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Coaches can view team profiles"
  ON public.user_profiles FOR SELECT
  USING (
    get_user_role() = 'coach'
    AND get_user_team_id() = team_id
  );

-- ========== baseline_intake ==========
ALTER TABLE public.baseline_intake ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own baseline"
  ON public.baseline_intake FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own baseline"
  ON public.baseline_intake FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own baseline"
  ON public.baseline_intake FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view team baselines"
  ON public.baseline_intake FOR SELECT
  USING (
    get_user_role() = 'coach'
    AND get_user_team_id() = (
      SELECT team_id FROM user_profiles WHERE user_profiles.id = baseline_intake.user_id
    )
  );

-- ========== daily_weight ==========
ALTER TABLE public.daily_weight ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own weight"
  ON public.daily_weight FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view team weights"
  ON public.daily_weight FOR SELECT
  USING (
    get_user_role() = 'coach'
    AND get_user_team_id() = (
      SELECT team_id FROM user_profiles WHERE user_profiles.id = daily_weight.user_id
    )
  );

-- ========== meal_logs ==========
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own meals"
  ON public.meal_logs FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view team meals"
  ON public.meal_logs FOR SELECT
  USING (
    get_user_role() = 'coach'
    AND get_user_team_id() = (
      SELECT team_id FROM user_profiles WHERE user_profiles.id = meal_logs.user_id
    )
  );

-- ========== food_database ==========
ALTER TABLE public.food_database ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view food database"
  ON public.food_database FOR SELECT
  USING (true);

CREATE POLICY "Coaches can manage food database"
  ON public.food_database FOR ALL
  USING (get_user_role() = 'coach');
