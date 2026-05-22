-- RISE Website - Current Schema & RLS Policies
-- Exported: 2026-05-22
-- Supabase project: zeczlwypqqvvpraosodv

-- ============================================================
-- RLS-enabled tables
-- ============================================================

-- Tables with Row Level Security enabled:
--   baseline_intake
--   daily_weight
--   food_database
--   meal_logs
--   user_profiles

-- ============================================================
-- RLS Policies (from pg_policies)
-- ============================================================

-- baseline_intake
--   "Coaches can view team baselines"  SELECT  PERMISSIVE  {public}
--     qual: ((get_user_role() = 'coach'::text) AND (get_user_team_id() = (
--       SELECT user_profiles.team_id FROM user_profiles
--       WHERE (user_profiles.id = baseline_intake.user_id))))
--   "Users can insert own baseline"     INSERT  PERMISSIVE  {public}
--     with_check: (auth.uid() = user_id)
--   "Users can update own baseline"     UPDATE  PERMISSIVE  {public}
--     qual: (auth.uid() = user_id)
--   "Users can view own baseline"       SELECT  PERMISSIVE  {public}
--     qual: (auth.uid() = user_id)

-- daily_weight
--   "Coaches can view team weights"     SELECT  PERMISSIVE  {public}
--     qual: ((get_user_role() = 'coach'::text) AND (get_user_team_id() = (
--       SELECT user_profiles.team_id FROM user_profiles
--       WHERE (user_profiles.id = daily_weight.user_id))))
--   "Users can manage own weight"       ALL     PERMISSIVE  {public}
--     qual: (auth.uid() = user_id)

-- food_database
--   "Anyone can view food database"     SELECT  PERMISSIVE  {public}
--     qual: true
--   "Coaches can manage food database"  ALL     PERMISSIVE  {public}
--     qual: (get_user_role() = 'coach'::text)

-- meal_logs
--   "Coaches can view team meals"       SELECT  PERMISSIVE  {public}
--     qual: ((get_user_role() = 'coach'::text) AND (get_user_team_id() = (
--       SELECT user_profiles.team_id FROM user_profiles
--       WHERE (user_profiles.id = meal_logs.user_id))))
--   "Users can manage own meals"        ALL     PERMISSIVE  {public}
--     qual: (auth.uid() = user_id)

-- user_profiles
--   "Coaches can view team profiles"    SELECT  PERMISSIVE  {public}
--     qual: ((get_user_role() = 'coach'::text) AND (get_user_team_id() = team_id))
--   "Users can insert own profile"      INSERT  PERMISSIVE  {public}
--     with_check: (auth.uid() = id)
--   "Users can update own profile"      UPDATE  PERMISSIVE  {public}
--     qual: (auth.uid() = id)
--   "Users can view own profile"        SELECT  PERMISSIVE  {public}
--     qual: (auth.uid() = id)

-- ============================================================
-- Raw pg_policies output:
-- ============================================================
-- schemaname | tablename       | policyname                       | permissive | roles   | cmd    | qual                                                                                                | with_check
-- public     | baseline_intake | Coaches can view team baselines  | PERMISSIVE | {public}| SELECT | ((get_user_role() = 'coach' AND get_user_team_id() = (...)))                                        | NULL
-- public     | baseline_intake | Users can insert own baseline    | PERMISSIVE | {public}| INSERT | NULL                                                                                                | (auth.uid() = user_id)
-- public     | baseline_intake | Users can update own baseline    | PERMISSIVE | {public}| UPDATE | (auth.uid() = user_id)                                                                              | NULL
-- public     | baseline_intake | Users can view own baseline      | PERMISSIVE | {public}| SELECT | (auth.uid() = user_id)                                                                              | NULL
-- public     | daily_weight    | Coaches can view team weights    | PERMISSIVE | {public}| SELECT | ((get_user_role() = 'coach' AND get_user_team_id() = (...)))                                        | NULL
-- public     | daily_weight    | Users can manage own weight      | PERMISSIVE | {public}| ALL    | (auth.uid() = user_id)                                                                              | NULL
-- public     | food_database   | Anyone can view food database    | PERMISSIVE | {public}| SELECT | true                                                                                                | NULL
-- public     | food_database   | Coaches can manage food database | PERMISSIVE | {public}| ALL    | (get_user_role() = 'coach')                                                                         | NULL
-- public     | meal_logs       | Coaches can view team meals      | PERMISSIVE | {public}| SELECT | ((get_user_role() = 'coach' AND get_user_team_id() = (...)))                                        | NULL
-- public     | meal_logs       | Users can manage own meals       | PERMISSIVE | {public}| ALL    | (auth.uid() = user_id)                                                                              | NULL
-- public     | user_profiles   | Coaches can view team profiles   | PERMISSIVE | {public}| SELECT | ((get_user_role() = 'coach' AND get_user_team_id() = team_id))                                      | NULL
-- public     | user_profiles   | Users can insert own profile     | PERMISSIVE | {public}| INSERT | NULL                                                                                                | (auth.uid() = id)
-- public     | user_profiles   | Users can update own profile     | PERMISSIVE | {public}| UPDATE | (auth.uid() = id)                                                                                   | NULL
-- public     | user_profiles   | Users can view own profile       | PERMISSIVE | {public}| SELECT | (auth.uid() = id)                                                                                   | NULL
