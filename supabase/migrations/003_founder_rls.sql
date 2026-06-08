-- Migration: Add 'founder' role support to RLS policies
-- Run this in Supabase Dashboard > SQL Editor
-- Date: 2026-06-08
-- 
-- What this does: Updates all RLS policies that check for 'coach' role
-- to also accept 'founder' role. Founders get superset access.

-- 1. user_profiles: Coaches+Founders can view team profiles
DROP POLICY IF EXISTS "Coaches can view team profiles" ON public.user_profiles;
CREATE POLICY "Coaches and founders can view team profiles"
  ON public.user_profiles FOR SELECT
  USING (
    get_user_role() IN ('coach', 'founder')
    AND get_user_team_id() = team_id
  );

-- 2. baseline_intake: Coaches+Founders can view team baselines
DROP POLICY IF EXISTS "Coaches can view team baselines" ON public.baseline_intake;
CREATE POLICY "Coaches and founders can view team baselines"
  ON public.baseline_intake FOR SELECT
  USING (
    get_user_role() IN ('coach', 'founder')
    AND get_user_team_id() = (
      SELECT team_id FROM user_profiles WHERE user_profiles.id = baseline_intake.user_id
    )
  );

-- 3. daily_weight: Coaches+Founders can view team weights
DROP POLICY IF EXISTS "Coaches can view team weights" ON public.daily_weight;
CREATE POLICY "Coaches and founders can view team weights"
  ON public.daily_weight FOR SELECT
  USING (
    get_user_role() IN ('coach', 'founder')
    AND get_user_team_id() = (
      SELECT team_id FROM user_profiles WHERE user_profiles.id = daily_weight.user_id
    )
  );

-- 4. meal_logs: Coaches+Founders can view team meals
DROP POLICY IF EXISTS "Coaches can view team meals" ON public.meal_logs;
CREATE POLICY "Coaches and founders can view team meals"
  ON public.meal_logs FOR SELECT
  USING (
    get_user_role() IN ('coach', 'founder')
    AND get_user_team_id() = (
      SELECT team_id FROM user_profiles WHERE user_profiles.id = meal_logs.user_id
    )
  );

-- 5. food_database: Coaches+Founders can manage
DROP POLICY IF EXISTS "Coaches can manage food database" ON public.food_database;
CREATE POLICY "Coaches and founders can manage food database"
  ON public.food_database FOR ALL
  USING (get_user_role() IN ('coach', 'founder'));

-- Verify: Check all policies
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND policyname LIKE '%coach%' OR policyname LIKE '%founder%'
ORDER BY tablename, policyname;
