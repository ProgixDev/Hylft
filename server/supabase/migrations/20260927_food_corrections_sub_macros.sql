-- Migration: 20260927_food_corrections_sub_macros.sql
-- Add micronutrients and serving size to food_corrections and verified_food_values

ALTER TABLE food_corrections
  ADD COLUMN IF NOT EXISTS original_sugars numeric,
  ADD COLUMN IF NOT EXISTS original_saturated_fat numeric,
  ADD COLUMN IF NOT EXISTS original_fiber numeric,
  ADD COLUMN IF NOT EXISTS original_salt numeric,
  ADD COLUMN IF NOT EXISTS original_serving_size numeric,
  ADD COLUMN IF NOT EXISTS sugars numeric,
  ADD COLUMN IF NOT EXISTS saturated_fat numeric,
  ADD COLUMN IF NOT EXISTS fiber numeric,
  ADD COLUMN IF NOT EXISTS salt numeric,
  ADD COLUMN IF NOT EXISTS serving_size numeric;

ALTER TABLE verified_food_values
  ADD COLUMN IF NOT EXISTS sugars numeric,
  ADD COLUMN IF NOT EXISTS saturated_fat numeric,
  ADD COLUMN IF NOT EXISTS fiber numeric,
  ADD COLUMN IF NOT EXISTS salt numeric,
  ADD COLUMN IF NOT EXISTS serving_size numeric;
