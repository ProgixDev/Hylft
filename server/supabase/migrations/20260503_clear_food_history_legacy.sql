-- Wipe food_history rows that were populated by the previous nutrition
-- providers (FatSecret / OpenFoodFacts). Their food_id formats and image
-- URLs no longer resolve after the migration to Spoonacular, so the cards
-- showed broken thumbnails or stale data when users reopened the search.
--
-- Safe to run as a one-shot truncate: per-user history rebuilds on next
-- food selection via NutritionService.recordFoodSelection.

truncate table public.food_history;
