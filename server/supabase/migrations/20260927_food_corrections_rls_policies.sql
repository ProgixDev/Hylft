-- Migration: 20260927_food_corrections_rls_policies.sql
-- Update RLS policies to allow Admin to read and moderate all food corrections
-- and allow write operations on verified_food_values.

-- 1. Allow reading all food corrections (so admins can view and moderate)
DROP POLICY IF EXISTS "food_corrections_select_own" ON food_corrections;
DROP POLICY IF EXISTS "food_corrections_select_all" ON food_corrections;
CREATE POLICY "food_corrections_select_all" ON food_corrections
  FOR SELECT USING (true);

-- 2. Allow updating corrections (for admin approval / rejection)
DROP POLICY IF EXISTS "food_corrections_update_admin" ON food_corrections;
CREATE POLICY "food_corrections_update_admin" ON food_corrections
  FOR UPDATE USING (true);

-- 3. Allow writing to verified_food_values upon approval
DROP POLICY IF EXISTS "verified_food_values_write" ON verified_food_values;
CREATE POLICY "verified_food_values_write" ON verified_food_values
  FOR ALL USING (true);
