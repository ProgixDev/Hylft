-- Migration: 20260927_food_corrections.sql
-- Food corrections table for user submissions & admin moderation
-- Approved corrections are stored in verified_food_values for global app visibility.

CREATE TABLE IF NOT EXISTS food_corrections (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id             text NOT NULL,
  food_name           text NOT NULL,
  brand               text,
  image_url           text,
  original_calories   numeric NOT NULL DEFAULT 0,
  original_protein    numeric NOT NULL DEFAULT 0,
  original_carbs      numeric NOT NULL DEFAULT 0,
  original_fat        numeric NOT NULL DEFAULT 0,
  calories            numeric NOT NULL DEFAULT 0,
  protein             numeric NOT NULL DEFAULT 0,
  carbs               numeric NOT NULL DEFAULT 0,
  fat                 numeric NOT NULL DEFAULT 0,
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason    text,
  reviewed_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Global verified food values table (populated upon admin approval)
CREATE TABLE IF NOT EXISTS verified_food_values (
  food_id             text PRIMARY KEY,
  food_name           text NOT NULL,
  brand               text,
  image_url           text,
  calories            numeric NOT NULL DEFAULT 0,
  protein             numeric NOT NULL DEFAULT 0,
  carbs               numeric NOT NULL DEFAULT 0,
  fat                 numeric NOT NULL DEFAULT 0,
  verified_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS food_corrections_status_idx ON food_corrections (status);
CREATE INDEX IF NOT EXISTS food_corrections_food_idx ON food_corrections (food_id);
CREATE INDEX IF NOT EXISTS food_corrections_user_idx ON food_corrections (user_id);

ALTER TABLE food_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_food_values ENABLE ROW LEVEL SECURITY;

-- Everyone can read verified food values
CREATE POLICY "verified_food_values_read_all" ON verified_food_values
  FOR SELECT USING (true);

-- Authenticated users can view their own corrections & insert new corrections
CREATE POLICY "food_corrections_select_own" ON food_corrections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "food_corrections_insert_own" ON food_corrections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
