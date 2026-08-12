# ✅ WoodBlock Saga — Verification Plan

**Version**: 1.0  
**Date**: August 12, 2026  
**Related**: [PRD.md](./PRD.md)  

---

## Overview

This document defines how each development phase will be verified before moving to the next. Every phase has specific **acceptance criteria**, **test methods**, and **sign-off requirements**.

---

## Phase 0: Unity Foundations — Verification

### Acceptance Criteria

| # | Criteria | Test Method |
|:---|:---|:---|
| 0.1 | Unity Hub + Unity 2022 LTS installed with Android Build Support | Screenshot of Unity Hub showing installed version |
| 0.2 | At least one Unity tutorial project completed | Playable build or screenshot |
| 0.3 | Android SDK configured and connected | `adb devices` shows connected device or running emulator |
| 0.4 | Empty Unity project builds and deploys to Android device | APK installs and runs (even if blank scene) |
| 0.5 | Project structure matches §11.2 of PRD | Directory listing matches spec |
| 0.6 | **Prototype**: 8×8 grid displayed on screen | Visual verification on device |
| 0.7 | **Prototype**: Single block can be dragged onto the grid | Touch interaction works on device |
| 0.8 | **Prototype**: Block snaps to grid cells | Block aligns to cell positions on release |

### Sign-Off
- [ ] All 8 criteria met
- [ ] Prototype runs on a real Android device (not just editor)
- [ ] No crashes during 5-minute play session

---

## Phase 1: Core MVP — Verification

### Automated Tests

```bash
# Run Unity Test Runner (Edit Mode + Play Mode)
# From Unity Editor: Window > General > Test Runner > Run All

# Key test suites:
# - GridManagerTests: Grid creation, cell states, variable sizes
# - BlockSpawnerTests: Block shape generation, tray management
# - LineDetectorTests: Row/column detection, multi-line combos
# - ScoreManagerTests: Score calculation, combo multipliers, star rating
# - SaveManagerTests: Save/load round-trip, data integrity
```

### Acceptance Criteria

| # | Criteria | Test Method |
|:---|:---|:---|
| 1.1 | 3D wooden blocks render with PBR materials | Visual inspection on device (warm lighting, grain visible) |
| 1.2 | Wooden table surface renders as environment | Visual inspection |
| 1.3 | Grid supports 6×6, 8×8, 10×10 sizes | Switch between sizes in settings; verify correct cell count |
| 1.4 | Tray shows 3 blocks at a time | Visual verification |
| 1.5 | Drag-and-drop works on touch screen | Test on real device: pick up, drag, release |
| 1.6 | Tap-to-place works as alternative input | Tap block → tap cell → block places correctly |
| 1.7 | Grid snap: blocks align to cells | Drag near a cell → block snaps to exact position |
| 1.8 | Full rows clear with particle effect | Fill a row manually → verify clear animation plays |
| 1.9 | Full columns clear with particle effect | Fill a column manually → verify clear animation plays |
| 1.10 | Combo multiplier works | Clear 2+ lines simultaneously → verify multiplied score |
| 1.11 | Score displays correctly in HUD | Score updates on every placement and line clear |
| 1.12 | Wood clack SFX plays on placement | Audio verification (test with headphones) |
| 1.13 | Line clear chime plays | Audio verification |
| 1.14 | Haptic feedback on placement | Feel vibration on real device |
| 1.15 | Haptic feedback on line clear | Feel stronger vibration on real device |
| 1.16 | Endless Mode: game ends when no block fits | Fill board until stuck → verify game over screen |
| 1.17 | Campaign World 1: 6 levels playable | Complete all 6 levels of The Workshop |
| 1.18 | Campaign World 1: star rating works | Complete a level → verify 1-3 stars awarded correctly |
| 1.19 | Main menu navigates to all available modes | Tap each mode button → correct screen loads |
| 1.20 | Settings: volume sliders work | Adjust volume → verify audio changes |
| 1.21 | Game saves progress locally | Complete a level → close app → reopen → progress retained |
| 1.22 | Android APK builds successfully | `Build and Run` produces working APK |
| 1.23 | 60fps on mid-range device | Use Unity Profiler; no frame drops below 30fps |

### Performance Targets

| Metric | Target | How to Measure |
|:---|:---|:---|
| Frame Rate | ≥ 60fps sustained | Unity Profiler, Android GPU Profiler |
| Memory Usage | ≤ 300MB RAM | Unity Profiler Memory tab |
| APK Size | ≤ 100MB | Check file size of generated APK |
| Load Time | ≤ 3 seconds (cold start) | Stopwatch test on real device |
| Battery Drain | ≤ 5% per 30 minutes | Android battery stats |

### Sign-Off
- [ ] All 23 acceptance criteria met
- [ ] All automated tests pass
- [ ] Performance targets met on at least 2 Android devices (1 mid-range, 1 budget)
- [ ] No crashes during 30-minute play session

---

## Phase 2: Full Game Modes — Verification

### Automated Tests

```bash
# Additional test suites:
# - CampaignManagerTests: Level unlock logic, star persistence, world progression
# - DailyManagerTests: Seeded generation produces same puzzle for same date
# - StreakTests: Streak increment, reset, freeze token logic
# - SudokuValidatorTests: Color placement rules, no row/column/subgrid repeats
# - CharacterAbilityTests: Each ability activates correctly, respects cooldowns
# - AchievementTests: Achievement conditions trigger correctly
# - PowerUpTests: Hammer, Rotate, Bomb produce expected board state
```

### Acceptance Criteria

| # | Criteria | Test Method |
|:---|:---|:---|
| 2.1 | Campaign Worlds 2-5 playable with unique visuals | Play through each world |
| 2.2 | Boss levels have special mechanics | Play each boss level → verify unique mechanic |
| 2.3 | Cutscenes play between story beats | Trigger story flag → verify cutscene plays |
| 2.4 | Cutscenes are skippable | Press skip → verify cutscene ends and gameplay resumes |
| 2.5 | All 8 characters unlockable | Meet each unlock condition → verify character unlocks |
| 2.6 | Character abilities work in gameplay | Equip each character → use ability → verify effect |
| 2.7 | Speedrun timer is accurate | Compare with external stopwatch (< 0.1s variance) |
| 2.8 | Speedrun personal bests save | Set a time → beat it → verify new PB recorded |
| 2.9 | Daily Challenge: same puzzle for all | Check seed generation on 2 devices for same date |
| 2.10 | Daily streak increments correctly | Complete daily → verify streak count +1 |
| 2.11 | Daily streak resets on missed day | Skip a day → verify streak resets to 0 |
| 2.12 | Streak freeze token works | Use freeze → skip a day → verify streak preserved |
| 2.13 | Sudoku Hybrid enforces color rules | Try invalid placement → verify rejection |
| 2.14 | Sudoku 3 difficulty tiers work | Play each tier → verify correct number of colors |
| 2.15 | Pattern overlays visible in Sudoku | Enable patterns → verify distinct overlays per color |
| 2.16 | Power-ups work in Endless Mode | Use each power-up → verify correct board effect |
| 2.17 | Per-world music plays correctly | Enter each world → verify unique music track |
| 2.18 | 50 achievements trackable | Check achievement UI → verify all 50 listed with progress |
| 2.19 | Achievement unlock notification appears | Trigger an achievement → verify toast/popup |

### Sign-Off
- [ ] All 19 acceptance criteria met
- [ ] All automated tests pass (Phase 1 + Phase 2 suites)
- [ ] Full campaign playthrough completed without bugs
- [ ] All cutscenes reviewed for quality and timing

---

## Phase 3: Customization & Polish — Verification

### Acceptance Criteria

| # | Criteria | Test Method |
|:---|:---|:---|
| 3.1 | All 8 block skins render correctly | Equip each skin → visual inspection in gameplay |
| 3.2 | All 5 board themes render correctly | Equip each theme → visual inspection |
| 3.3 | Avatar builder allows face/hair/accessories | Create avatar → verify customization applies |
| 3.4 | Profile card displays correctly | View profile → verify stats, badges, equipped items |
| 3.5 | Colorblind presets apply correctly | Enable each preset → verify color filter changes |
| 3.6 | One-hand mode repositions UI | Enable → verify all interactive elements reachable with thumb |
| 3.7 | UI scaling works (100%-200%) | Adjust scale → verify all elements resize proportionally |
| 3.8 | Tap-to-place mode works globally | Enable → verify drag-and-drop disabled, tap works |
| 3.9 | High contrast mode increases visibility | Enable → verify borders and text are high-contrast |
| 3.10 | Push notifications deliver | Set reminder → verify notification arrives at set time |
| 3.11 | Onboarding flow completes | Fresh install → verify tutorial plays on first launch |
| 3.12 | Settings persist across sessions | Change settings → close app → reopen → verify preserved |
| 3.13 | Play Store listing complete | Screenshots, description, metadata all prepared |
| 3.14 | 60fps sustained on mid-range device | 30-minute profiling session |
| 3.15 | APK size within limits | ≤ 150MB (with all assets) |

### Accessibility Audit Checklist

| Check | Standard | Status |
|:---|:---|:---|
| Touch targets ≥ 48dp | Android Material guidelines | [ ] |
| Text contrast ratio ≥ 4.5:1 | WCAG AA | [ ] |
| Screen reader compatible | Android TalkBack | [ ] |
| No gameplay requires audio | Audio accessibility | [ ] |
| No gameplay requires color perception | Visual accessibility | [ ] |
| No gameplay requires fast motor response | Motor accessibility | [ ] |

### Sign-Off
- [ ] All 15 acceptance criteria met
- [ ] Accessibility audit checklist complete
- [ ] Alpha build uploaded to Google Play internal testing track
- [ ] 5 test users complete onboarding without confusion
- [ ] No crashes in 1-hour stress test

---

## Phase 4: Social & Multiplayer — Verification

### Acceptance Criteria

| # | Criteria | Test Method |
|:---|:---|:---|
| 4.1 | Google Sign-In works | Sign in with Google account → verify profile created |
| 4.2 | Email auth works | Register + login with email → verify |
| 4.3 | Leaderboards populate | Submit score → verify appears on global leaderboard |
| 4.4 | Friend system works | Send friend request → accept → verify in friend list |
| 4.5 | Async multiplayer works | Challenge friend → both play → compare scores |
| 4.6 | Real-time 1v1 works | Match with another player → play to completion |
| 4.7 | Turn-based 1v1 works | Alternate turns → verify shared board updates |
| 4.8 | Co-op mode works | 2 players on 12×12 → play together → shared score |
| 4.9 | Garbage blocks mechanic works | Clear lines in 1v1 → verify blocks appear on opponent board |
| 4.10 | ELO rating updates correctly | Win/lose → verify rating changes proportionally |
| 4.11 | Ranked tiers display correctly | Reach each tier → verify visual badge updates |
| 4.12 | Tournament brackets work | Enter tournament → play matches → verify bracket progression |
| 4.13 | Share card generates for social media | Share to WhatsApp/Instagram → verify image and link |
| 4.14 | Season pass free tier rewards | Level up pass → claim free rewards → verify in inventory |

### Load Testing

| Scenario | Target | Tool |
|:---|:---|:---|
| Concurrent leaderboard reads | 1000 req/s | Supabase dashboard |
| Concurrent matchmaking | 100 concurrent users | Photon dashboard |
| Score submission burst | 500 submissions/minute | Custom load test script |

### Sign-Off
- [ ] All 14 acceptance criteria met
- [ ] Load testing targets met
- [ ] No desync issues in 20 consecutive 1v1 matches
- [ ] Cloud save → wipe device → restore → all data intact

---

## Phase 5: AI & Beyond — Verification

### Acceptance Criteria

| # | Criteria | Test Method |
|:---|:---|:---|
| 5.1 | AI hints provide valid suggestions | Hint → place as suggested → verify valid move |
| 5.2 | AI hint levels progressively reveal more | Use all 3 levels → verify escalating detail |
| 5.3 | AI opponents play at difficulty level | Play vs each AI → verify skill difference |
| 5.4 | AI-generated puzzles are solvable | Generate 100 puzzles → verify all have valid solutions |
| 5.5 | Cross-platform sync works | Play on Android → check web → verify same progress |
| 5.6 | Firebase Analytics captures events | Trigger key events → verify in Firebase dashboard |
| 5.7 | iOS build runs correctly | Test on iOS device/simulator → verify feature parity |

### Sign-Off
- [ ] All 7 acceptance criteria met
- [ ] AI hint system tested by 10 users → satisfaction survey ≥ 4/5
- [ ] Cross-platform sync tested across 3 device pairs
- [ ] Full regression test of all phases

---

## Regression Test Protocol

Before every major release or phase completion, run the full regression:

1. **Phase 0 checks**: App launches, grid renders
2. **Phase 1 checks**: All core gameplay works, save/load works
3. **Phase 2 checks**: All modes playable, cutscenes play, characters work
4. **Phase 3 checks**: All customization applies, accessibility works
5. **Phase 4 checks**: All multiplayer modes functional, leaderboards update
6. **Phase 5 checks**: AI features work, cross-platform sync works

**Estimated regression time**: 2-3 hours per full pass.

---

## Bug Severity Classification

| Severity | Definition | Example | Response Time |
|:---|:---|:---|:---|
| 🔴 **Critical** | Game unplayable, data loss, crash | Save file corruption, crash on launch | Fix immediately |
| 🟠 **Major** | Feature broken, workaround exists | Leaderboard not loading, sound missing | Fix within 48 hours |
| 🟡 **Minor** | Visual glitch, non-blocking | Misaligned UI element, wrong font size | Fix in next release |
| 🟢 **Cosmetic** | Polish issue, very minor | Color slightly off, animation jitter | Backlog |

---

*This document is updated alongside the PRD as the project evolves.*
