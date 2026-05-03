-- Persist the food thumbnail URL on each meal entry so the alimentation
-- tab can render images without re-querying the image lookup service.

alter table alimentation_meals
  add column if not exists image_url text;
