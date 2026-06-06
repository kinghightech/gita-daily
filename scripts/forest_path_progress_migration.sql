-- Forest Path progress tracking.
-- The forest_path_levels table already exists (35 lessons + a wisdom gate at id 36).
-- This adds the per-user progress pointer the Forest Path screen reads/writes,
-- matching current_world_lotus_level / current_mountain_path_level / current_garden_path_level.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_forest_path_level integer NOT NULL DEFAULT 1;
