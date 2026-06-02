# Dharma Daily — Widget Context Handoff

## What This App Is
Dharma Daily is an Expo/React Native iOS app that delivers daily Bhagavad Gita wisdom. It shows a verse of the day, lets users explore all 716 verses, follow a 50-level learning path (Lotus Path), track streaks, earn badges, and browse a Hindu festival calendar.

## Tech Stack
- **Expo 54** (bare workflow — has `ios/` directory with native code)
- **React Native 0.81 / React 19**
- **expo-router 6** — file-based routing
- **Supabase** — PostgreSQL + Auth
- **NativeWind 4 + Tailwind CSS 3**
- **TypeScript (strict)**
- **expo-dev-client** — development builds (NOT Expo Go)

## Project Location
`/Users/aahishabbani/Projects/Dharma-daily`

## Key Files & Folders
```
app/
  (tabs)/
    index.tsx          # Home screen — Verse of the Day + streak
    verses.tsx         # Verse explorer
    read.tsx           # Chapter reader
    learn.tsx          # Lotus Path + Festival calendar
    profile.tsx        # User profile, badges, stats
lib/
  verses.ts            # Verse fetching + VOTD calculation (seededRandomForDate)
  supabase.ts          # Supabase client
  profile.ts           # User profile, streaks, bookmarks
assets/images/
  icon.png             # App icon (1254×1254, set as app icon)
ios/
  gitadaily/
    Images.xcassets/AppIcon.appiconset/   # Native app icon (resized to 1024×1024)
  DharmaDailyWidget/
    DharmaDailyWidget.swift               # ALL widget UI and logic
    DharmaDailyWidgetBundle.swift         # Widget entry point
    DharmaDailyWidgetControl.swift        # Unused boilerplate (@available iOS 18+)
    DharmaDailyWidgetLiveActivity.swift   # Unused boilerplate
    Info.plist
  gitadaily.xcodeproj/project.pbxproj    # Xcode project file
  gitadaily.xcworkspace                  # Open THIS in Xcode (not .xcodeproj)
  Podfile                                # CocoaPods config
```

## Database (Supabase)
- `gita_verses` — 716 verses (chapter_number, verse_number, english, hindi, speaker, context)
- `profiles` — user state
- `user_favorites`, `user_notes`, `lotus_levels`, `festivals`

Key RPC: `handle_daily_streak(user_timezone)`

## App Theme / Colors
- Background: `#0F172A` (dark navy)
- Accent/gold: `#FBBF24`
- Text: `#FEF3C7` (cream)
- Card bg: `#1E293B`

## How to Run
```bash
# Terminal — start Metro bundler
npx expo start

# Xcode — Cmd+R to build and install on device
# Open: ios/gitadaily.xcworkspace
```
The app is a **development build** (uses expo-dev-client). You need Metro running AND the app installed via Xcode. The app connects to Metro over local network (scan QR if it doesn't auto-connect).

---

## iOS Widget — Current State

### What We've Done
The widget is a native SwiftUI WidgetKit extension in `ios/DharmaDailyWidget/DharmaDailyWidget.swift`.

**Fixes applied this session:**
1. Widget deployment target changed from `26.5` → `17.0` (was preventing widget from installing on device)
2. `DharmaDailyWidgetControl` marked `@available(iOS 18.0, *)` and removed from bundle (was causing build error)
3. `expo-gl` deadlock fixed in `node_modules/expo-gl/ios/EXGLContext.mm` — changed `dispatch_sync` → `dispatch_async` in `onApplicationWillResignActive:` (was causing watchdog crash on backgrounding)
4. App icon set from `assets/images/icon.png` (resized to 1024×1024)
5. CocoaPods xcodeproj gem patched to support object version 70 (Xcode 26 project format)
6. Podfile updated with `GCC_WARN_INHIBIT_ALL_WARNINGS` and `SWIFT_SUPPRESS_WARNINGS` to suppress 196 third-party warnings

### Widget Architecture
The widget lives entirely in `DharmaDailyWidget.swift`. It:
- Fetches the verse of the day from Supabase directly (same seeded random algorithm as the app)
- Supports **small** and **medium** sizes
- Refreshes daily at midnight
- Uses hardcoded Supabase credentials (public anon key, safe)

### Widget Colors (in the Swift file)
```swift
static let widgetBg = Color(red: 0, green: 0, blue: 0)  // pure black
static let gold     = Color(red: 251/255, green: 191/255, blue: 36/255)  // #FBBF24
static let cream    = Color(red: 254/255, green: 243/255, blue: 199/255)  // #FEF3C7
```

### Widget Layout — Small
```
Ch.17 · v.27          ← 10pt gold, top
"Verse text here..."  ← 18pt cream, lineLimit 7, minimumScaleFactor 0.6
[Spacer]
— Krishna             ← 11pt gold, bottom
```

### Widget Layout — Medium
```
VERSE OF THE DAY    Ch.17 · v.27    ← 9pt gold header
────────────────────────────────    ← gold divider
"Verse text here, this is the..."   ← 20pt cream, lineLimit 5, minScale 0.5
— Krishna                           ← 11pt gold
```

### Current Outstanding Issue
The small widget still has a layout problem where there's empty space at the bottom. The `Spacer(minLength: 2)` between the verse text and `— Krishna` should push Krishna to the bottom of the widget, but iOS caches widget renders aggressively. **After any rebuild, you must remove the widget from the home screen and re-add it** for changes to appear.

The verse text uses `font size 18, lineLimit 7, minimumScaleFactor 0.6` — for long verses this scales down to ~11pt and shows 7 lines. The user wants the text to fill the widget as much as possible.

### Known Issues / Notes
- All 196 Xcode warnings are from third-party Expo packages (node_modules) — not the app's code. They don't affect functionality.
- The CocoaPods xcodeproj gem was patched at `/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec/gems/xcodeproj-1.27.0/lib/xcodeproj/constants.rb` to add `70 => 'Xcode 16.0'` to the compatibility map.
- `node_modules/expo-gl/ios/EXGLContext.mm` line 94: changed `dispatch_sync` → `dispatch_async` (crash fix, will be overwritten on npm install)

### Building
```bash
cd ios
# Build for device
xcodebuild -workspace gitadaily.xcworkspace -scheme gitadaily -destination generic/platform=iOS

# Build for simulator
xcodebuild -workspace gitadaily.xcworkspace -scheme gitadaily \
  -destination 'platform=iOS Simulator,id=11AB99CE-8342-48BF-BB26-B411299A1E49' \
  -configuration Debug build
```
Simulator ID `11AB99CE-8342-48BF-BB26-B411299A1E49` = iPhone 17 Pro.
