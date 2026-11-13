-- Foods created by a user when a product is missing from OpenFoodFacts.
-- Private: each row is only visible to (and usable by) the user who created it.
-- Nutrition values are per 100 g, same convention as OpenFoodFacts products.

CREATE TABLE IF NOT EXISTS user_foods (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           text        NOT NULL,
  brand          text,
  barcode        text,
  serving_size_g numeric,
  calories       numeric     NOT NULL DEFAULT 0,
  protein        numeric     NOT NULL DEFAULT 0,
  carbs          numeric     NOT NULL DEFAULT 0,
  fat            numeric     NOT NULL DEFAULT 0,
  -- Optional detailed values per 100 g, keyed like the app's FoodItem
  -- (sugars, fiber, saturatedFat, salt, vitaminC, ...). Whitelisted server-side.
  nutrients      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_foods_user_idx ON user_foods (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS user_foods_user_barcode_idx ON user_foods (user_id, barcode)
  WHERE barcode IS NOT NULL;

ALTER TABLE user_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_foods_owner ON user_foods
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
