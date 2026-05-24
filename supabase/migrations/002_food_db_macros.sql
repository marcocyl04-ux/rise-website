-- Add nutrition macros columns to food_database
-- Part of the nutrition macros upgrade.
-- Run with: supabase db push --project-ref zeczlwypqqvvpraosodv

ALTER TABLE public.food_database
ADD COLUMN IF NOT EXISTS calories_per_portion numeric,
ADD COLUMN IF NOT EXISTS fat_per_portion numeric,
ADD COLUMN IF NOT EXISTS sugar_per_portion numeric;

-- Add macro total columns to meal_logs
ALTER TABLE public.meal_logs
ADD COLUMN IF NOT EXISTS total_calories_kcal integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_fat_g numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_sugar_g numeric DEFAULT 0;