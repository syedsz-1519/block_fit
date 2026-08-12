# 🧩 WoodBlock Saga — Product Requirements Document (PRD)

**Version**: 1.0  
**Date**: August 12, 2026  
**Status**: Approved  
**Previous Name**: Block Fit  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision](#2-product-vision)
3. [Game Modes](#3-game-modes)
4. [Characters & Abilities](#4-characters--abilities)
5. [Customization System](#5-customization-system)
6. [Engagement & Retention Systems](#6-engagement--retention-systems)
7. [Multiplayer System](#7-multiplayer-system)
8. [AI-Powered Features](#8-ai-powered-features)
9. [Accessibility](#9-accessibility)
10. [Sound & Music Design](#10-sound--music-design)
11. [Technical Architecture](#11-technical-architecture)
12. [Development Phases](#12-development-phases)
13. [Success Metrics](#13-success-metrics)
14. [Risk Assessment](#14-risk-assessment)
15. [Decisions Log](#15-decisions-log)

---

## 1. Executive Summary

**WoodBlock Saga** (formerly Block Fit) is a premium geometric block-fitting puzzle game being redesigned from a React/Vite web app into a **full 3D Unity Android application** with realistic wooden aesthetics. The existing web version will be maintained as a separate product alongside the new mobile experience.

The game targets **mass-market appeal** — casual commuters, puzzle enthusiasts, competitive gamers, and families — with a focus on quality over speed (no deadline pressure).

### Why Users Will Choose WoodBlock Saga

The puzzle market is crowded. Block Blast, Woodoku, and 1010! dominate downloads. But none of them offer what WoodBlock Saga delivers **all in one package**:

| Competitor | What They Lack | WoodBlock Saga's Edge |
|:---|:---|:---|
| **Block Blast** | No story, no multiplayer, no customization | Full story mode with cutscenes, 1v1 battles, deep customization |
| **Woodoku** | No AI, no ranked seasons, basic sounds | AI opponents & hints, ranked seasons, ASMR soundscapes |
| **1010!** | No accessibility, no offline sync, stale | Full accessibility suite, offline-first, constant evolution |
| **Tetris** | Licensed IP, no block-fitting grid mechanic | Original IP, unique grid-fill mechanic |

### The Pitch

> *"WoodBlock Saga is the only block puzzle game where you can play a story campaign with animated cutscenes and unlockable characters, battle friends 1v1 in real-time, compete in ranked seasons, get AI-powered hints, play offline with cloud sync, customize everything from block skins to board themes, enjoy ASMR wooden sound design — and it's fully accessible for everyone."*

---

## 2. Product Vision

### 2.1 Core Identity

| Attribute | Decision |
|:---|:---|
| **Genre** | Geometric block-fitting puzzle |
| **Visual Style** | Realistic 3D wooden blocks with grain textures, cast shadows, and warm table surface |
| **Audio Style** | Mixed soundscapes per world/theme — ASMR wood-taps, orchestral, lo-fi, synth |
| **Target Audience** | Mass-market: casual, competitive, families, accessibility-first |
| **Monetization (MVP)** | Completely free — growth focus. IAP cosmetics & season pass in v2.0+ |
| **Platforms** | Unity Android (primary) + existing Web version (maintained separately) |
| **Art Assets** | AI-generated textures (Stable Diffusion / Midjourney → imported as PBR materials) |
| **Story Depth** | Full cutscenes with character animations between campaign levels |
| **Age Rating** | PEGI 3 / ESRB Everyone |
| **Language** | English only for MVP |

### 2.2 Grid System

Variable grid sizes per mode for optimal gameplay variety:

| Mode | Grid Size | Rationale |
|:---|:---|:---|
| Campaign | 8×8 | Balanced challenge, familiar from current version |
| Endless / Classic | 10×10 | Industry standard (like 1010!, Block Blast), broad appeal |
| Sudoku Hybrid | 6×6 | Fits 3×2 Sudoku sub-grids, manageable complexity |
| Daily Challenge | 8×8 or 10×10 | Varies daily for freshness |
| Multiplayer | 8×8 | Standardized for fair competitive play |

---

## 3. Game Modes

All 4 existing modes completely reimagined, plus 2 new modes.

### 3.1 🏰 Campaign Mode — "The Woodcraft Saga"

A story-driven campaign with **full animated cutscenes**, unlockable characters, and world progression.

- **30+ levels** across **5 thematic worlds**, each with a unique visual environment, soundtrack, and puzzle mechanic
- **Star rating system**: 1-3 stars per level based on moves, time, and completion
- **Boss levels**: End-of-world puzzles with special mechanics (rotating blocks, locking/unlocking cells)
- **Full cutscenes** between major story beats with character dialogue and animations

#### The Five Worlds

| # | World | Theme | Difficulty | Soundtrack | Special Mechanic |
|:---|:---|:---|:---|:---|:---|
| 1 | **The Workshop** | Cozy woodworker's studio | Tutorial / Easy | Lo-fi acoustic guitar | Basic block placement |
| 2 | **The Enchanted Forest** | Magical woodland | Medium | Celtic harp & flute | Glowing rune blocks with bonus effects |
| 3 | **The Clockwork Factory** | Steampunk machinery | Medium-Hard | Tick-tock steampunk | Timed puzzle variants, moving cells |
| 4 | **The Frozen Peaks** | Icy mountain temple | Hard | Ethereal choir & piano | Ice blocks that slide after placement |
| 5 | **The Dragon's Forge** | Volcanic forge | Expert | Epic orchestral drums | Fire blocks that spread, boss dragon battle |

### 3.2 ⚡ Speedrun Mode — "Time Trial"

Competitive time-attack on any unlocked campaign level.

- **Ghost replays**: Watch the #1 player's solution as a transparent overlay while you play
- **Personal best tracking** with delta time display (+/- seconds vs your PB)
- **Speedrun categories**: Any%, 100% (all stars), and Per-World
- **Seasonal leaderboards** that reset monthly with archived hall-of-fame

### 3.3 📅 Daily Challenge — "The Daily Woodwork"

A shared daily puzzle experience with social features.

- **Deterministically seeded puzzle** generated fresh every day (same puzzle for all players worldwide)
- **Streak system**: Consecutive daily completions build a streak multiplier
  - 7-day streak → Bronze badge
  - 30-day streak → Silver badge
  - 90-day streak → Gold badge
  - 365-day streak → Diamond badge
- **Daily leaderboard**: Ranked by score (moves × time × star bonus)
- **Share card**: Beautiful shareable image card for Instagram/WhatsApp showing your daily result (no puzzle spoilers)
- **AI competitors**: 5 AI "ghost players" with varying skill levels always populate the leaderboard

### 3.4 🎨 Sudoku Color Hybrid — "Chromatic Puzzle"

Block-fitting meets Sudoku color-exclusivity on a 6×6 grid.

- 6×6 grid with 3×2 sub-grid Sudoku color rules
- **No repeating colors** in any row, column, or sub-grid
- **Color-blind accessible**: Every color has a unique **pattern overlay** (stripes, dots, diamonds) in addition to color
- **Difficulty tiers**:
  - Beginner: 3 colors
  - Intermediate: 4 colors
  - Expert: 6 colors
- **Daily Chromatic Challenge**: A seeded daily Sudoku variant

### 3.5 🆕 Endless Mode — "The Infinite Table"

The classic 10×10 block puzzle experience — WoodBlock Saga's most accessible mode.

- 10×10 grid, blocks appear in sets of 3
- Clear full rows or columns to score
- Game ends when no block can be placed
- **Combo system**: Clear multiple lines simultaneously for multiplier bonuses (2x, 3x, 4x...)
- **Power-ups** (earned through gameplay, never purchased):

| Power-Up | Icon | Effect | Earn Method |
|:---|:---|:---|:---|
| Hammer | 🔨 | Destroy a single cell | Clear 5 lines in one game |
| Rotate | 🔄 | Rotate the current block 90° | Complete 3 daily challenges |
| Bomb | 💣 | Clear a 3×3 area | Achieve a 10x combo |

### 3.6 🆕 Multiplayer Arena

Multiple multiplayer formats for social and competitive play. See [§7 Multiplayer System](#7-multiplayer-system).

---

## 4. Characters & Abilities

**8 unlockable characters**, each with a unique passive ability that provides a strategic advantage. Characters appear in cutscenes and are rendered as small animated companions during gameplay.

| Character | Unlock Condition | Ability Name | Description |
|:---|:---|:---|:---|
| **Oakley** 🌳 | Free (default) | *Steady Hands* | +5 seconds on all timed modes |
| **Willow** 🌿 | Complete World 1 | *Nature's Gift* | Streak protection — 1 free missed day per week |
| **Cogsworth** ⚙️ | Complete World 3 | *Clockwork Precision* | Shows optimal placement hint once per level |
| **Frostine** ❄️ | Complete World 4 | *Frozen Moment* | Pause timer for 3 seconds (once per game) |
| **Ember** 🔥 | Complete World 5 | *Dragon's Eye* | Reveals upcoming block set (preview next 3 blocks) |
| **Pixel** 👾 | 30-day login streak | *Retro Recall* | Undo last 2 moves instead of 1 |
| **Luna** 🌙 | Win 50 multiplayer matches | *Moonlight* | Opponent's board is dimmed for 5 seconds in 1v1 |
| **Sage** 🧙 | 100% campaign completion | *Master Craftsman* | All other abilities at 50% power |

---

## 5. Customization System

### 5.1 Block Skins

Visual themes for block pieces — all unlockable through gameplay:

| Skin | Style | Unlock |
|:---|:---|:---|
| **Classic Oak** | Warm oak grain texture | Default |
| **Dark Walnut** | Rich dark wood | Complete 10 campaign levels |
| **Bamboo** | Light, green-tinted | Win 5 Daily Challenges |
| **Cherry Blossom** | Pink-tinted wood with petal patterns | 14-day streak |
| **Marble** | White marble with grey veins | Complete World 3 |
| **Obsidian** | Black glossy volcanic glass | Complete World 5 |
| **Crystal** | Transparent with refractive light effects | 50 achievements unlocked |
| **Neon Glow** | Glowing edges on dark blocks (legacy web callback) | Link web account |

### 5.2 Board Themes

Full environment reskins that change the table surface, frame, lighting, and ambient particles:

| Theme | Visual | Unlock |
|:---|:---|:---|
| **Workshop Table** | Warm wooden workbench, tool rack background | Default |
| **Zen Garden** | Sand surface, stones, bamboo frame, cherry blossoms | Complete World 2 |
| **Space Station** | Metallic grid, starfield background, floating particles | 30-day streak |
| **Underwater** | Coral frame, bubble particles, ocean caustic lighting | Complete Sudoku Expert |
| **Library** | Leather-bound book surface, warm lamplight, dust motes | 100% campaign |

### 5.3 Avatars & Profile Cards

- **Avatar builder**: Choose face shape, hairstyle, eye color, accessories from unlockable components
- **Profile card**: Customizable card displaying stats, badges, rank, equipped skin/theme — shareable to social media

---

## 6. Engagement & Retention Systems

### 6.1 Daily Streaks & Rewards

- **Login bonus**: Daily reward chest containing coins, XP, and random cosmetic fragments
- **Streak milestones**: 7-day (bronze frame), 30-day (silver), 90-day (gold), 365-day (diamond)
- **Streak protection**: Willow character ability, or earned "freeze tokens" (max 2 stored)

### 6.2 Achievement System

**100+ achievements** across categories:

| Category | Examples |
|:---|:---|
| Campaign | Complete each world, 3-star all levels in a world |
| Speed | Beat specific time targets, sub-30-second level clear |
| Social | Win 10/50/100 multiplayer matches, add 5 friends |
| Collection | Unlock all skins, all characters, all themes |
| Daily | 7/30/90/365-day streaks, perfect daily score |
| Skill | 10x combo, clear 4 lines simultaneously, no-hint clear |

Each achievement awards XP, coins, and a trophy for the profile showcase.

### 6.3 Season Pass / Battle Pass (v2.0+ — design now, implement later)

- **Free tier**: Basic reward every 5 levels (coins, XP boosters)
- **Premium tier**: Exclusive skins, characters, profile items, animated effects
- **Season duration**: 8 weeks
- **XP sources**: All game modes, daily challenges, achievements, multiplayer wins

### 6.4 Push Notifications

All configurable by the user:

- ☀️ Daily challenge reminder (user-set time)
- 🔥 Streak about to break warning (evening reminder)
- ⚔️ Friend challenge received
- 🏆 Tournament starting soon
- 🆕 New season launched

### 6.5 Weekly/Monthly Tournaments

- **Weekly mini-tournament**: Specific level or mode, top 100 leaderboard
- **Monthly championship**: Multi-round bracket tournament
- **Rewards**: Exclusive tournament-only cosmetics + in-game currency

---

## 7. Multiplayer System

### 7.1 Real-Time 1v1

- Both players see their own 8×8 board side by side
- Same sequence of blocks for both players (fair competition)
- **Attack mechanic**: Clearing lines sends "garbage blocks" to opponent's board (like Tetris 99)
- First player who can't place a block loses
- **Matchmaking**: ELO-based rating system

### 7.2 Turn-Based 1v1

- Players take turns placing one block each on a **shared board**
- Score points for completing rows/columns on your turn
- **Strategic depth**: Block your opponent's optimal placements while maximizing your own scoring

### 7.3 Async Multiplayer

- Play a puzzle, submit your score
- Challenge a friend — they play the **exact same puzzle** later
- Compare results on a private leaderboard
- **Share via link**: Works across web and Android versions

### 7.4 Co-op Mode

- 2 players work together on a larger **12×12 board**
- Each player gets their own set of 3 blocks
- Communicate via quick-chat pings ("Place here!", "I'll clear this row!", "Nice combo!")
- Shared score, shared victory

### 7.5 Ranked Seasons

**Rank progression**:

```
🪵 Wood → 🥉 Bronze → 🥈 Silver → 🥇 Gold → 💎 Platinum → 💠 Diamond → 👑 Master → 🏆 Grandmaster
```

- **Season length**: 8 weeks
- **Soft reset**: Keep 50% of rank progress between seasons
- **Season rewards**: Exclusive rank-border cosmetics, animated profile badges, and a season-specific skin

### 7.6 Networking Technology

**Recommendation**: Unity Photon (PUN2 / Fusion)
- Industry standard for Unity multiplayer
- Free tier supports up to 20 CCU (sufficient for MVP)
- Handles real-time, turn-based, and matchmaking
- Final decision deferred to Phase 4

---

## 8. AI-Powered Features

### 8.1 AI Hint System

Powered by an **on-device lightweight ML model** (not cloud-dependent, works offline).

**Hint levels** (progressive assistance):

| Level | Name | What It Shows | Cost |
|:---|:---|:---|:---|
| 1 | *Gentle Nudge* | Highlights the general area to place a block | 1 hint token |
| 2 | *Strong Hint* | Shows the exact optimal cell placement | 2 hint tokens |
| 3 | *Full Solution* | Shows the complete solution path (campaign only) | 5 hint tokens |

- **Hint tokens**: Earn 3 per day passively, bonus from achievements and streaks
- **No purchase of hints** (keeps the game fair and PEGI 3 compliant)

### 8.2 AI Opponents

Difficulty-scaled AI for practice and daily leaderboard population:

| AI Personality | Style | Speed | Optimality |
|:---|:---|:---|:---|
| **Newbie Bot** | Random, makes mistakes | Slow | 40% |
| **Steady Bot** | Methodical, safe plays | Medium | 70% |
| **Pro Bot** | Aggressive, combos | Fast | 90% |

### 8.3 AI-Generated Puzzles (v2.0+)

- Procedural puzzle generation with ML-validated solvability
- "Infinite Campaign" mode with AI-curated difficulty curve
- Personalized difficulty adjustment based on player skill

---

## 9. Accessibility

WoodBlock Saga aims to be the **most accessible block puzzle game** on the market.

### 9.1 Visual Accessibility

| Feature | Description |
|:---|:---|
| Colorblind Presets | Deuteranopia, Protanopia, Tritanopia filter options |
| Pattern Overlays | Every block color has a unique texture pattern (stripes, dots, diamonds, chevrons) |
| High Contrast Mode | Maximum contrast borders, backgrounds, and text |
| UI Scaling | Adjustable UI scale from 100% to 200% |
| Large Touch Targets | All interactive elements ≥ 48dp (Android accessibility guideline) |

### 9.2 Motor Accessibility

| Feature | Description |
|:---|:---|
| One-Hand Mode | Entire UI reachable with thumb on one side of screen |
| Tap-to-Place | Alternative to drag: tap block → tap board cell |
| Adjustable Snap Radius | 3 sensitivity levels for imprecise touch |
| Switch Control | Full Android AccessibilityService integration |
| No Time Pressure Option | Disable all timers in campaign and endless |

### 9.3 Cognitive Accessibility

| Feature | Description |
|:---|:---|
| Simplified Mode | Fewer blocks, simpler shapes, no time pressure |
| Tutorial Replay | Re-watch any tutorial at any time from settings |
| Configurable Undo | Undo depth: 1, 3, 5, or unlimited (casual modes) |
| Clear Visual Feedback | Every action has obvious visual + haptic confirmation |

### 9.4 Audio Accessibility

| Feature | Description |
|:---|:---|
| Visual Sound Indicators | Screen edge flash + vibration for audio cues |
| Subtitles | All character dialogue and narrative text displayed on-screen |
| Haptic-Only Mode | Distinct vibration patterns replace each sound effect |
| Separate Volume Controls | Independent sliders: Master, Music, SFX, Ambience, Voice |

---

## 10. Sound & Music Design

### 10.1 Per-World Soundscapes

| World | Music Style | Block Placement SFX | Line Clear SFX | Ambience |
|:---|:---|:---|:---|:---|
| **Workshop** | Lo-fi acoustic guitar | Wood clack, chisel tap | Sawdust whoosh | Workshop hum, birds outside window |
| **Enchanted Forest** | Celtic harp, flute | Magical chime + wood thunk | Sparkle cascade | Forest sounds, wind through leaves, owl |
| **Clockwork Factory** | Steampunk tick-tock | Gear click, mechanical snap | Steam release burst | Steam hiss, clock ticking, machinery |
| **Frozen Peaks** | Ethereal choir, piano | Ice crack + wood slide | Crystal shatter ring | Wind howl, crystal resonance, snow |
| **Dragon's Forge** | Epic orchestral drums | Metal clang + fire crackle | Flame eruption roar | Forge rumble, distant dragon roar |

### 10.2 ASMR Design Principles

- **Variation**: 3-5 sound variations per block type to prevent repetition fatigue
- **Combo escalation**: Line-clear sounds increase in pitch and complexity with combo count (C → D → E → F# → G#)
- **Haptic sync**: Every sound effect is paired with a proportional haptic vibration pattern
- **Spatial audio**: Blocks placed on the left produce slightly left-panned audio

### 10.3 Multiplayer Sounds

- **Opponent actions**: Muffled/distant versions of the same SFX
- **Attack incoming**: Warning tone + subtle screen shake
- **Victory**: Triumphant fanfare with character celebration animation
- **Defeat**: Gentle melody (never punishing — respect the player)

### 10.4 Sound Asset Strategy

All sounds will be sourced from:
1. **Royalty-free libraries**: Freesound.org, Mixkit, Zapsplat
2. **AI-generated music**: Suno AI, Udio for per-world background tracks
3. **Custom foley**: Record actual wood block sounds for maximum ASMR authenticity

---

## 11. Technical Architecture

### 11.1 Dual-Platform Strategy

```
┌──────────────────────────────────────────────────────┐
│               WoodBlock Saga Ecosystem               │
├─────────────────────┬────────────────────────────────┤
│   WEB VERSION       │   ANDROID VERSION              │
│   (Maintained)      │   (New — Primary Focus)        │
├─────────────────────┼────────────────────────────────┤
│ React + Vite        │ Unity 2022 LTS + C#            │
│ TypeScript          │ URP (Universal Render Pipeline) │
│ Tailwind CSS        │ for 3D wooden aesthetics       │
│ Vercel Hosting      │ Google Play Store               │
│ Supabase Backend    │ Local Storage (MVP)             │
├─────────────────────┴────────────────────────────────┤
│              SHARED (Future v2.0+)                   │
│  • Supabase Backend (auth, scores, cloud sync)       │
│  • Cross-platform leaderboards                       │
│  • Shared account / progress system                  │
└──────────────────────────────────────────────────────┘
```

### 11.2 Unity Project Structure

```
unity-project/
├── Assets/
│   ├── Scripts/
│   │   ├── Core/               # GameManager, GridManager, BlockSpawner
│   │   ├── Modes/              # CampaignManager, EndlessManager, SpeedrunManager
│   │   ├── UI/                 # UIManager, panels, menus, HUD
│   │   ├── Multiplayer/        # Networking, matchmaking (Phase 4)
│   │   ├── AI/                 # HintSystem, AIOpponent
│   │   ├── Audio/              # AudioManager, HapticsManager
│   │   ├── Data/               # SaveManager, local JSON storage
│   │   ├── Characters/         # CharacterManager, ability system
│   │   ├── Customization/      # SkinManager, ThemeManager
│   │   ├── Accessibility/      # AccessibilityManager, colorblind filters
│   │   └── Cutscenes/          # CutsceneManager, dialogue system
│   ├── Prefabs/
│   │   ├── Blocks/             # 3D block prefabs with wood materials
│   │   ├── Board/              # Grid board, cells, table surface
│   │   ├── Characters/         # Character model prefabs
│   │   ├── UI/                 # UI component prefabs
│   │   └── Effects/            # Particles, VFX, line-clear effects
│   ├── Materials/
│   │   ├── Wood/               # PBR wood grain materials (AI-generated)
│   │   ├── Board/              # Table/board surface materials
│   │   ├── Characters/         # Character materials
│   │   └── Effects/            # Glow, glass, crystal materials
│   ├── Textures/
│   │   ├── Wood/               # AI-generated high-res wood grain textures
│   │   ├── Patterns/           # Colorblind-accessible pattern overlays
│   │   ├── Characters/         # Character sprite sheets / textures
│   │   └── UI/                 # UI element textures, icons
│   ├── Audio/
│   │   ├── Music/              # Per-world background music tracks
│   │   ├── SFX/                # Block placement, line clear, UI sounds
│   │   ├── Ambience/           # Per-world ambient soundscapes
│   │   └── Voice/              # Character dialogue audio (if any)
│   ├── Scenes/
│   │   ├── Boot.unity          # Splash screen, initialization
│   │   ├── MainMenu.unity      # Title screen, mode selection
│   │   ├── Gameplay.unity      # Core gameplay scene (all modes)
│   │   ├── WorldMap.unity      # Campaign world/level selection
│   │   ├── Cutscene.unity      # Cutscene playback scene
│   │   ├── Multiplayer.unity   # Multiplayer lobby + gameplay
│   │   └── Profile.unity       # Profile, customization, achievements
│   ├── Animations/
│   │   ├── Blocks/             # Block snap, bounce, destroy, combo
│   │   ├── UI/                 # Panel slide, button press, transitions
│   │   ├── Characters/         # Idle, celebrate, hint, cutscene anims
│   │   └── Cutscenes/          # Full cutscene animation clips
│   ├── Fonts/                  # Custom typography (Google Fonts imports)
│   └── Plugins/                # Third-party SDKs (Photon, etc.)
├── Packages/
├── ProjectSettings/
└── Builds/
    └── Android/                # APK / AAB output
```

### 11.3 Core Systems Architecture (C#)

| System | Script | Responsibility |
|:---|:---|:---|
| **Game Manager** | `GameManager.cs` | Global state, mode switching, scene transitions |
| **Grid Manager** | `GridManager.cs` | Board creation, cell state, variable grid sizes |
| **Block Spawner** | `BlockSpawner.cs` | Block generation, tray of 3, shape definitions |
| **Input Manager** | `InputManager.cs` | Touch drag, tap-to-place, accessibility input routing |
| **Score Manager** | `ScoreManager.cs` | Points, combos, star calculation, multipliers |
| **Line Detector** | `LineDetector.cs` | Row/column completion detection, clearing logic |
| **Save Manager** | `SaveManager.cs` | Local encrypted JSON save/load system |
| **Audio Manager** | `AudioManager.cs` | Music, SFX, per-world soundscapes, volume control |
| **Haptics Manager** | `HapticsManager.cs` | Android haptic patterns, sync with audio |
| **UI Manager** | `UIManager.cs` | Panel navigation, screen transitions, HUD |
| **Campaign Manager** | `CampaignManager.cs` | World/level progression, star tracking, story flags |
| **Cutscene Manager** | `CutsceneManager.cs` | Cutscene playback, dialogue sequencing, skip |
| **Character Manager** | `CharacterManager.cs` | Character unlock, ability activation, companion display |
| **Customization Manager** | `CustomizationManager.cs` | Skins, themes, avatars, equip system |
| **Achievement Manager** | `AchievementManager.cs` | Achievement tracking, progress, unlock notifications |
| **Daily Manager** | `DailyManager.cs` | Seeded puzzle generation, streak tracking, calendar |
| **Accessibility Manager** | `AccessibilityManager.cs` | Colorblind filters, one-hand layout, UI scaling |
| **Multiplayer Manager** | `MultiplayerManager.cs` | Networking, matchmaking, ELO (Phase 4) |
| **AI Manager** | `AIManager.cs` | Hint computation, AI opponent logic (Phase 5) |

### 11.4 Data Storage (MVP — Local Only)

```csharp
[System.Serializable]
public class SaveData
{
    public PlayerProfile Profile;
    public CampaignProgress Campaign;
    public Dictionary<string, ModeScores> ScoreHistory;
    public UnlockedItems Customization;
    public Dictionary<string, AchievementProgress> Achievements;
    public DailyData Daily;
    public GameSettings Settings;
}

public class PlayerProfile
{
    public string DisplayName;
    public AvatarData Avatar;
    public string EquippedSkin;
    public string EquippedTheme;
    public string EquippedCharacter;
}

public class CampaignProgress
{
    public int[] WorldUnlocks;        // which worlds are accessible
    public Dictionary<string, int> LevelStars; // levelId → stars (0-3)
    public List<string> StoryFlags;   // completed story triggers
    public string CurrentCutscene;    // last viewed cutscene
}

public class DailyData
{
    public int StreakCount;
    public string LastPlayedDate;     // ISO 8601
    public int StreakFreezeCount;
    public List<string> CompletedDates;
}

public class GameSettings
{
    public float MasterVolume;
    public float MusicVolume;
    public float SFXVolume;
    public float AmbienceVolume;
    public bool HapticsEnabled;
    public string ColorblindMode;     // "none", "deuteranopia", "protanopia", "tritanopia"
    public bool OneHandMode;
    public bool TapToPlace;
    public float UIScale;             // 1.0 to 2.0
    public bool HighContrastMode;
    public bool ShowPatternOverlays;
    public string NotificationTime;   // daily reminder time
}
```

All save data encrypted with AES-256 and stored at `Application.persistentDataPath/save.dat`.

---

## 12. Development Phases

### Phase 0: Unity Foundations (Weeks 1–3)

**Goal**: Get comfortable with Unity and build a playable prototype.

> ⚠️ This phase is non-negotiable. Skipping it will cause compounding issues in later phases.

| Task | Details |
|:---|:---|
| Install Unity Hub + Unity 2022 LTS | Include Android Build Support module |
| Complete Unity tutorials | "Roll-a-Ball" or equivalent beginner project |
| Learn C# scripting basics | MonoBehaviour lifecycle, GameObjects, Prefabs, ScriptableObjects |
| Set up Android SDK | Build & deploy "Hello World" to phone or emulator |
| Create project structure | As defined in §11.2 |
| **Prototype deliverable** | A basic 8×8 grid where you can drag a single wooden block onto it |

---

### Phase 1: Core MVP (Weeks 4–8)

**Goal**: A beautiful, playable single-player block puzzle on Android.

| Category | Tasks |
|:---|:---|
| **Visuals** | 3D wooden block prefabs with AI-generated PBR materials; wooden table surface with warm URP lighting |
| **Grid System** | Variable grid sizes (6×6, 8×8, 10×10); cell states (empty, filled, disabled) |
| **Gameplay** | Block spawning (tray of 3); drag-and-drop with grid snap; tap-to-place alternative |
| **Scoring** | Line detection and clearing; combo multipliers; score display |
| **Effects** | Satisfying particle effects on line clear; block snap animation; screen shake on combos |
| **Audio** | Wood clack SFX (3-5 variations); line clear chimes; basic background music |
| **Haptics** | Haptic feedback on placement, line clear, and combos |
| **Modes** | Endless Mode fully playable (10×10); Campaign World 1 — "The Workshop" (6 tutorial levels) |
| **UI** | Main menu; settings screen; gameplay HUD |
| **Save** | Local save/load system (encrypted JSON) |
| **Build** | Android APK generation; test on real device |

---

### Phase 2: Full Game Modes (Weeks 9–14)

**Goal**: All single-player modes complete with story and polish.

| Category | Tasks |
|:---|:---|
| **Campaign** | Worlds 2-5 with unique visuals, mechanics, and boss levels |
| **Cutscenes** | Full animated cutscenes between campaign story beats |
| **Characters** | 8 character system with unlock conditions and abilities |
| **Speedrun** | Timer, personal bests, ghost replay recording/playback |
| **Daily Challenge** | Seeded puzzle generation, streak system, share cards |
| **Sudoku Hybrid** | 6×6 grid, 3 difficulty tiers, colorblind pattern overlays |
| **Power-ups** | Hammer, Rotate, Bomb in Endless Mode |
| **Audio** | 5 per-world soundscapes with unique music and SFX |
| **Achievements** | First 50 achievements with UI, tracking, and notifications |

---

### Phase 3: Customization & Polish (Weeks 15–18)

**Goal**: Deep personalization, full accessibility, and Play Store readiness.

| Category | Tasks |
|:---|:---|
| **Customization** | 8 block skins, 5 board themes, avatar builder, profile cards |
| **Accessibility** | Full suite: colorblind presets, one-hand mode, UI scaling, tap-to-place, pattern overlays, haptic-only mode, switch control |
| **Notifications** | Push notification system (daily reminder, streak warning) |
| **Settings** | Granular audio sliders, all accessibility toggles, notification preferences |
| **Onboarding** | First-time user experience (interactive tutorial, character introduction) |
| **Performance** | Target 60fps on mid-range Android (SD 6 Gen 1 tier); LOD system; texture atlasing |
| **Store Prep** | Screenshots, feature graphic, description, metadata, content rating |
| **Release** | Alpha release on Google Play (internal testing track) |

---

### Phase 4: Social & Multiplayer (Weeks 19–26)

**Goal**: Connected experience with full multiplayer.

| Category | Tasks |
|:---|:---|
| **Backend** | Supabase integration (reuse existing infrastructure) |
| **Auth** | Google Sign-In, email auth |
| **Leaderboards** | Global leaderboards for all modes |
| **Social** | Friend list, challenge a friend, share cards to Instagram/WhatsApp |
| **Multiplayer** | Async, real-time 1v1, turn-based 1v1, co-op (Photon) |
| **Ranked** | ELO rating, rank tiers (Wood → Grandmaster), seasonal resets |
| **Tournaments** | Weekly mini-tournaments, monthly championship |
| **Season Pass** | Free tier implementation with reward tracks |

---

### Phase 5: AI & Beyond (Weeks 27+)

**Goal**: Intelligent features, cross-platform, and continuous evolution.

| Category | Tasks |
|:---|:---|
| **AI Hints** | On-device ML hint system (3 hint levels) |
| **AI Opponents** | 3 difficulty profiles (Newbie, Steady, Pro) |
| **AI Puzzles** | Procedural generation with validated solvability |
| **Cross-Platform** | Web ↔ Android account and progress sync |
| **Analytics** | Firebase Analytics integration |
| **iOS** | iOS build and App Store submission |
| **Content** | Ongoing: new worlds, characters, skins, seasonal events |
| **Monetization** | IAP cosmetics and premium season pass (when player base is established) |

---

## 13. Success Metrics

### Post-Launch KPIs

| Metric | Target | Why It Matters |
|:---|:---|:---|
| Day 1 Retention | ≥ 45% | First impression and tutorial effectiveness |
| Day 7 Retention | ≥ 25% | Core loop engagement |
| Day 30 Retention | ≥ 12% | Long-term stickiness and habit formation |
| Avg. Session Length | 8–15 min | Sweet spot for puzzle games |
| Daily Active Users | Growing MoM | Overall health indicator |
| Daily Challenge Participation | ≥ 30% of DAU | Social feature engagement |
| Crash-Free Rate | ≥ 99.5% | Technical stability |
| Play Store Rating | ≥ 4.5 ★ | Organic discoverability |
| Organic Install Rate | ≥ 70% | Word-of-mouth and sharing effectiveness |

---

## 14. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|:---|:---|:---|:---|
| Unity learning curve | 🔴 High | High | Phase 0 dedicated to learning; step-by-step guidance provided |
| Scope creep | 🔴 High | High | Strict phasing — MVP first, no feature jumping between phases |
| 3D performance on low-end Android | 🟡 Medium | Medium | URP, LOD, texture atlasing, quality presets per device tier |
| AI-generated textures quality | 🟡 Medium | Low | Generate many variations, curate the best; iterate with different prompts |
| Multiplayer networking complexity | 🔴 High | Medium | Defer to Phase 4; start with async (simplest); use Photon (battle-tested) |
| Sound/music asset sourcing | 🟡 Medium | Low | Mix of royalty-free libraries + AI generation + custom foley |
| Full cutscene animation cost | 🔴 High | Medium | Use Unity Timeline + 2.5D character animations (not full 3D cinematics) |
| App name conflicts on Play Store | 🟢 Low | Low | "WoodBlock Saga" is distinctive; verify trademark availability |
| Block puzzle patent concerns | 🟢 Low | Very Low | Core mechanic is public domain; avoid copying specific competitor UI |

---

## 15. Decisions Log

All key decisions documented for future reference:

| Decision | Choice | Date | Rationale |
|:---|:---|:---|:---|
| App Name | **WoodBlock Saga** | Aug 12, 2026 | Distinctive, hints at wooden aesthetic and story depth |
| Tech Stack | **Unity 2022 LTS** | Aug 12, 2026 | Full game engine for 3D, Android native, future iOS |
| Visual Style | **Realistic 3D wooden** | Aug 12, 2026 | AI-generated PBR textures, warm and tactile |
| Story Depth | **Full cutscenes with characters** | Aug 12, 2026 | Deep narrative differentiator in puzzle genre |
| Grid System | **Variable per mode** | Aug 12, 2026 | 6×6 Sudoku, 8×8 Campaign, 10×10 Endless |
| Monetization | **Free (growth focus)** | Aug 12, 2026 | Build player base first, monetize in v2.0+ |
| Backend (MVP) | **Local storage only** | Aug 12, 2026 | Cloud sync deferred to Phase 4 |
| Multiplayer Tech | **Photon (recommended)** | Aug 12, 2026 | Final decision at Phase 4 |
| Art Assets | **AI-generated** | Aug 12, 2026 | Stable Diffusion / Midjourney for textures |
| Analytics | **Firebase, added later** | Aug 12, 2026 | Not needed for MVP |
| Age Rating | **PEGI 3 / Everyone** | Aug 12, 2026 | Maximum reach, family-friendly |
| Language | **English only (MVP)** | Aug 12, 2026 | Localization deferred to post-launch |
| Platform | **Android + Web (hybrid)** | Aug 12, 2026 | Maintain web version, new Unity Android app |

---

*This is a living document. It will be updated as decisions are made and the project evolves.*
