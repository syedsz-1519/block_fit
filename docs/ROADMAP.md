# 🗺️ WoodBlock Saga — Development Roadmap

**Version**: 1.0  
**Date**: August 12, 2026  
**Timeline**: Quality over speed — no hard deadlines  

---

## At a Glance

```
Phase 0 ━━━━━━ Phase 1 ━━━━━━━━━ Phase 2 ━━━━━━━━━━━ Phase 3 ━━━━━━━━ Phase 4 ━━━━━━━━━━━━ Phase 5 ━━━━━━▶
 Unity       Core MVP         Full Game Modes      Customization    Social &            AI &
 Foundations  (Endless +       (Campaign, Speed,    & Polish         Multiplayer          Beyond
              World 1)         Daily, Sudoku)       (Store Ready)    (Connected)          (Smart)
 Wk 1-3      Wk 4-8           Wk 9-14              Wk 15-18        Wk 19-26             Wk 27+
                                                         │
                                                         ▼
                                                    🚀 Alpha
                                                    (Play Store
                                                    Internal Test)
```

---

## Phase 0: Unity Foundations 🎓
**Weeks 1–3 | Status: Not Started**

Learn Unity fundamentals and produce a working prototype.

- [ ] Unity Hub + Unity 2022 LTS + Android Build Support installed
- [ ] Complete at least one Unity beginner tutorial
- [ ] C# scripting fundamentals learned (MonoBehaviour, Prefabs, ScriptableObjects)
- [ ] Android SDK configured; "Hello World" deployed to device
- [ ] Project folder structure created (per PRD §11.2)
- [ ] **DELIVERABLE**: 8×8 grid with one draggable block on Android

---

## Phase 1: Core MVP 🎮
**Weeks 4–8 | Status: Not Started**

A beautiful, playable block puzzle game on Android.

- [ ] 3D wooden block prefabs with AI-generated PBR wood materials
- [ ] Wooden table surface environment with warm URP lighting
- [ ] Variable grid system (6×6, 8×8, 10×10)
- [ ] Block spawning — tray of 3 blocks
- [ ] Drag-and-drop input with grid snap
- [ ] Tap-to-place alternative input
- [ ] Line detection (rows + columns)
- [ ] Line clearing with particle effects
- [ ] Combo multiplier system
- [ ] Score HUD with real-time updates
- [ ] Wood clack SFX (3–5 variations)
- [ ] Line clear chimes with pitch escalation
- [ ] Haptic feedback (placement + line clear + combo)
- [ ] **Endless Mode** — fully playable (10×10)
- [ ] **Campaign World 1** — "The Workshop" (6 tutorial levels)
- [ ] Main menu + settings screen
- [ ] Local save/load system (encrypted JSON)
- [ ] Android APK build & test
- [ ] **DELIVERABLE**: Playable Endless + World 1 on Android at 60fps

---

## Phase 2: Full Game Modes 🌍
**Weeks 9–14 | Status: Not Started**

All single-player content with story and polish.

- [ ] Campaign Worlds 2–5 (Enchanted Forest, Clockwork Factory, Frozen Peaks, Dragon's Forge)
- [ ] Boss levels with special mechanics per world
- [ ] Full animated cutscenes between story beats
- [ ] 8 character system with unlock conditions + passive abilities
- [ ] Speedrun Mode — timer, personal bests, ghost replays
- [ ] Daily Challenge — seeded puzzles, streak system, share cards
- [ ] Sudoku Color Hybrid — 6×6 grid, 3 difficulty tiers, pattern overlays
- [ ] Power-ups in Endless (Hammer, Rotate, Bomb)
- [ ] 5 per-world soundscapes (unique music, SFX, ambience)
- [ ] 50 achievements with tracking + unlock notifications
- [ ] **DELIVERABLE**: All 6 modes playable, full campaign completable

---

## Phase 3: Customization & Polish ✨
**Weeks 15–18 | Status: Not Started**

Personalization, accessibility, and Play Store readiness.

- [ ] 8 block skins unlockable through gameplay
- [ ] 5 board themes with full environment reskins
- [ ] Avatar builder (face, hair, accessories)
- [ ] Profile cards with stats, badges, equipped items
- [ ] Full accessibility suite (colorblind, one-hand, scaling, patterns, haptic-only)
- [ ] Push notifications (daily reminder, streak warning)
- [ ] Granular settings (audio sliders, accessibility toggles)
- [ ] First-time user onboarding flow
- [ ] Performance optimization (60fps on mid-range Android)
- [ ] Google Play Store listing preparation
- [ ] **DELIVERABLE**: Alpha release on Google Play (internal testing)

---

## Phase 4: Social & Multiplayer 🌐
**Weeks 19–26 | Status: Not Started**

Connected experience with competitive and social features.

- [ ] Supabase backend integration
- [ ] Google Sign-In + email authentication
- [ ] Global leaderboards for all modes
- [ ] Friend system (add, challenge, view profile)
- [ ] Share cards to Instagram / WhatsApp
- [ ] Async multiplayer
- [ ] Real-time 1v1 (Photon)
- [ ] Turn-based 1v1
- [ ] Co-op mode (12×12 board)
- [ ] Ranked system (ELO, Wood → Grandmaster)
- [ ] 8-week seasons with soft rank reset
- [ ] Weekly + monthly tournaments
- [ ] Season pass — free tier rewards
- [ ] **DELIVERABLE**: Full multiplayer with ranked seasons live

---

## Phase 5: AI & Beyond 🧠
**Weeks 27+ | Status: Not Started**

Intelligence, expansion, and long-term growth.

- [ ] On-device AI hint system (3 hint levels)
- [ ] AI opponents (Newbie, Steady, Pro bots)
- [ ] AI-generated procedural puzzles
- [ ] Cross-platform sync (Android ↔ Web)
- [ ] Firebase Analytics integration
- [ ] iOS build + App Store submission
- [ ] Continuous content (new worlds, characters, skins, events)
- [ ] Monetization framework (IAP cosmetics + premium season pass)
- [ ] **DELIVERABLE**: Smart, cross-platform, continuously evolving game

---

## Key Milestones

| Milestone | Phase | Description |
|:---|:---|:---|
| 🏗️ First Grid | 0 | A grid renders on an Android device |
| 🧱 First Block Drag | 0 | A block can be dragged onto the grid |
| 🎮 First Playable | 1 | Endless Mode is fun and complete |
| 📖 First Story | 2 | Campaign World 1 with cutscenes is playable |
| 🏆 First Competition | 2 | Speedrun + Daily Challenge live |
| ✨ First Polish | 3 | Customization + accessibility complete |
| 🚀 Alpha Launch | 3 | Internal testing on Google Play |
| 🌐 First Online | 4 | Leaderboards + async multiplayer live |
| ⚔️ First Battle | 4 | Real-time 1v1 multiplayer live |
| 🧠 First AI | 5 | AI hints working on-device |
| 🍎 iOS Launch | 5 | App Store submission |

---

*This roadmap is a living document. Updated as each phase is completed.*
