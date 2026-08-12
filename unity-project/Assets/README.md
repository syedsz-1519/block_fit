# 🎮 WoodBlock Saga — Unity Assets Directory

Welcome to the Unity Assets directory for **WoodBlock Saga**.

## Folder Structure (Per PRD §11.2)

```
Assets/
├── Scripts/
│   ├── Core/           # GameManager, GridManager, BlockSpawner, LineDetector
│   ├── Modes/          # CampaignManager, EndlessManager, SpeedrunManager, DailyManager
│   ├── UI/             # UIManager, HUD, Panels, Menus
│   ├── Data/           # SaveManager, Local JSON storage
│   ├── Characters/     # CharacterManager, Ability System
│   ├── Customization/  # SkinManager, ThemeManager, AvatarBuilder
│   ├── Accessibility/  # AccessibilityManager, Colorblind filters
│   ├── Cutscenes/      # CutsceneManager, DialogueSystem
│   ├── Bootstrap/      # BuildSettings, RuntimeDebugger
│   ├── Sudoku/         # SudokuGridRenderer, SudokuValidator
│   └── VFX/            # ParticleManager, HapticManager, ScreenEffects, AudioSync
├── Prefabs/
│   ├── Blocks/         # 3D wooden block prefabs
│   ├── Board/          # Grid board, cells, table surface
│   ├── Characters/     # Character model prefabs
│   └── UI/             # UI component prefabs
├── Materials/
│   ├── Wood/           # PBR wood grain materials (Oak, Walnut, Bamboo, Obsidian)
│   ├── Board/          # Workbench/Table materials
│   └── Effects/        # Glow, glass, particle materials
├── Textures/
│   ├── Wood/           # AI-generated wood grain textures
│   ├── Patterns/       # Colorblind pattern overlays
│   └── UI/             # UI element icons & sprites
├── Audio/
│   ├── Music/          # Per-world background tracks
│   ├── SFX/            # Wood clacks, line clear chimes, UI clicks
│   └── Ambience/       # Workshop, forest, factory, mountain, forge ambience
├── Scenes/
│   ├── Boot.unity      # Initialization & splash screen
│   ├── MainMenu.unity  # Title menu & mode select
│   ├── Gameplay.unity  # Core gameplay scene (all modes)
│   ├── WorldMap.unity  # Campaign level select
│   └── Profile.unity   # Profile, customization, achievements
└── Fonts/              # Game typography
```

## How to Open in Unity

1. Launch **Unity Hub**.
2. Click **Add** → **Add project from disk**.
3. Select the `unity-project` folder inside this repository: `d:\block_fit\unity-project`.
4. Open with **Unity 2022.3 LTS**.
