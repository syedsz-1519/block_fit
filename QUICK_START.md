# 🎮 Block Fit — Quick Start Guide

Get Block Fit running and playing in **5 minutes**!

---

## Prerequisites

✅ Node.js v18+ installed  
✅ Project downloaded/cloned  
✅ Code editor (VS Code recommended)

---

## Method 1: Using VS Code Terminal ⭐ RECOMMENDED

**This is the easiest method!**

### Step 1: Open Project in VS Code
```bash
# Navigate to project folder
cd c:\Users\admin\Desktop\block\block_fit

# Open in VS Code
code .
```

### Step 2: Open Terminal in VS Code
- Press `Ctrl + ~` (backtick key)
- Or go to **Terminal → New Terminal** in menu
- VS Code terminal bypasses PowerShell execution policy

### Step 3: Install Dependencies
```bash
npm install
```
⏱️ This takes 2-3 minutes on first run

### Step 4: Start Dev Server
```bash
npm run dev
```

### Step 5: Open in Browser
- Server will log: `Local: http://localhost:5173`
- Click the link or open in browser
- 🎮 **Start playing!**

---

## Method 2: Using Command Prompt (cmd.exe)

If VS Code terminal doesn't work:

### Step 1: Open Command Prompt
- Press `Win + R`
- Type `cmd` and press Enter

### Step 2: Navigate to Project
```cmd
cd c:\Users\admin\Desktop\block\block_fit
```

### Step 3: Install Dependencies
```cmd
npm install
```

### Step 4: Start Dev Server
```cmd
npm run dev
```

### Step 5: Open Browser
- Open http://localhost:5173
- 🎮 **Play!**

---

## Method 3: Using PowerShell (Advanced)

If you want to fix PowerShell permanently:

### Step 1: Set Execution Policy
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
- Answer `Y` when prompted
- This allows local scripts to run

### Step 2: Navigate to Project
```powershell
cd c:\Users\admin\Desktop\block\block_fit
```

### Step 3: Install & Run
```powershell
npm install
npm run dev
```

### Step 4: Open Browser
- Open http://localhost:5173
- 🎮 **Play!**

---

## What You'll See

### Terminal Output
```
  VITE v6.2.3  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### Browser (http://localhost:5173)
- Splash screen with "Block Fit" title
- Main menu with game modes
- Beautiful puzzle game interface
- Ready to play!

---

## 🎮 How to Play

### Main Menu Options
1. **Campaign** - Complete 50+ levels across 5 worlds
2. **Endless** - Classic infinite block puzzle
3. **Daily Challenge** - Daily seeded puzzle + leaderboard
4. **Speedrun** - Race against the clock
5. **Sudoku Hybrid** - Block puzzle meets Sudoku

### Controls
- **Mouse/Touch**: Drag blocks to place them
- **Keyboard**: Arrow keys to move, R to rotate, M to mirror
- **H**: Get a hint
- **U**: Undo last move
- **P**: Pause/Resume
- **Space**: Pause

### Objective
- Place blocks on the grid to form complete rows/columns
- Clear lines for points
- Complete each level to earn stars
- No pressure - play at your own pace!

---

## Troubleshooting

### Issue: Port 5173 Already in Use
```bash
# Kill the process using port 5173
# On Windows PowerShell:
Stop-Process -Port 5173

# Then restart:
npm run dev
```

### Issue: Dependencies Not Installing
```bash
# Clear npm cache
npm cache clean --force

# Try installing again
npm install
```

### Issue: "Cannot find module" errors
```bash
# Delete node_modules and reinstall
rm -r node_modules
npm install
```

### Issue: Browser shows blank page
- Wait 10-15 seconds for Vite to compile
- Check terminal for errors
- Hard refresh browser: `Ctrl + Shift + R`
- Check browser console for JavaScript errors

### Issue: Hot reload not working
- Restart the dev server: `npm run dev`
- Hard refresh browser: `Ctrl + Shift + R`

---

## Development Features

### Hot Module Reloading (HMR)
- Edit code and see changes instantly
- No page refresh needed
- Game state persists between edits

### TypeScript
- Full type checking
- IDE autocomplete
- Better error messages

### Tailwind CSS
- Utility-first styling
- Pre-built components
- Responsive design

### React DevTools
- Inspect component tree
- Check props and state
- Performance profiling

---

## Project Structure

```
block_fit/
├── src/
│   ├── App.tsx           # Main game component
│   ├── engine/           # NEW: Game engine (types, systems, logic)
│   ├── components/       # UI components
│   ├── main.tsx          # Entry point
│   └── index.css         # Styles
│
├── api/                  # Backend API routes
├── public/               # Static assets
├── package.json          # Dependencies
└── vite.config.ts        # Build config
```

---

## Available Scripts

### Development
```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run preview      # Preview production build
```

### Building
```bash
npm run build        # Build for production
npm run start        # Start production server
```

### Code Quality
```bash
npm run lint         # Check TypeScript
npm run clean        # Remove build artifacts
```

---

## Game Modes Guide

### 🏰 Campaign Mode
- Progress through handcrafted levels
- 5 unique worlds with increasing difficulty
- Earn stars (1-3 per level)
- Unlock new features and cosmetics

**How to unlock:**
1. Complete World 1 levels
2. Progress to harder worlds
3. Master all campaigns

### ⚡ Speedrun Mode
- Race against the clock
- Personal best tracking
- Global leaderboards
- Ghost replays of top players

**How to play:**
1. Select a campaign level
2. Try to beat your personal record
3. See how you rank globally

### 📅 Daily Challenge
- One new puzzle every day
- Same puzzle for all players worldwide
- Compete on daily leaderboard
- Build your streak!

**Features:**
- 7-day, 30-day, 90-day streak badges
- Streak protection (freeze tokens)
- Share your score

### 🎨 Sudoku Color Hybrid
- Block puzzle meets Sudoku rules
- No color repeats in rows/columns
- 3 difficulty tiers
- Pattern-based colors for accessibility

### 🆕 Endless Mode
- Classic block puzzle experience
- 10×10 grid
- Blocks spawn in sets of 3
- Play until you can't place anymore

**Features:**
- Combo multipliers
- Power-ups (Hammer, Rotate, Bomb)
- High score tracking

---

## Tips & Tricks

### Strategy
1. **Plan ahead** - Look at next 3 blocks
2. **Build combos** - Clear multiple lines for bonus
3. **Use hints** - You get 3 hints per day
4. **Try modes** - Each mode teaches different skills

### Performance
1. **Disable animations** if game feels laggy
2. **Close other apps** to free up CPU/RAM
3. **Update graphics drivers** for better performance
4. **Use Chrome/Edge** for best performance

### Accessibility
1. **Colorblind mode** - Toggle in settings
2. **One-hand mode** - Rearrange UI for left-hand play
3. **High contrast** - Better visibility
4. **Haptic feedback** - Physical feedback on actions

---

## New Architecture Features

Block Fit now uses a modern, professional architecture:

### 🎮 Game Engine
- Framework-agnostic game logic
- Pure functions for game mechanics
- Type-safe event system
- Immutable state management

### 📱 Responsive UI
- Works on desktop and mobile
- Touch-optimized controls
- Adaptive layouts

### ⚡ Performance
- Efficient rendering
- Hot module reloading
- Tree-shaking for smaller bundle

### 🔒 Security
- Input validation
- Rate limiting on API
- CORS protection
- Type safety

---

## Next Steps After Running

### Explore the Game
1. Play through Campaign mode
2. Try different game modes
3. Check out the leaderboards
4. Customize settings

### Check the Code
1. Browse `src/engine/` for game logic
2. Look at `src/App.tsx` for UI
3. Explore `api/` for backend routes

### Read Documentation
1. **ARCHITECTURE.md** - System design
2. **TYPES_REFERENCE.md** - Type system
3. **DESIGN_PATTERNS.md** - Code patterns

---

## Getting Help

### Common Issues
- Check **Troubleshooting** section above
- Look at browser console for errors: `F12`
- Check terminal output for warnings

### Documentation
- Read QUICK_START.md (this file)
- See ARCHITECTURE.md for system design
- Check DESIGN_PATTERNS.md for code patterns

### Resources
- [Vite Docs](https://vitejs.dev/)
- [React Docs](https://react.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/)

---

## Success Checklist

- [ ] Node.js installed (`node --version`)
- [ ] Project downloaded
- [ ] Terminal opened (VS Code or cmd)
- [ ] `npm install` completed
- [ ] `npm run dev` running
- [ ] Browser showing http://localhost:5173
- [ ] Game loaded and playable
- [ ] Moved a block successfully
- [ ] Cleared a line
- [ ] 🎉 Having fun!

---

## 🚀 Ready to Play?

**You're all set!** Block Fit is a beautiful, fully-featured puzzle game with multiple modes and a modern architecture.

### What to Expect
✅ Smooth gameplay at 60 FPS  
✅ Beautiful UI with animations  
✅ Multiple game modes to explore  
✅ Responsive touch controls  
✅ Satisfying sound effects  
✅ Growing difficulty curve  

### Have Fun! 🎮
The game is designed to be relaxing yet challenging. Take your time, enjoy the puzzle-solving experience, and don't worry about perfect scores.

**Happy gaming!** 🎉

---

## Questions?

If something doesn't work:
1. Check the **Troubleshooting** section
2. Look at terminal output for error messages
3. Make sure all dependencies installed: `npm install`
4. Try restarting the dev server: `npm run dev`

**Enjoy Block Fit!** 🧩
