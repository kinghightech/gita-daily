-- World Lotus Path — fresh, simple table, completely separate from lotus_levels.
-- Schema mirrors lotus_levels for parity, so the level UI reuses the same shape.

CREATE TABLE IF NOT EXISTS public.world_lotus_levels (
  id              integer PRIMARY KEY,
  title           text    NOT NULL,
  reading         text    NOT NULL,
  questions       jsonb   NOT NULL,
  difficulty_tier text    NOT NULL
);

ALTER TABLE public.world_lotus_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "world_lotus_levels are readable by anyone" ON public.world_lotus_levels;
CREATE POLICY "world_lotus_levels are readable by anyone"
  ON public.world_lotus_levels
  FOR SELECT
  USING (true);

-- Per-user progression column. Idempotent if already present from prior migration.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_world_lotus_level integer NOT NULL DEFAULT 1;

-- Level 1 — Test Lotus #1: validates the reading + quiz + pass UI.
INSERT INTO public.world_lotus_levels (id, title, reading, questions, difficulty_tier)
VALUES (
  1,
  'Test Lotus #1 — Reading + Quiz UI',
  E'This is the **first test lotus** for the World Lotus Path.\n\nIts only job is to confirm the reading layout, the **quiz flow**, the reveal bar, and the success result screen all render correctly.\n\nThe World Lotus Path lives inside the **World of Hinduism** section. It is completely separate from the Learn-section Lotus Path, with its own table, its own data, and its own progress.\n\nRead this passage, then tap **Start Quiz** to try the sample questions below.',
  '[
    {"question":"Where does the World Lotus Path live in the app?","options":["Inside the Learn tab","Inside the World of Hinduism section","Inside the Profile tab","Inside the Read tab"],"correct_index":1},
    {"question":"What is the purpose of this first test lotus?","options":["To award a special badge","To unlock all future levels at once","To verify the reading and quiz UI work correctly","To replace the Learn-section Lotus Path"],"correct_index":2},
    {"question":"How is the World Lotus Path related to the Learn-section Lotus Path?","options":["They share the same data and progress","They are two completely separate paths","The World path is a copy that mirrors the Learn path","The Learn path is a preview of the World path"],"correct_index":1}
  ]'::jsonb,
  'intro'
)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    reading = EXCLUDED.reading,
    questions = EXCLUDED.questions,
    difficulty_tier = EXCLUDED.difficulty_tier;

-- Level 2 — Test Lotus #2: validates progression (unlocks after passing level 1).
INSERT INTO public.world_lotus_levels (id, title, reading, questions, difficulty_tier)
VALUES (
  2,
  'Test Lotus #2 — Progression UI',
  E'This is the **second test lotus**.\n\nIf you can see this screen, it means **passing level 1 successfully unlocked level 2** and the progression UI (green path animation, unlocked lotus state, level chip) is working as expected.\n\nFinish this short quiz to also verify the **completed** state on level 2 and the bumped progress bar at the top of the path.',
  '[
    {"question":"What does reaching this screen prove?","options":["The app crashed","Level 1 unlocked Level 2 correctly","The Learn path is broken","Nothing — every level is always unlocked"],"correct_index":1},
    {"question":"After finishing this level, what should happen on the path screen?","options":["Nothing changes","The lotus for level 2 shows as completed and the progress bar advances","Level 1 becomes locked again","The app returns to onboarding"],"correct_index":1},
    {"question":"Which table stores this content?","options":["lotus_levels","world_lotus_levels","profiles","world_lotus_progress"],"correct_index":1}
  ]'::jsonb,
  'intro'
)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    reading = EXCLUDED.reading,
    questions = EXCLUDED.questions,
    difficulty_tier = EXCLUDED.difficulty_tier;
