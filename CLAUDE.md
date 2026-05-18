# Gita Daily — CLAUDE.md

## What This App Is

Dharma Daily is a mobile app (Expo/React Native) that delivers daily Bhagavad Gita wisdom. Users get a verse of the day, can explore all 701 verses, follow a 50-level learning path (Lotus Path), track streaks, earn badges, browse a Hindu festival calendar, and read chapters with audio playback.

## Tech Stack

- **Expo** 54 (managed workflow, New Architecture enabled)
- **React Native** 0.81 / **React** 19
- **expo-router** 6 — file-based routing
- **Supabase** — PostgreSQL database + Auth (email/password, OAuth)
- **NativeWind** 4 + **Tailwind CSS** 3 — styling
- **react-native-reanimated** 4 — animations
- **TypeScript** (strict)
- **AsyncStorage** — local persistence

## Project Structure

```
app/
  _layout.tsx          # Root layout: auth guard, onboarding, streak init
  (tabs)/
    _layout.tsx        # Tab bar (Home, Verses, Read, Learn, Profile)
    index.tsx          # Home — Verse of the Day + streak
    verses.tsx         # Verse explorer (search, chapter filter, mood search)
    read.tsx           # Chapter reader (audio, notes, bookmarks)
    learn.tsx          # Lotus Path + Festival calendar
    profile.tsx        # User profile, badges, settings, stats
  badges.tsx           # Badge detail page

components/
  gita/                # App-specific components (QuoteCard, StreakModal, etc.)
  learning/            # LotusLevel, IndianCalendar, LevelContent
  ui/                  # Generic UI (buttons, cards, dialogs, loaders)

lib/                   # All business logic — touch this most often
  supabase.ts          # Supabase client
  verses.ts            # Verse fetching + VOTD calculation
  profile.ts           # User profile, streaks, bookmarks
  favorites.ts         # Like/unlike verses & festivals
  lotus.ts             # Lotus Path level progression
  badges.ts            # Achievement badge definitions + awarding
  notes.ts             # Verse notes (create/edit/delete)
  festivals.ts         # Festival data + emoji mapping
  preferredLanguage.ts # Language preference (EN/HI) persistence

hooks/                 # use-color-scheme, use-theme-color
constants/theme.ts     # Colors, fonts
Data/mockverses.ts     # 3 fallback verses for testing
```

## Database (Supabase)

Key tables:
- `gita_verses` — 716 verses (chapter_number, verse_number, english, hindi, speaker, context)
- `gita_chapters` — chapter metadata
- `profiles` — user state (streak_count, longest_streak, current_lotus_level, preferred_language, bookmark_chapter/verse, shares_count, last_opened_at)
- `user_favorites` — verse likes (user_id, verse_id)
- `user_festival_favorites` — festival likes
- `user_notes` — per-verse annotations
- `lotus_levels` — 50 levels with reading text + JSON questions array
- `festivals` — 2026 Hindu festival calendar with rich metadata

Key RPCs:
- `handle_daily_streak(user_timezone)` — streak logic lives in DB
- `incrementSharesCount()` — tracks shares

## Key Patterns

**Verse of the Day**: Random verse seeded by the local calendar date (`seededRandomForDate` in `lib/verses.ts`). Same verse all day, unpredictable across days, pulled from `gita_verses` by index.

**Cross-component events** (DeviceEventEmitter):
- `FAVORITES_UPDATED_EVENT`
- `STREAK_UPDATED_EVENT`
- `PREFERRED_LANGUAGE_CHANGED_EVENT`
- `NOTES_UPDATED_EVENT`
- `FESTIVALS_UPDATED_EVENT`

**Fallback/resilience**: Profile fetches cascade through multiple schema strategies (auth metadata → profile table → legacy column names). Always wrap DB calls in try/catch.

**Optimistic updates**: Favorites toggle updates UI immediately, reverts on error.

**Screen refresh**: Use `useFocusEffect` (not `useEffect`) for data that should reload when navigating back to a screen.

**Language**: English and Hindi both stored per verse. Preference persisted to both `profiles` table and auth metadata for redundancy. Use `loadPreferredLanguageForCurrentUser()` / `savePreferredLanguageForCurrentUser()` from `lib/preferredLanguage.ts`.

## Styling Conventions

- Dark-first color scheme
- Primary background: `#0F172A`, accent/gold: `#FBBF24`, text: `#FEF3C7`, card bg: `#1E293B`
- Native screens use `StyleSheet.create()` inline; NativeWind className for utilities
- Linear gradients common in headers/heroes
- Platform-specific files: `.native.tsx` for native-only, `.web.ts` for web-only

## Dev Scripts

```bash
npx expo start          # Start dev server
npx expo start --ios    # iOS simulator
npx expo start --android
npx expo start --web
expo lint               # ESLint
```

## Auth & Onboarding

- No guest mode — auth required
- Onboarding collects: name, goals, language, reminder time
- Profile stored in both `profiles` table and Supabase auth metadata (redundancy)
- Session persisted via AsyncStorage

## Lotus Path (Learning)

- 50 levels, sequential unlock
- Each level: reading passage + 3-question quiz
- Pass criteria: 2/3 correct
- `updateCurrentLotusLevel(levelId)` only advances if user is currently at that level

## Badges

Defined in `lib/badges.ts` as `BADGE_DEFINITIONS` array with criteria functions. Call `checkAndAwardBadges(stats)` after any user action that might trigger one. Current badges cover: welcome, first verse, streak milestones (7/30/100 days), levels (10/50), favorites (5/25), festival, notes (5).

## Things to Watch Out For

- The `profiles` table has had schema changes — `lib/profile.ts` has fallback logic for legacy column names. Don't remove that resilience.
- `Data/mockverses.ts` is only for fallback/testing — not a data source.
- `app/(tabs)/explore.tsx` exists but is hidden (`href: null`) — ignore it.
- Festival data is hardcoded to 2026 — will need updating for future years.
- `framer-motion` is web-only; don't use it in native screens.
