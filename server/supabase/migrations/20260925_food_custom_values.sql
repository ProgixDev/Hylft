-- User-corrected nutrition values for products with wrong/missing data in OpenFoodFacts.
-- Keyed by (user_id, food_id) so each user can have their own corrections.

CREATE TABLE IF NOT EXISTS food_custom_values (
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id    text        NOT NULL,
  food_name  text        NOT NULL,
  calories   numeric     NOT NULL DEFAULT 0,
  protein    numeric     NOT NULL DEFAULT 0,
  carbs      numeric     NOT NULL DEFAULT 0,
  fat        numeric     NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, food_id)
);

CREATE INDEX food_custom_values_user_idx ON food_custom_values (user_id);

ALTER TABLE food_custom_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY food_custom_values_owner ON food_custom_values
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
