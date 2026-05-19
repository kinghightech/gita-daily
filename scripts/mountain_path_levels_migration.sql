-- Mountain Path — separate table, mirrors world_lotus_levels schema.
-- 23 climbing levels + 1 Wisdom Gate at id 24.

CREATE TABLE IF NOT EXISTS public.mountain_path_levels (
  id              integer PRIMARY KEY,
  title           text    NOT NULL,
  reading         text    NOT NULL,
  questions       jsonb   NOT NULL,
  difficulty_tier text    NOT NULL,
  is_wisdom_gate  boolean NOT NULL DEFAULT false
);

ALTER TABLE public.mountain_path_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mountain_path_levels are readable by anyone" ON public.mountain_path_levels;
CREATE POLICY "mountain_path_levels are readable by anyone"
  ON public.mountain_path_levels
  FOR SELECT
  USING (true);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_mountain_path_level integer NOT NULL DEFAULT 1;

-- Seed level 1 — Test Mountain Level
INSERT INTO public.mountain_path_levels (id, title, reading, questions, difficulty_tier, is_wisdom_gate)
VALUES (
  1,
  'Test Climb #1 — Reaching the Foothills',
  E'Welcome to the **Mountain Path**.\n\nThis is the **first test climb** for the Mountain Path. Its job is to confirm the reading layout and quiz UI for this path render correctly.\n\nThe Mountain Path explores **Ultimate Reality and the Soul** — Brahman, Atman, and the deeper questions of existence. Each shrine you reach is a milestone toward self-realization.\n\nRead this passage, then tap **Start Quiz** to continue.',
  '[
    {"question":"Which section of the app does the Mountain Path live in?","options":["The Learn tab","The World of Hinduism section","The Profile tab","The Read tab"],"correct_index":1},
    {"question":"What does the Mountain Path explore?","options":["Daily home rituals","Ultimate Reality and the Soul","Modern Hindu life in cities","Sacred rivers and pilgrimage"],"correct_index":1},
    {"question":"What does each shrine on the path represent?","options":["A festival","A milestone toward self-realization","A scripture","A deity"],"correct_index":1}
  ]'::jsonb,
  'intro',
  false
)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    reading = EXCLUDED.reading,
    questions = EXCLUDED.questions,
    difficulty_tier = EXCLUDED.difficulty_tier,
    is_wisdom_gate = EXCLUDED.is_wisdom_gate;

-- Seed levels 2-23 as placeholder climbs (same shape, so UI can be exercised)
INSERT INTO public.mountain_path_levels (id, title, reading, questions, difficulty_tier, is_wisdom_gate)
SELECT
  gs AS id,
  'Climb ' || gs || ' — Higher Ground' AS title,
  E'Placeholder reading for climb ' || gs || E'.\n\nThis level is reserved for **future content** about the Mountain Path. The reading and quiz UI render exactly the same as other levels, so the descent and progression logic can be verified end-to-end.\n\nTap **Start Quiz** to continue.' AS reading,
  '[
    {"question":"Is this a placeholder level?","options":["Yes","No","Maybe","Sometimes"],"correct_index":0},
    {"question":"What will replace this content later?","options":["Nothing","Real Mountain Path lessons on Brahman and Atman","Lotus Path content","Festival content"],"correct_index":1},
    {"question":"Should you keep climbing?","options":["No","Yes — every level is a milestone","Only on weekends","Only after the Wisdom Gate"],"correct_index":1}
  ]'::jsonb AS questions,
  'placeholder' AS difficulty_tier,
  false AS is_wisdom_gate
FROM generate_series(2, 23) AS gs
ON CONFLICT (id) DO NOTHING;

-- Wisdom Gate at id 24
INSERT INTO public.mountain_path_levels (id, title, reading, questions, difficulty_tier, is_wisdom_gate)
VALUES (
  24,
  'The Mountain Wisdom Gate',
  E'You have reached the **Wisdom Gate** of the Mountain Path.\n\nBeyond this gate lie the deepest teachings on Brahman and Atman. Pass this final reflection to complete the Mountain Path.',
  '[
    {"question":"What lies beyond the Wisdom Gate?","options":["Nothing","The deepest teachings on Brahman and Atman","A new app","More festivals"],"correct_index":1},
    {"question":"What does passing the Wisdom Gate mean?","options":["You are starting over","You have completed the Mountain Path","You skip the Lotus Path","You unlock the Garden Path"],"correct_index":1}
  ]'::jsonb,
  'gate',
  true
)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    reading = EXCLUDED.reading,
    questions = EXCLUDED.questions,
    difficulty_tier = EXCLUDED.difficulty_tier,
    is_wisdom_gate = EXCLUDED.is_wisdom_gate;
