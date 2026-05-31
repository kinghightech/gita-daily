-- Garden Path setup. Content rows are managed in Supabase; this keeps the
-- table, public read policy, and per-user progress column aligned with the app.

CREATE TABLE IF NOT EXISTS public.garden_path_levels (
  id              integer PRIMARY KEY,
  title           text    NOT NULL,
  reading         text,
  questions       jsonb,
  difficulty_tier text    NOT NULL,
  is_wisdom_gate  boolean NOT NULL DEFAULT false,
  blocks          jsonb   NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE public.garden_path_levels
  ADD COLUMN IF NOT EXISTS reading text,
  ADD COLUMN IF NOT EXISTS questions jsonb,
  ADD COLUMN IF NOT EXISTS difficulty_tier text,
  ADD COLUMN IF NOT EXISTS is_wisdom_gate boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocks jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.garden_path_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "garden_path_levels are readable by anyone" ON public.garden_path_levels;
CREATE POLICY "garden_path_levels are readable by anyone"
  ON public.garden_path_levels
  FOR SELECT
  USING (true);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_garden_path_level integer NOT NULL DEFAULT 1;
