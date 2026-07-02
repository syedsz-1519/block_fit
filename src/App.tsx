import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Settings, 
  Undo, 
  Lightbulb, 
  RotateCcw, 
  Menu, 
  Award, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  CheckCircle, 
  Circle, 
  Sparkles, 
  X, 
  ChevronRight, 
  Palette, 
  RefreshCw, 
  User, 
  Share2,
  Lock,
  Flame,
  Info,
  Crown,
  Video,
  Play,
  Music,
  Compass,
  Eye,
  Archive,
  Calendar,
  Smartphone,
  Sliders,
  Gauge,
  Timer,
  TimerOff,
  Zap,
  Key,
  ShieldCheck
} from 'lucide-react';
import { PRESET_LEVELS, normalizeOffsets, rotateOffsets, mirrorOffsets } from './levels';
import { sound } from './sound';
import { LevelConfig, BlockShape, PlacedBlock, PlayerProfile, LeaderboardEntry } from './types';
import { VictoryParticles } from './components/VictoryParticles';
import { SudokuGridData, SudokuColor, SudokuValidator } from './sudokuLogic';
import { SudokuGridRenderer } from './components/SudokuGridRenderer';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

// Storage Key
const PROFILE_STORAGE_KEY = 'block_fit_profile_v1';

const formatDailyKey = (key: string) => {
  const dateStr = key.replace('daily_', '');
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function App() {
  // --- Game Screen States ---
  type Screen = 'splash' | 'main_menu' | 'level_select' | 'gameplay' | 'leaderboard' | 'subscription';
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  
  // --- Core Player Profile ---
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const levelProgress = parsed.levelProgress || {};
        // Pre-populate historical completed dailies if none exist
        if (!Object.keys(levelProgress).some(k => k.startsWith('daily_'))) {
          levelProgress['daily_2026-06-23'] = { stars: 3, moves: 4, time: 24, completed: true, completedAt: '6/23/2026' };
          levelProgress['daily_2026-06-24'] = { stars: 2, moves: 5, time: 38, completed: true, completedAt: '6/24/2026' };
        }
        // Fallback for missing keys
        return {
          levelProgress,
          currentLevel: parsed.currentLevel || 1,
          hintsRemaining: parsed.hintsRemaining ?? 3,
          isSubscribed: parsed.isSubscribed ?? false,
          theme: parsed.theme || 'light',
          soundEnabled: parsed.soundEnabled ?? true,
          musicEnabled: parsed.musicEnabled ?? true,
          soundscape: parsed.soundscape || 'zen',
          colorblindMode: parsed.colorblindMode ?? false,
          hapticEnabled: parsed.hapticEnabled ?? true,
          difficultySetting: parsed.difficultySetting || 'Medium',
          username: parsed.username || `Player_${Math.floor(1000 + Math.random() * 9000)}`,
          syncCode: parsed.syncCode,
          userId: parsed.userId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'usr_' + Math.random().toString(36).substring(2, 15)),
          guestCreatedAt: parsed.guestCreatedAt || new Date().toISOString(),
          isLoggedIn: parsed.isLoggedIn ?? false,
          userEmail: parsed.userEmail,
          restrictedMode: parsed.restrictedMode ?? false
        };
      }
    } catch (e) {
      // Ignore storage error
    }
    const defaultLevelProgress: any = {};
    defaultLevelProgress['daily_2026-06-23'] = { stars: 3, moves: 4, time: 24, completed: true, completedAt: '6/23/2026' };
    defaultLevelProgress['daily_2026-06-24'] = { stars: 2, moves: 5, time: 38, completed: true, completedAt: '6/24/2026' };
    return {
      levelProgress: defaultLevelProgress,
      currentLevel: 1,
      hintsRemaining: 3,
      isSubscribed: false,
      theme: 'light',
      soundEnabled: true,
      musicEnabled: true,
      soundscape: 'zen',
      colorblindMode: false,
      hapticEnabled: true,
      difficultySetting: 'Medium',
      username: `Player_${Math.floor(1000 + Math.random() * 9000)}`,
      userId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'usr_' + Math.random().toString(36).substring(2, 15),
      guestCreatedAt: new Date().toISOString(),
      isLoggedIn: false,
      restrictedMode: false
    };
  });

  const triggerHaptic = (type: 'place' | 'rotate' | 'mirror' | 'success') => {
    if (profile.hapticEnabled !== false && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        if (type === 'place') {
          navigator.vibrate(15);
        } else if (type === 'rotate') {
          navigator.vibrate(10);
        } else if (type === 'mirror') {
          navigator.vibrate([10, 30, 10]);
        } else if (type === 'success') {
          navigator.vibrate([20, 50, 20, 50, 30]);
        }
      } catch (e) {
        // Ignore vibration error
      }
    }
  };

  // Save profile to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    sound.setMuted(!profile.soundEnabled);
  }, [profile]);

  // --- Active Gameplay State ---
  const [activeLevel, setActiveLevel] = useState<LevelConfig>(PRESET_LEVELS[0]);
  const [placedBlocks, setPlacedBlocks] = useState<PlacedBlock[]>([]);
  // Tray contains blocks not yet placed on grid
  interface TrayBlock extends BlockShape {
    rotations: number;
    mirrored: boolean;
  }
  const [trayBlocks, setTrayBlocks] = useState<TrayBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  
  // Stats
  const [moveCount, setMoveCount] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [starsAwarded, setStarsAwarded] = useState(0);
  const [moveHistory, setMoveHistory] = useState<PlacedBlock[][]>([]); // For Undo
  const [activeHintIndex, setActiveHintIndex] = useState<number | null>(null);

  // --- Speedrun Mode State ---
  const [isSpeedrunMode, setIsSpeedrunMode] = useState(false);
  const [speedrunTimeRemaining, setSpeedrunTimeRemaining] = useState(30);
  const [isSpeedrunFailed, setIsSpeedrunFailed] = useState(false);
  const [speedrunLimit, setSpeedrunLimit] = useState(30);
  const [isSpeedrunPreToggled, setIsSpeedrunPreToggled] = useState(false);
  const [previewLevel, setPreviewLevel] = useState<LevelConfig | null>(null);
  const [levelShareCopied, setLevelShareCopied] = useState(false);

  // --- Daily Challenge State ---
  const [isDailyChallenge, setIsDailyChallenge] = useState(false);
  const [dailyDate, setDailyDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [dailyChallengeLevel, setDailyChallengeLevel] = useState<LevelConfig | null>(null);
  const [isFetchingDaily, setIsFetchingDaily] = useState(false);
  const [mainMenuSubView, setMainMenuSubView] = useState<'main' | 'archive'>('main');

  // --- Sudoku Color Hybrid Mode State ---
  const [isSudokuMode, setIsSudokuMode] = useState(false);
  const [sudokuGrid, setSudokuGrid] = useState<SudokuGridData | null>(null);
  const [sudokuDifficulty, setSudokuDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Expert'>('Medium');
  const [showSudokuHints, setShowSudokuHints] = useState(true);
  const [sudokuConflicts, setSudokuConflicts] = useState<{ x: number; y: number }[]>([]);

  // --- Computed Master UI stats ---
  const totalStarsEarned = useMemo(() => {
    let sum = 0;
    Object.values(profile.levelProgress).forEach((p: any) => {
      if (p.completed && p.stars) sum += p.stars;
    });
    return sum;
  }, [profile.levelProgress]);

  const [chartMetric, setChartMetric] = useState<'stars' | 'moves'>('stars');

  const streakHistoryData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `daily_${year}-${month}-${day}`;
      
      const progress = (profile.levelProgress[key] as any) || {};
      const isCompleted = !!progress.completed;
      const stars = isCompleted ? (progress.stars || 1) : 0;
      const moves = isCompleted ? (progress.moves || 0) : 0;
      const time = isCompleted ? (progress.time || 0) : 0;
      
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      data.push({
        dateStr: `${year}-${month}-${day}`,
        label,
        completed: isCompleted ? 1 : 0,
        stars,
        moves,
        time,
      });
    }
    return data;
  }, [profile.levelProgress]);

  const computedStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();
    
    const getDailyKey = (dateObj: Date) => {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      return `daily_${y}-${m}-${d}`;
    };

    let checkDate = new Date(today);
    const todayKey = getDailyKey(checkDate);
    const todayCompleted = (profile.levelProgress[todayKey] as any)?.completed;

    if (todayCompleted) {
      streak++;
      // Go backwards
      for (let i = 1; i < 100; i++) {
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() - i);
        const k = getDailyKey(nextDate);
        if ((profile.levelProgress[k] as any)?.completed) {
          streak++;
        } else {
          break;
        }
      }
    } else {
      // Check if completed yesterday to keep streak alive
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayKey = getDailyKey(yesterday);
      const yesterdayCompleted = (profile.levelProgress[yesterdayKey] as any)?.completed;
      if (yesterdayCompleted) {
        streak++;
        // Go backwards
        for (let i = 2; i < 100; i++) {
          const nextDate = new Date(today);
          nextDate.setDate(today.getDate() - i);
          const k = getDailyKey(nextDate);
          if ((profile.levelProgress[k] as any)?.completed) {
            streak++;
          } else {
            break;
          }
        }
      }
    }
    
    // Fallback to pre-populated baseline of 2 if no other entries exist to keep the streak feeling alive
    return streak > 0 ? streak : 2;
  }, [profile.levelProgress]);

  const playButtonState = useMemo(() => {
    const nextLvl = profile.currentLevel;
    const completedAll = nextLvl > PRESET_LEVELS.length;
    if (completedAll) return 'AllComplete';
    
    // Check if daily challenge available and not completed
    const dailyCompleted = (profile.levelProgress[`daily_${dailyDate}`] as any)?.completed;
    if (profile.isSubscribed && !dailyCompleted) return 'DailyAvailable';
    
    if (nextLvl === 1) return 'StartJourney';
    return 'Continue';
  }, [profile.currentLevel, profile.levelProgress, dailyDate]);

  const [leaderboardTab, setLeaderboardTab] = useState<'campaign' | 'daily' | 'speedrun'>('campaign');
  const [speedrunLeaderboardLevelId, setSpeedrunLeaderboardLevelId] = useState<number>(1);
  const [selectedWorldId, setSelectedWorldId] = useState<number>(() => {
    const lvl = profile.currentLevel;
    if (lvl <= 10) return 1;
    if (lvl <= 20) return 2;
    if (lvl <= 30) return 3;
    if (lvl <= 40) return 4;
    return 5;
  });

  // --- UI Modals & Settings Overlay ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [localUsername, setLocalUsername] = useState(profile.username);
  const [syncCodeInput, setSyncCodeInput] = useState('');
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | 'loading'; msg: string } | null>(null);
  const [leaderboardScores, setLeaderboardScores] = useState<LeaderboardEntry[]>([]);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  // --- User Authentication States ---
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // --- HTML App Url (from process env / fallback) ---
  const appUrl = "https://ai.studio/build";

  // --- Dragging Engine Refs & Temp States ---
  const boardRef = useRef<HTMLDivElement>(null);
  const levelSelectScrollRef = useRef<HTMLDivElement>(null);
  const [levelScrollRatio, setLevelScrollRatio] = useState(0);
  const blockPressTimers = useRef<{ [key: string]: any }>({});
  const blockLastTapTimes = useRef<{ [key: string]: number }>({});
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggedBlock, setDraggedBlock] = useState<{
    id: string;
    origin: 'tray' | 'grid';
    cells: [number, number][];
    color: string;
    rotations: number;
    mirrored: boolean;
  } | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [ghostPlacement, setGhostPlacement] = useState<{ x: number; y: number } | null>(null);
  const [isGhostValid, setIsGhostValid] = useState(false);
  const [undosRemaining, setUndosRemaining] = useState(3);
  const [isUndoAdOpen, setIsUndoAdOpen] = useState(false);

  // --- OAuth Redirect Session Parser & Startup Guards ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');
    const userId = params.get('userId');
    const username = params.get('username');
    const authError = params.get('auth_error');

    if (token && userId && email) {
      setProfile(prev => ({
        ...prev,
        userId,
        username: username || prev.username,
        isLoggedIn: true,
        userEmail: email,
        authToken: token,
        restrictedMode: false
      }));
      setTimeout(() => {
        sound.playWin();
      }, 500);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (authError) {
      console.error('Authentication Error:', authError);
      alert(`Authentication failed: ${authError}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Initialize sounds mute state
  useEffect(() => {
    sound.setMuted(!profile.soundEnabled);
  }, [profile.soundEnabled]);

  // Reset main menu subview on screen transition
  useEffect(() => {
    if (currentScreen !== 'main_menu') {
      setMainMenuSubView('main');
    }
  }, [currentScreen]);

  // --- Sudoku Live Conflicts Tracker ---
  useEffect(() => {
    if (isSudokuMode && sudokuGrid) {
      const conflicts: { x: number; y: number }[] = [];
      for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 6; x++) {
          const color = sudokuGrid.playerGrid[y][x];
          if (color) {
            if (!sudokuGrid.IsValidPlacement(x, y, color)) {
              conflicts.push({ x, y });
            }
          }
        }
      }
      setSudokuConflicts(conflicts);
    } else {
      setSudokuConflicts([]);
    }
  }, [isSudokuMode, sudokuGrid, placedBlocks]);

  // Handle background music transitions
  useEffect(() => {
    // Sync music mute state
    sound.setMusicMuted(profile.musicEnabled === false);
    // Sync soundscape type
    sound.setSoundscape(profile.soundscape || 'zen');

    if (currentScreen === 'splash') {
      sound.playMusic('none');
    } else if (currentScreen === 'gameplay') {
      if (gameWon) {
        sound.playMusic('win');
      } else {
        sound.playMusic('gameplay');
      }
    } else {
      sound.playMusic('menu');
    }
  }, [currentScreen, gameWon, profile.musicEnabled, profile.soundscape]);

  // Handle dynamic drag volume fading
  useEffect(() => {
    sound.setDragging(draggedBlock !== null);
  }, [draggedBlock]);

  // Scroll to current world section on entering level_select
  useEffect(() => {
    if (currentScreen === 'level_select') {
      setTimeout(() => {
        if (levelSelectScrollRef.current) {
          const container = levelSelectScrollRef.current;
          const scrollHeight = container.scrollHeight;
          const clientHeight = container.clientHeight;
          const maxScroll = scrollHeight - clientHeight;
          if (maxScroll > 0) {
            const lvl = profile.currentLevel;
            let initialWorldId = 1;
            if (lvl <= 10) initialWorldId = 1;
            else if (lvl <= 20) initialWorldId = 2;
            else if (lvl <= 30) initialWorldId = 3;
            else if (lvl <= 40) initialWorldId = 4;
            else initialWorldId = 5;
            
            setSelectedWorldId(initialWorldId);
            const targetScrollTop = (maxScroll * (initialWorldId - 1)) / 4;
            container.scrollTop = targetScrollTop;
            setLevelScrollRatio((initialWorldId - 1) / 4);
          }
        }
      }, 100);
    }
  }, [currentScreen]);

  // --- Splash Screen Simulation ---
  const [splashProgress, setSplashProgress] = useState(15);
  const [splashTip, setSplashTip] = useState("Hint: fill corners first");
  useEffect(() => {
    if (currentScreen === 'splash') {
      const tips = [
        "Drag blocks to fill the grid",
        "Double-tap to rotate",
        "Long-press to flip",
        "Fewer moves = more stars",
        "Daily challenges await",
        "Subscribe for infinite puzzles",
        "No timer — take your time",
        "Hint: fill corners first",
        "Cloud save keeps progress safe",
        "Play offline anywhere"
      ];
      let tipIndex = 0;

      const tipInterval = setInterval(() => {
        tipIndex = (tipIndex + 1) % tips.length;
        setSplashTip(tips[tipIndex]);
      }, 2500);

      const progressInterval = setInterval(() => {
        setSplashProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            clearInterval(tipInterval);
            setTimeout(() => {
               const created = new Date(profile.guestCreatedAt || new Date().toISOString()).getTime();
               const now = Date.now();
               const sevenDays = 7 * 24 * 60 * 60 * 1000;
               const isExpired = (now - created) > sevenDays;
               
               if (isExpired && !profile.isLoggedIn && !profile.restrictedMode) {
                 setCurrentScreen('auth');
               } else {
                 setCurrentScreen('main_menu');
               }
             }, 600);
            return 100;
          }
          // Increments of random speed
          return Math.min(prev + Math.floor(Math.random() * 8) + 3, 100);
        });
      }, 150);

      return () => {
        clearInterval(progressInterval);
        clearInterval(tipInterval);
      };
    }
  }, [currentScreen]);

  // --- Game Timer ---
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerActive && !gameWon && !isSpeedrunFailed) {
      interval = setInterval(() => {
        if (isSpeedrunMode) {
          setSpeedrunTimeRemaining(prev => {
            if (prev <= 1) {
              if (interval) clearInterval(interval);
              setIsSpeedrunFailed(true);
              setIsTimerActive(false);
              sound.playInvalid();
              return 0;
            }
            return prev - 1;
          });
        }
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, gameWon, isSpeedrunMode, isSpeedrunFailed]);

  // --- Fetch Leaderboard ---
  const fetchLeaderboard = useCallback(async (levelId: number) => {
    setIsLoadingScores(true);
    try {
      const res = await fetch(`/api/leaderboard?levelId=${levelId}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboardScores(data);
      }
    } catch (e) {
      console.error("Failed to load scores:", e);
    } finally {
      setIsLoadingScores(false);
    }
  }, []);

  // --- Fetch Speedrun Leaderboard ---
  const fetchSpeedrunLeaderboard = useCallback(async (levelId: number) => {
    setIsLoadingScores(true);
    try {
      const res = await fetch(`/api/speedrun/leaderboard?levelId=${levelId}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboardScores(data);
      }
    } catch (e) {
      console.error("Failed to load speedrun scores:", e);
    } finally {
      setIsLoadingScores(false);
    }
  }, []);

  // Sync username change locally and to profile
  const saveUsername = () => {
    if (localUsername.trim()) {
      setProfile(prev => ({ ...prev, username: localUsername.trim().substring(0, 20) }));
      sound.playClick();
    }
  };

  // --- Trigger Cross-Platform Sync Generation ---
  const generateSyncCode = async () => {
    setSyncLoading(true);
    setSyncStatus(null);
    try {
      const res = await fetch('/api/sync/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        const { code } = await res.json();
        setProfile(prev => ({ ...prev, syncCode: code }));
        setSyncStatus({ type: 'success', msg: `Code generated! Use ${code} on another device.` });
        sound.playWin();
      } else {
        setSyncStatus({ type: 'error', msg: 'Failed to generate sync code.' });
      }
    } catch (e) {
      setSyncStatus({ type: 'error', msg: 'Network error generating code.' });
    } finally {
      setSyncLoading(false);
    }
  };

  // --- Load Profile from Sync Code ---
  const loadFromSyncCode = async () => {
    if (!syncCodeInput.trim()) return;
    setSyncLoading(true);
    setSyncStatus(null);
    try {
      const res = await fetch('/api/sync/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: syncCodeInput.trim() })
      });
      if (res.ok) {
        const { profile: remoteProfile } = await res.json();
        setProfile({ ...remoteProfile, syncCode: syncCodeInput.trim().toUpperCase() });
        setSyncStatus({ type: 'success', msg: 'Profile synced successfully!' });
        sound.playWin();
      } else {
        setSyncStatus({ type: 'error', msg: 'Code not found or expired.' });
        sound.playInvalid();
      }
    } catch (e) {
      setSyncStatus({ type: 'error', msg: 'Network error syncing profile.' });
      sound.playInvalid();
    } finally {
      setSyncLoading(false);
    }
  };

  // --- Save Profile to Existing Sync Code ---
  const saveToSyncCode = async () => {
    if (!profile.syncCode) return;
    setSyncLoading(true);
    setSyncStatus(null);
    try {
      const res = await fetch('/api/sync/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: profile.syncCode, profile })
      });
      if (res.ok) {
        setSyncStatus({ type: 'success', msg: 'Cloud progress synchronized!' });
        sound.playWin();
      } else {
        setSyncStatus({ type: 'error', msg: 'Failed to sync cloud progress.' });
        sound.playInvalid();
      }
    } catch (e) {
      setSyncStatus({ type: 'error', msg: 'Network error cloud syncing.' });
      sound.playInvalid();
    } finally {
      setSyncLoading(false);
    }
  };

  // --- Save Profile to cloud for Authed User ---
  const saveProfileToCloud = async (overrideProfile?: any) => {
    const profToSave = overrideProfile || profile;
    if (!profToSave.isLoggedIn || !profToSave.userId) return;
    try {
      await fetch('/api/auth/save-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profToSave.userId,
          email: profToSave.userEmail,
          username: profToSave.username,
          profileData: profToSave
        })
      });
    } catch (e) {
      console.error('Failed to auto-save profile to cloud:', e);
    }
  };

  const handleLogout = () => {
    sound.playClick();
    if (confirm("Are you sure you want to log out? Your guest profile will be reset.")) {
      const newGuestId = `guest_${Math.random().toString(36).substr(2, 9)}`;
      setProfile({
        levelProgress: {},
        currentLevel: 1,
        hintsRemaining: 3,
        isSubscribed: false,
        theme: 'light',
        soundEnabled: true,
        musicEnabled: true,
        hapticEnabled: true,
        colorblindMode: false,
        soundscape: 'zen',
        username: `Guest_${newGuestId.split('_')[1].toUpperCase()}`,
        userId: newGuestId,
        guestCreatedAt: new Date().toISOString(),
        isLoggedIn: false,
        userEmail: '',
        restrictedMode: false,
        authToken: ''
      });
      setCurrentScreen('main_menu');
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthErrorMessage("Email and password are required.");
      return;
    }
    if (authMode === 'signup' && !authUsername) {
      setAuthErrorMessage("Username is required.");
      return;
    }
    if (authMode === 'signup' && !termsAccepted) {
      setAuthErrorMessage("You must accept the Terms and Conditions to register.");
      return;
    }

    setAuthLoading(true);
    setAuthErrorMessage('');

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body = authMode === 'login' 
        ? { email: authEmail, password: authPassword }
        : { email: authEmail, password: authPassword, username: authUsername };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthErrorMessage(data.error || 'Authentication failed.');
        sound.playInvalid();
      } else {
        sound.playWin();
        if (authMode === 'login') {
          // If login returned a saved profile, load it!
          const loadedProfile = data.profile ? {
            ...data.profile,
            isLoggedIn: true,
            userEmail: data.email,
            userId: data.userId,
            authToken: data.token,
            restrictedMode: false
          } : {
            ...profile,
            username: data.username,
            userId: data.userId,
            isLoggedIn: true,
            userEmail: data.email,
            authToken: data.token,
            restrictedMode: false
          };
          setProfile(loadedProfile);
        } else {
          alert("Account created successfully! Please sign in to verify.");
          setAuthMode('login');
          setAuthLoading(false);
          return;
        }
        setCurrentScreen('main_menu');
      }
    } catch (err) {
      setAuthErrorMessage('Network error during authentication.');
      sound.playInvalid();
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    sound.playClick();
    try {
      const res = await fetch('/api/auth/google');
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        alert("Failed to get Google login URL.");
      }
    } catch (e) {
      alert("Network error starting Google login.");
    }
  };

  const getAdjustedLevel = (level: LevelConfig, diff: 'Easy' | 'Medium' | 'Hard'): LevelConfig => {
    // Deep copy the level so we don't mutate the global PRESET_LEVELS
    const adjusted: LevelConfig = JSON.parse(JSON.stringify(level));

    if (diff === 'Easy') {
      // Reduce number of available blocks.
      // If level has >= 3 blocks, we can remove 1 block. If >= 5 blocks, remove 2.
      const blocksToRemove = adjusted.availableBlocks.length >= 5 ? 2 : adjusted.availableBlocks.length >= 3 ? 1 : 0;
      if (blocksToRemove > 0 && adjusted.hintSequence) {
        // Let's remove the last block(s) from availableBlocks
        for (let r = 0; r < blocksToRemove; r++) {
          const removeIdx = adjusted.availableBlocks.length - 1;
          const hint = adjusted.hintSequence.find(h => h.blockIndex === removeIdx);
          if (hint) {
            // Find grid coordinates occupied by this block in the solution
            const blockShape = adjusted.availableBlocks[removeIdx];
            let cells = rotateOffsets(blockShape.cells as [number, number][], hint.rotations);
            cells = mirrorOffsets(cells, hint.mirrored);
            const globalCells = cells.map(([cx, cy]) => [cx + hint.x, cy + hint.y]);
            
            // Add these cells to blockedCells
            adjusted.blockedCells = [...adjusted.blockedCells, ...globalCells];
          }
          // Remove the block
          adjusted.availableBlocks.splice(removeIdx, 1);
        }
      }
      adjusted.difficulty = 'Easy';
      // Also adjust parMoves to make it easier
      adjusted.parMoves = Math.max(2, adjusted.availableBlocks.length + 1);
    } else if (diff === 'Hard') {
      // Increase difficulty / layout complexity by splitting the largest block into two smaller pieces
      let largestBlockIdx = -1;
      let maxSize = 0;
      for (let i = 0; i < adjusted.availableBlocks.length; i++) {
        if (adjusted.availableBlocks[i].cells.length > maxSize) {
          maxSize = adjusted.availableBlocks[i].cells.length;
          largestBlockIdx = i;
        }
      }

      if (largestBlockIdx !== -1 && maxSize >= 3) {
        const originalBlock = adjusted.availableBlocks[largestBlockIdx];
        const cells = [...originalBlock.cells];
        const half = Math.floor(cells.length / 2);
        
        const cellsA = normalizeOffsets(cells.slice(0, half));
        const cellsB = normalizeOffsets(cells.slice(half));

        const blockA = {
          cells: cellsA,
          color: originalBlock.color,
          name: `${originalBlock.name} (Split A)`
        };
        const blockB = {
          cells: cellsB,
          color: originalBlock.color.replace('border-b-3', 'border-b-2 opacity-95'),
          name: `${originalBlock.name} (Split B)`
        };

        // Replace the largest block with the two split blocks
        adjusted.availableBlocks.splice(largestBlockIdx, 1, blockA, blockB);
        
        // Adjust parMoves
        adjusted.parMoves = adjusted.availableBlocks.length + 2;
      }
      adjusted.difficulty = 'Hard';
    } else {
      adjusted.difficulty = 'Medium';
    }

    return adjusted;
  };

  const centerLevelOn8x8 = (level: LevelConfig): LevelConfig => {
    if (level.gridWidth === 8 && level.gridHeight === 8) return level;
    
    const activeWidth = level.gridWidth;
    const activeHeight = level.gridHeight;
    const offsetX = Math.floor((8 - activeWidth) / 2);
    const offsetY = Math.floor((8 - activeHeight) / 2);
    
    const adjusted: LevelConfig = JSON.parse(JSON.stringify(level));
    adjusted.gridWidth = 8;
    adjusted.gridHeight = 8;
    
    const shiftedBlocked = level.blockedCells.map(([bx, by]) => [bx + offsetX, by + offsetY]);
    
    const borderBlocked: number[][] = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if (x < offsetX || x >= offsetX + activeWidth || y < offsetY || y >= offsetY + activeHeight) {
          borderBlocked.push([x, y]);
        }
      }
    }
    
    adjusted.blockedCells = [...borderBlocked, ...shiftedBlocked];
    
    if (level.hintSequence) {
      adjusted.hintSequence = level.hintSequence.map(h => ({
        ...h,
        x: h.x + offsetX,
        y: h.y + offsetY
      }));
    }
    
    return adjusted;
  };

  // --- Gameplay System Setup ---
  const startLevel = (level: LevelConfig, isSpeedrun: boolean = false) => {
    setIsSudokuMode(false);
    setIsDailyChallenge(false);
    
    const originalLevel = PRESET_LEVELS.find(l => l.id === level.id) || level;
    const adjustedLevel = getAdjustedLevel(originalLevel, profile.difficultySetting || 'Medium');

    setActiveLevel(adjustedLevel);
    setMoveCount(0);
    setTimerSeconds(0);
    setIsTimerActive(true);
    setGameWon(false);
    setShowWinModal(false);
    setStarsAwarded(0);
    setPlacedBlocks([]);
    setMoveHistory([]);
    setActiveHintIndex(null);
    setUndosRemaining(3);
    
    // Speedrun Mode Setup
    setIsSpeedrunMode(isSpeedrun);
    if (isSpeedrun) {
      const limit = Math.max(15, adjustedLevel.parTime || (adjustedLevel.availableBlocks.length * 8) + 5);
      setSpeedrunLimit(limit);
      setSpeedrunTimeRemaining(limit);
      setIsSpeedrunFailed(false);
    } else {
      setIsSpeedrunFailed(false);
    }
    
    // Map Level Shape items
    const mapped = adjustedLevel.availableBlocks.map((block, idx) => ({
      id: `block_${idx}`,
      cells: block.cells as [number, number][],
      color: block.color,
      name: block.name,
      rotations: 0,
      mirrored: false,
      originalCells: block.cells as [number, number][]
    }));
    setTrayBlocks(mapped);
    setSelectedBlockId(null);
    setCurrentScreen('gameplay');
    
    if (isSpeedrun) {
      fetchSpeedrunLeaderboard(adjustedLevel.id);
    } else {
      fetchLeaderboard(adjustedLevel.id);
    }
    sound.playClick();
  };

  const startDailyChallenge = async (customDate?: string) => {
    setIsSudokuMode(false);
    const targetDate = customDate || dailyDate;
    setIsFetchingDaily(true);
    try {
      const res = await fetch(`/api/daily-challenge?date=${targetDate}`);
      if (res.ok) {
        const data = await res.json();
        const level = data.level;
        if (customDate) {
          setDailyDate(customDate);
        }
        setDailyChallengeLevel(level);
        setIsDailyChallenge(true);
        setActiveLevel(level);
        setMoveCount(0);
        setTimerSeconds(0);
        setIsTimerActive(true);
        setGameWon(false);
        setShowWinModal(false);
        setStarsAwarded(0);
        setPlacedBlocks([]);
        setMoveHistory([]);
        setActiveHintIndex(null);
        setUndosRemaining(3);
        
        const mapped = level.availableBlocks.map((block: any, idx: number) => ({
          id: `block_${idx}`,
          cells: block.cells as [number, number][],
          color: block.color,
          name: block.name,
          rotations: 0,
          mirrored: false,
          originalCells: block.cells as [number, number][]
        }));
        setTrayBlocks(mapped);
        setSelectedBlockId(null);
        setCurrentScreen('gameplay');
        setLeaderboardScores(data.leaderboard);
        sound.playClick();
      }
    } catch (err) {
      console.error("Failed to fetch daily challenge:", err);
    } finally {
      setIsFetchingDaily(false);
    }
  };

  const startSudokuLevel = (difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert' = 'Medium') => {
    setIsSudokuMode(true);
    setIsDailyChallenge(false);
    setIsSpeedrunMode(false);
    setSudokuDifficulty(difficulty);

    const grid = new SudokuGridData();
    grid.SetDifficulty(difficulty);

    // Group the remaining empty cells into 2 to 5-cell polyomino block shapes!
    const emptyCoords: { x: number; y: number }[] = [];
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        if (grid.cellStates[y][x] === 'empty') {
          emptyCoords.push({ x, y });
        }
      }
    }

    const blocks: any[] = [];
    let blockIndex = 0;
    const visited = new Set<string>();
    const getCoordKey = (x: number, y: number) => `${x},${y}`;

    const isAvailable = (x: number, y: number) => {
      return x >= 0 && x < 6 && y >= 0 && y < 6 &&
             grid.cellStates[y][x] === 'empty' &&
             !visited.has(getCoordKey(x, y));
    };

    // Partition logic
    const cellsToPartition = [...emptyCoords];
    // Shuffle cells to partition organically
    for (let i = cellsToPartition.length - 1; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1));
      const temp = cellsToPartition[i];
      cellsToPartition[i] = cellsToPartition[r];
      cellsToPartition[r] = temp;
    }

    for (const coord of cellsToPartition) {
      const key = getCoordKey(coord.x, coord.y);
      if (visited.has(key)) continue;

      const cluster: { x: number; y: number }[] = [];
      const queue: { x: number; y: number }[] = [{ x: coord.x, y: coord.y }];
      visited.add(key);

      const desiredSize = Math.floor(Math.random() * 4) + 2; // size 2, 3, 4, 5

      while (queue.length > 0 && cluster.length < desiredSize) {
        const current = queue.shift()!;
        cluster.push(current);

        const neighbors = [
          { x: current.x + 1, y: current.y },
          { x: current.x - 1, y: current.y },
          { x: current.x, y: current.y + 1 },
          { x: current.x, y: current.y - 1 },
        ];

        // Shuffle neighbors to get organic shapes
        for (let i = neighbors.length - 1; i > 0; i--) {
          const r = Math.floor(Math.random() * (i + 1));
          const temp = neighbors[i];
          neighbors[i] = neighbors[r];
          neighbors[r] = temp;
        }

        for (const n of neighbors) {
          if (isAvailable(n.x, n.y)) {
            const nKey = getCoordKey(n.x, n.y);
            if (!queue.some(q => q.x === n.x && q.y === n.y)) {
              visited.add(nKey);
              queue.push(n);
            }
          }
        }
      }

      const minX = Math.min(...cluster.map(c => c.x));
      const minY = Math.min(...cluster.map(c => c.y));

      const normalizedCells = cluster.map(c => [c.x - minX, c.y - minY]);
      const cellColors = cluster.map(c => grid.solutionGrid[c.y][c.x]!);

      const names = ['Domino', 'Tromino', 'Tetromino', 'Pentomino'];
      const shapeName = `${cellColors.length}-Cell ${names[Math.min(names.length - 1, cellColors.length - 2)] || 'Polyomino'}`;

      // Pick a random block color class for display
      const colors = ['#8ec9c4', '#FAF8F5', '#8ba89a', '#c07d72', '#c8a86e'];
      const colorHex = colors[blockIndex % colors.length];

      blocks.push({
        id: `sudoku_${blockIndex}`,
        cells: normalizedCells,
        cellColors,
        color: colorHex,
        name: shapeName,
        rotations: 0,
        mirrored: false,
        originalCells: normalizedCells
      });

      blockIndex++;
    }

    setSudokuGrid(grid);
    setTrayBlocks(blocks);
    setPlacedBlocks([]);
    setMoveCount(0);
    setTimerSeconds(0);
    setIsTimerActive(true);
    setGameWon(false);
    setShowWinModal(false);
    setStarsAwarded(0);
    setMoveHistory([]);
    setActiveHintIndex(null);
    setUndosRemaining(3);

    setActiveLevel({
      id: 9999, // Sudoku level ID
      name: "Sudoku-Color Hybrid Mode",
      gridWidth: 6,
      gridHeight: 6,
      blockedCells: [],
      availableBlocks: [],
      parMoves: blocks.length + 3,
      parTime: 240,
      difficulty: difficulty === 'Expert' ? 'Expert' : difficulty === 'Hard' ? 'Hard' : difficulty === 'Medium' ? 'Medium' : 'Easy',
    } as any);

    setCurrentScreen('gameplay');
    sound.playClick();
  };

  const handleWinSudoku = () => {
    setGameWon(true);
    setIsTimerActive(false);
    sound.playWin();
    triggerHaptic('success');

    setTimeout(() => {
      setShowWinModal(true);
    }, 1600);

    let stars = 3;
    const optimalMoves = activeLevel.parMoves;
    const optimalTime = activeLevel.parTime;
    const totalMoves = moveCount + 1;
    const totalTime = timerSeconds;

    if (totalMoves <= optimalMoves && totalTime <= optimalTime) {
      stars = 3;
    } else if (totalMoves <= optimalMoves + 3 || totalTime <= optimalTime * 1.5) {
      stars = 2;
    } else {
      stars = 1;
    }
    setStarsAwarded(stars);

    const key = `sudoku_${sudokuDifficulty}`;
    setProfile(prev => {
      const currentStats = prev.levelProgress[key] || { stars: 0, moves: 9999, time: 9999, completed: false };
      return {
        ...prev,
        levelProgress: {
          ...prev.levelProgress,
          [key]: {
            stars: Math.max(currentStats.stars, stars),
            moves: Math.min(currentStats.moves, totalMoves),
            time: Math.min(currentStats.time, totalTime),
            completed: true,
            completedAt: new Date().toLocaleDateString()
          }
        }
      };
    });
  };

  const fetchDailyLeaderboard = useCallback(async (date: string) => {
    setIsLoadingScores(true);
    try {
      const res = await fetch(`/api/daily-challenge?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboardScores(data.leaderboard);
      }
    } catch (e) {
      console.error("Failed to load daily scores:", e);
    } finally {
      setIsLoadingScores(false);
    }
  }, []);

  // Re-start Level
  const resetLevel = () => {
    if (isSudokuMode) {
      startSudokuLevel(sudokuDifficulty);
    } else {
      startLevel(activeLevel, isSpeedrunMode);
    }
    sound.playRotate();
  };

  // Undo Last Placement
  const handleUndo = () => {
    if (placedBlocks.length === 0) return;
    
    // Check Undo Limit for non-subscribers
    if (!profile.isSubscribed && undosRemaining <= 0) {
      sound.playInvalid();
      setIsUndoAdOpen(true);
      return;
    }

    sound.playClick();

    // Deduct undo
    if (!profile.isSubscribed) {
      setUndosRemaining(prev => Math.max(0, prev - 1));
    }
    
    // Pop last item
    const last = placedBlocks[placedBlocks.length - 1];
    setPlacedBlocks(prev => prev.slice(0, prev.length - 1));

    // Return block back to tray
    if (isSudokuMode && sudokuGrid) {
      const restoredTrayBlock: TrayBlock = {
        id: last.shapeId,
        cells: last.originalCells as [number, number][],
        color: last.color,
        name: last.name,
        rotations: last.rotations,
        mirrored: last.mirrored,
        cellColors: last.cellColors,
        originalCells: last.originalCells
      } as any;

      const nextGrid = sudokuGrid.clone();
      for (const [cx, cy] of last.cells) {
        nextGrid.playerGrid[cy][cx] = null;
        nextGrid.cellStates[cy][cx] = 'empty';
      }
      setSudokuGrid(nextGrid);

      setTrayBlocks(prev => [...prev, restoredTrayBlock]);
      setMoveCount(prev => prev + 1);
    } else {
      const originalBlock = activeLevel.availableBlocks[parseInt(last.shapeId.split('_')[1])];
      const restoredTrayBlock: TrayBlock = {
        id: last.shapeId,
        cells: originalBlock.cells as [number, number][],
        color: last.color,
        name: originalBlock.name,
        rotations: last.rotations,
        mirrored: last.mirrored
      };

      setTrayBlocks(prev => [...prev, restoredTrayBlock]);
      setMoveCount(prev => prev + 1);
    }
  };

  // Rotation & Mirroring
  const handleRotateBlock = (blockId: string) => {
    if (gameWon) return;
    // If block is in the tray
    setTrayBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        sound.playRotate();
        triggerHaptic('rotate');
        return {
          ...b,
          rotations: (b.rotations + 1) % 4
        };
      }
      return b;
    }));
  };

  const handleMirrorBlock = (blockId: string) => {
    if (gameWon) return;
    setTrayBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        sound.playRotate();
        triggerHaptic('mirror');
        return {
          ...b,
          mirrored: !b.mirrored
        };
      }
      return b;
    }));
  };

  // --- Validate Win Condition ---
  const checkWin = (blocks: PlacedBlock[]) => {
    // We win when all available blocks are placed on the grid, and they fill the empty cells exactly.
    // Total cells of board: gridWidth * gridHeight
    // Target active cells: (width * height) - blockedCells
    const totalGridCells = activeLevel.gridWidth * activeLevel.gridHeight;
    const targetFilledCount = totalGridCells - activeLevel.blockedCells.length;

    // Placed blocks cell count
    let placedCellsCount = 0;
    const occupiedCoords = new Set<string>();

    for (const pb of blocks) {
      for (const [cx, cy] of pb.cells) {
        occupiedCoords.add(`${cx},${cy}`);
        placedCellsCount++;
      }
    }

    // Must have no duplicates (no overlaps)
    const hasOverlaps = occupiedCoords.size !== placedCellsCount;

    // Check if the board is perfectly filled
    const allFilled = occupiedCoords.size === targetFilledCount;

    // Check that we didn't land on blocked cells
    let hitBlocked = false;
    for (const [bx, by] of activeLevel.blockedCells) {
      if (occupiedCoords.has(`${bx},${by}`)) {
        hitBlocked = true;
      }
    }

    if (allFilled && !hasOverlaps && !hitBlocked && blocks.length === activeLevel.availableBlocks.length) {
      // WINNER!
      setGameWon(true);
      setIsTimerActive(false);
      sound.playWin();
      triggerHaptic('success');

      // Delay showing the overlay modal so the canvas particle explosion has time to shine on the board
      setTimeout(() => {
        setShowWinModal(true);
      }, 1600);

      // Star calculation
      let stars = 1;
      const optimalMoves = activeLevel.parMoves;
      const optimalTime = activeLevel.parTime;
      const totalMoves = moveCount + 1;
      const totalTime = timerSeconds;

      if (totalMoves <= optimalMoves && totalTime <= optimalTime) {
        stars = 3;
      } else if (totalMoves <= optimalMoves + 3 || totalTime <= optimalTime * 1.5) {
        stars = 2;
      } else {
        stars = 1;
      }
      setStarsAwarded(stars);

      // Save progress and submit score
      if (isDailyChallenge) {
        const updatedProfile = {
          ...profile,
          levelProgress: {
            ...profile.levelProgress,
            [`daily_${dailyDate}`]: {
              stars,
              moves: moveCount + 1,
              time: timerSeconds,
              completed: true,
              completedAt: new Date().toLocaleDateString()
            }
          }
        };
        setProfile(updatedProfile);
        saveProfileToCloud(updatedProfile);

        fetch('/api/daily-challenge/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dateStr: dailyDate,
            username: profile.username,
            userId: profile.userId,
            placedBlocks: blocks.map(pb => ({
              blockId: pb.blockId,
              cells: pb.cells
            })),
            moves: moveCount + 1,
            time: timerSeconds
          })
        }).then(res => res.json())
        .then(data => {
          if (data.success) {
            setLeaderboardScores(data.leaderboard);
          }
        }).catch(err => console.error("Failed to post daily score:", err));
      } else {
        const currentLevelProgress = profile.levelProgress[activeLevel.id] || { stars: 0, moves: 9999, time: 9999, completed: false };
        const betterStars = Math.max(currentLevelProgress.stars, stars);
        const betterMoves = Math.min(currentLevelProgress.moves, moveCount + 1);
        const betterTime = Math.min(currentLevelProgress.time, timerSeconds);

        const nextLevelUnlocked = Math.max(profile.currentLevel, activeLevel.id + 1);

        const updatedProfile = {
          ...profile,
          currentLevel: nextLevelUnlocked,
          levelProgress: {
            ...profile.levelProgress,
            [activeLevel.id]: {
              stars: betterStars,
              moves: betterMoves,
              time: betterTime,
              completed: true
            }
          }
        };
        setProfile(updatedProfile);
        saveProfileToCloud(updatedProfile);

        // Submit score to global server leaderboard!
        const endpoint = isSpeedrunMode ? '/api/speedrun/leaderboard' : '/api/leaderboard';
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: profile.username,
            userId: profile.userId,
            levelId: activeLevel.id,
            stars: isSpeedrunMode ? 3 : stars, // Completing speedrun is always 3 stars of honor!
            moves: moveCount + 1,
            time: timerSeconds
          })
        }).then(() => {
          if (isSpeedrunMode) {
            fetchSpeedrunLeaderboard(activeLevel.id);
          } else {
            fetchLeaderboard(activeLevel.id);
          }
        }).catch(err => console.error("Failed to post score:", err));
      }
    }
  };

  // --- Dragging Calculations ---
  const handlePointerDown = (
    e: React.PointerEvent,
    block: any,
    origin: 'tray' | 'grid'
  ) => {
    e.preventDefault();
    if (gameWon) return;
    setSelectedBlockId(block.id || block.blockId);
    
    let blockCells = block.cells;
    let blockColor = block.color;
    let rotations = block.rotations ?? 0;
    let mirrored = block.mirrored ?? false;

    // Apply rotation and mirroring for calculating drag layout
    let transformed = rotateOffsets(blockCells, rotations);
    transformed = mirrorOffsets(transformed, mirrored);

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // Offset inside the block node being dragged
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDraggedBlock({
      id: block.id || block.blockId,
      origin,
      cells: transformed,
      color: blockColor,
      rotations,
      mirrored
    });

    setDragOffset({ x: offsetX, y: offsetY });
    setDragPosition({ x: e.clientX, y: e.clientY });
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggedBlock) return;
    setDragPosition({ x: e.clientX, y: e.clientY });

    // Cancel long press if drag moved more than 10px
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > 10) {
      if (blockPressTimers.current[draggedBlock.id]) {
        clearTimeout(blockPressTimers.current[draggedBlock.id]);
        delete blockPressTimers.current[draggedBlock.id];
      }
    }

    if (!boardRef.current) return;
    const boardRect = boardRef.current.getBoundingClientRect();

    // Calculate grid cell target coordinates based on top-left anchor of first cell
    const cellWidth = boardRect.width / activeLevel.gridWidth;
    const cellHeight = boardRect.height / activeLevel.gridHeight;

    const dragLeft = e.clientX - boardRect.left - dragOffset.x;
    const dragTop = (e.clientY - 45) - boardRect.top - dragOffset.y;

    const gridX = Math.round(dragLeft / cellWidth);
    const gridY = Math.round(dragTop / cellHeight);

    // Check if the block's coordinates overlap the grid area at all to show ghost preview
    const maxBlockSize = 5;
    const onBoard = gridX >= -maxBlockSize && gridX < activeLevel.gridWidth && gridY >= -maxBlockSize && gridY < activeLevel.gridHeight;

    // Validate placement
    let valid = true;
    if (isSudokuMode && sudokuGrid) {
      // 1. Check basic grid boundary and cell overlaps with other blocks
      for (const [ox, oy] of draggedBlock.cells) {
        const tx = gridX + ox;
        const ty = gridY + oy;

        if (tx < 0 || tx >= 6 || ty < 0 || ty >= 6) {
          valid = false;
          break;
        }

        // Check if overlaps with predefined fixed cells
        if (sudokuGrid.cellStates[ty][tx] === 'fixed') {
          valid = false;
          break;
        }

        // Check if overlaps with other PLACED blocks (not including self if we are re-dragging it)
        if (placedBlocks.some(pb => pb.blockId !== draggedBlock.id && pb.cells.some(([cx, cy]) => cx === tx && cy === ty))) {
          valid = false;
          break;
        }
      }

      // 2. If valid so far, validate Sudoku rule conflicts
      if (valid) {
        const tempBlock = {
          id: draggedBlock.id,
          cells: draggedBlock.cells,
          cellColors: draggedBlock.cellColors || [],
          name: draggedBlock.name
        };
        
        const tempGrid = sudokuGrid.clone();
        // Clear self cells first from cloned grid to prevent self-conflict
        for (const pb of placedBlocks) {
          if (pb.blockId === draggedBlock.id) {
            for (const [cx, cy] of pb.cells) {
              tempGrid.playerGrid[cy][cx] = null;
              tempGrid.cellStates[cy][cx] = 'empty';
            }
          }
        }

        const validation = SudokuValidator.ValidateDrag(tempBlock, gridX, gridY, tempGrid);
        valid = validation.isValid;
      }
    } else {
      for (const [ox, oy] of draggedBlock.cells) {
        const tx = gridX + ox;
        const ty = gridY + oy;

        if (tx < 0 || tx >= activeLevel.gridWidth || ty < 0 || ty >= activeLevel.gridHeight) {
          valid = false;
          break;
        }

        // Check blocked cells
        if (activeLevel.blockedCells.some(([bx, by]) => bx === tx && by === ty)) {
          valid = false;
          break;
        }

        // Check other placed blocks
        if (placedBlocks.some(pb => pb.blockId !== draggedBlock.id && pb.cells.some(([cx, cy]) => cx === tx && cy === ty))) {
          valid = false;
          break;
        }
      }
    }

    if (onBoard) {
      setGhostPlacement({ x: gridX, y: gridY });
      setIsGhostValid(valid);
    } else {
      setGhostPlacement(null);
      setIsGhostValid(false);
    }
  };

  const handlePointerUp = () => {
    if (!draggedBlock) return;

    if (ghostPlacement && isGhostValid) {
      // Perfect fit! Snap onto board
      const snappedCells: [number, number][] = draggedBlock.cells.map(([ox, oy]) => [
        ghostPlacement.x + ox,
        ghostPlacement.y + oy
      ]);

      const newPlaced: PlacedBlock = {
        blockId: draggedBlock.id,
        shapeId: draggedBlock.id,
        color: draggedBlock.color,
        cells: snappedCells,
        x: ghostPlacement.x,
        y: ghostPlacement.y,
        rotations: draggedBlock.rotations,
        mirrored: draggedBlock.mirrored,
        cellColors: draggedBlock.cellColors,
        originalCells: draggedBlock.originalCells
      };

      // Add to placed
      const updatedPlaced = [...placedBlocks.filter(pb => pb.blockId !== draggedBlock.id), newPlaced];
      setPlacedBlocks(updatedPlaced);

      if (isSudokuMode && sudokuGrid) {
        // Clone and place on grid
        const nextGrid = sudokuGrid.clone();
        
        // Clear old placements for this block first if any
        for (const pb of placedBlocks) {
          if (pb.blockId === draggedBlock.id) {
            for (const [cx, cy] of pb.cells) {
              nextGrid.playerGrid[cy][cx] = null;
              nextGrid.cellStates[cy][cx] = 'empty';
            }
          }
        }

        // Place new
        for (let i = 0; i < snappedCells.length; i++) {
          const [cx, cy] = snappedCells[i];
          const color = draggedBlock.cellColors[i];
          nextGrid.playerGrid[cy][cx] = color;
          nextGrid.cellStates[cy][cx] = 'placed';
        }

        setSudokuGrid(nextGrid);
        
        // Remove from tray if came from tray
        if (draggedBlock.origin === 'tray') {
          setTrayBlocks(prev => prev.filter(tb => tb.id !== draggedBlock.id));
        }

        setMoveCount(prev => prev + 1);
        sound.playPlace();
        triggerHaptic('place');

        // Check Sudoku win condition
        if (nextGrid.IsGridComplete()) {
          handleWinSudoku();
        }
      } else {
        // Remove from tray if came from tray
        if (draggedBlock.origin === 'tray') {
          setTrayBlocks(prev => prev.filter(tb => tb.id !== draggedBlock.id));
        }

        setMoveCount(prev => prev + 1);
        sound.playPlace();
        triggerHaptic('place');

        // Check win condition
        checkWin(updatedPlaced);
      }
    } else {
      // Invalid release. Return back
      sound.playInvalid();

      if (draggedBlock.origin === 'grid') {
        // Return grid block back to tray
        const blockToRestore = placedBlocks.find(pb => pb.blockId === draggedBlock.id);
        if (blockToRestore) {
          if (isSudokuMode && sudokuGrid) {
            const restoredTrayBlock: TrayBlock = {
              id: draggedBlock.id,
              cells: blockToRestore.originalCells as [number, number][],
              color: draggedBlock.color,
              name: blockToRestore.name,
              rotations: draggedBlock.rotations,
              mirrored: draggedBlock.mirrored,
              cellColors: blockToRestore.cellColors,
              originalCells: blockToRestore.originalCells
            } as any;

            // Clear cells from sudokuGrid as well!
            const nextGrid = sudokuGrid.clone();
            for (const [cx, cy] of blockToRestore.cells) {
              nextGrid.playerGrid[cy][cx] = null;
              nextGrid.cellStates[cy][cx] = 'empty';
            }
            setSudokuGrid(nextGrid);

            setPlacedBlocks(prev => prev.filter(pb => pb.blockId !== draggedBlock.id));
            setTrayBlocks(prev => [...prev, restoredTrayBlock]);
            setMoveCount(prev => prev + 1);
          } else {
            const originalBlock = activeLevel.availableBlocks[parseInt(draggedBlock.id.split('_')[1])];
            const restoredTrayBlock: TrayBlock = {
              id: draggedBlock.id,
              cells: originalBlock.cells as [number, number][],
              color: draggedBlock.color,
              name: originalBlock.name,
              rotations: draggedBlock.rotations,
              mirrored: draggedBlock.mirrored
            };
            setPlacedBlocks(prev => prev.filter(pb => pb.blockId !== draggedBlock.id));
            setTrayBlocks(prev => [...prev, restoredTrayBlock]);
            setMoveCount(prev => prev + 1);
          }
        }
      }
    }

    setDraggedBlock(null);
    setGhostPlacement(null);
    setIsGhostValid(false);
  };

  // Lift block from grid back to tray on click
  const handleLiftPlacedBlock = (pb: PlacedBlock) => {
    if (gameWon) return;
    sound.playClick();
    
    if (isSudokuMode && sudokuGrid) {
      const restoredTrayBlock: TrayBlock = {
        id: pb.blockId,
        cells: pb.originalCells as [number, number][],
        color: pb.color,
        name: pb.name,
        rotations: pb.rotations,
        mirrored: pb.mirrored,
        cellColors: pb.cellColors,
        originalCells: pb.originalCells
      } as any;

      // Clean cells from sudokuGrid
      const nextGrid = sudokuGrid.clone();
      for (const [cx, cy] of pb.cells) {
        nextGrid.playerGrid[cy][cx] = null;
        nextGrid.cellStates[cy][cx] = 'empty';
      }
      setSudokuGrid(nextGrid);

      setPlacedBlocks(prev => prev.filter(item => item.blockId !== pb.blockId));
      setTrayBlocks(prev => [...prev, restoredTrayBlock]);
      setMoveCount(prev => prev + 1);
    } else {
      const originalBlock = activeLevel.availableBlocks[parseInt(pb.blockId.split('_')[1])];
      const restoredTrayBlock: TrayBlock = {
        id: pb.blockId,
        cells: originalBlock.cells as [number, number][],
        color: pb.color,
        name: originalBlock.name,
        rotations: pb.rotations,
        mirrored: pb.mirrored
      };

      setPlacedBlocks(prev => prev.filter(item => item.blockId !== pb.blockId));
      setTrayBlocks(prev => [...prev, restoredTrayBlock]);
      setMoveCount(prev => prev + 1);
    }
  };

  const handleSudokuCellClick = (x: number, y: number) => {
    if (isSudokuMode && sudokuGrid) {
      const state = sudokuGrid.cellStates[y][x];
      if (state === 'placed') {
        const pb = placedBlocks.find(block => block.cells.some(([cx, cy]) => cx === x && cy === y));
        if (pb) {
          handleLiftPlacedBlock(pb);
        }
      }
    }
  };

  // --- Hint System ---
  const handleUseHint = () => {
    if (profile.hintsRemaining <= 0 && !profile.isSubscribed) {
      // Trigger paywall/upgrade screen
      setCurrentScreen('subscription');
      return;
    }

    // Find the first unplaced block in tray
    if (trayBlocks.length === 0) return;
    const nextTrayBlock = trayBlocks[0];

    // Find hint sequence coordinate in LevelConfig
    const solution = activeLevel.hintSequence?.find(h => h.blockIndex === parseInt(nextTrayBlock.id.split('_')[1]));
    if (!solution) {
      sound.playInvalid();
      return;
    }

    sound.playRotate();
    triggerHaptic('rotate');
    setActiveHintIndex(solution.blockIndex);

    // Apply exact solution coordinates to the block state
    setTrayBlocks(prev => prev.map(tb => {
      if (tb.id === nextTrayBlock.id) {
        return {
          ...tb,
          rotations: solution.rotations,
          mirrored: solution.mirrored
        };
      }
      return tb;
    }));

    // Deduct hint point
    if (!profile.isSubscribed) {
      setProfile(prev => ({ ...prev, hintsRemaining: Math.max(0, prev.hintsRemaining - 1) }));
    }
  };

  // --- Copy Social Share Text ---
  const handleCopyShare = () => {
    const text = `🧩 Block Fit Solved! Level ${activeLevel.id} (${activeLevel.gridWidth}x${activeLevel.gridHeight} Grid) solved in ${timerSeconds} seconds using ${moveCount} moves! 🏆 Can you beat my geometry? Play here: ${appUrl}`;
    navigator.clipboard.writeText(text);
    setShareCopied(true);
    sound.playWin();
    setTimeout(() => setShareCopied(false), 2000);
  };

  // --- Unlock Premium Mode Simulation ---
  const handleUnlockPlus = () => {
    setProfile(prev => ({ ...prev, isSubscribed: true, hintsRemaining: 99 }));
    setCurrentScreen('main_menu');
    sound.playWin();
  };

  // Themes list
  const THEME_CLASSES = {
    light: 'light bg-[#fdf8f8] text-gray-900',
    dark: 'dark bg-[#0F172A] text-gray-100',
    neon: 'neon bg-[#07051a] text-[#00ffcc]',
    sunset: 'sunset bg-[#241315] text-[#fca311]',
    retro: 'retro bg-[#0a1005] text-[#39ff14]'
  };

  // Get dynamic board container wrapper class
  const getBoardClass = () => {
    switch (profile.theme) {
      case 'dark':
        return 'bg-[#18181b]/90 p-3 rounded-[28px] grid w-full max-w-[360px] aspect-square shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)] gap-1 border border-[#27272a]';
      case 'neon':
        return 'bg-[#0f0b29]/95 p-3 rounded-[28px] grid w-full max-w-[360px] aspect-square shadow-[inset_0_4px_12px_rgba(0,0,0,0.8),0_0_20px_rgba(255,0,127,0.15)] gap-1 border border-[#ff007f]/30';
      case 'sunset':
        return 'bg-[#1c0c0e]/95 p-3 rounded-[28px] grid w-full max-w-[360px] aspect-square shadow-[inset_0_4px_12px_rgba(0,0,0,0.8)] gap-1 border border-[#fca311]/30';
      case 'retro':
        return 'bg-[#040602]/95 p-3 rounded-[28px] grid w-full max-w-[360px] aspect-square shadow-[inset_0_4px_12px_rgba(0,0,0,0.8)] gap-1 border border-[#39ff14]/30';
      default:
        return 'bg-[#EBE7E2] p-3 rounded-[28px] grid w-full max-w-[360px] aspect-square shadow-[inset_0_2px_8px_rgba(0,0,0,0.06),0_10px_30px_rgba(0,0,0,0.04)] gap-1 border border-[#DFDAD4]';
    }
  };

  // Get dynamic cell backgrounds for board
  const getCellBgClass = (state: 'empty' | 'blocked' | 'filled', color?: string) => {
    if (state === 'filled') return color || 'bg-sage';
    
    if (state === 'blocked') {
      switch (profile.theme) {
        case 'dark': return 'bg-[#141416]/80 border border-gray-900/40 opacity-40 shadow-inner';
        case 'neon': return 'bg-[#07051a]/80 border border-[#ff007f]/5 opacity-30';
        case 'sunset': return 'bg-[#1c0c0e]/80 border border-[#fca311]/5 opacity-30';
        case 'retro': return 'bg-[#040602]/80 border border-[#39ff14]/5 opacity-30';
        default: return 'bg-[#E5E0DA]/80 border border-[#D5D0CA]/40 shadow-inner';
      }
    }
    
    // Empty state
    switch (profile.theme) {
      case 'dark': return 'bg-[#202023] border border-gray-800/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]';
      case 'neon': return 'bg-[#150f38] border border-[#ff007f]/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]';
      case 'sunset': return 'bg-[#3a1d21] border border-[#fca311]/15 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]';
      case 'retro': return 'bg-[#14200c] border border-[#39ff14]/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]';
      default: return 'bg-[#F5F2EF] border border-[#EBE7E2] shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]';
    }
  };

  // Get dynamic pattern overlays for colorblind mode
  const getBlockPatternStyle = (color?: string) => {
    if (!profile.colorblindMode || !color) return undefined;
    const lower = color.toLowerCase();
    
    // 1. Sage / Greenish (Stripes)
    if (lower.includes('sage') || lower.includes('#a8cfbd')) {
      return {
        backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.15), rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.55) 4px, rgba(255,255,255,0.55) 8px)`
      };
    }
    // 2. Coral / Red (Dots)
    if (lower.includes('coral') || lower.includes('#e49a8e')) {
      return {
        backgroundImage: `radial-gradient(rgba(255,255,255,0.7) 20%, transparent 25%)`,
        backgroundSize: '8px 8px'
      };
    }
    // 3. Mustard / Yellow (Cross-Hatch)
    if (lower.includes('mustard') || lower.includes('#e6c88e')) {
      return {
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(255,255,255,0.5) 4px, rgba(255,255,255,0.5) 5px), repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.5) 4px, rgba(255,255,255,0.5) 5px)`
      };
    }
    // 4. Teal / Cyan-Blue (Reverse Stripes)
    if (lower.includes('teal') || lower.includes('#8ec9c4')) {
      return {
        backgroundImage: `repeating-linear-gradient(-45deg, rgba(255,255,255,0.15), rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.55) 4px, rgba(255,255,255,0.55) 8px)`
      };
    }
    // 5. Lavender / Purple-Gray (Vertical Stripes)
    if (lower.includes('lavender') || lower.includes('#c9c6c2')) {
      return {
        backgroundImage: `repeating-linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.5) 4px, rgba(255,255,255,0.5) 8px)`
      };
    }

    // Fallback based on text hash
    let hash = 0;
    for (let i = 0; i < lower.length; i++) {
      hash = lower.charCodeAt(i) + ((hash << 5) - hash);
    }
    const patternIndex = Math.abs(hash) % 5;
    switch (patternIndex) {
      case 0:
        return { backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.15), rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.55) 4px, rgba(255,255,255,0.55) 8px)` };
      case 1:
        return { backgroundImage: `radial-gradient(rgba(255,255,255,0.7) 20%, transparent 25%)`, backgroundSize: '8px 8px' };
      case 2:
        return { backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(255,255,255,0.5) 4px, rgba(255,255,255,0.5) 5px), repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.5) 4px, rgba(255,255,255,0.5) 5px)` };
      case 3:
        return { backgroundImage: `repeating-linear-gradient(-45deg, rgba(255,255,255,0.15), rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.55) 4px, rgba(255,255,255,0.55) 8px)` };
      default:
        return { backgroundImage: `repeating-linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.5) 4px, rgba(255,255,255,0.5) 8px)` };
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${THEME_CLASSES[profile.theme]}`}>
      <AnimatePresence mode="wait">
        
        {/* 1. SPLASH SCREEN */}
        {currentScreen === 'splash' && (
          <motion.div
            key="splash"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex-1 flex flex-col items-center justify-between py-16 px-6 relative overflow-hidden"
          >
          <div className="h-12" />
          
          <div className="flex flex-col items-center text-center">
            {/* Tactics tactile logo */}
            <motion.div 
              initial={{ scale: 0.8, rotate: -15, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 10 }}
              className="w-32 h-32 rounded-3xl overflow-hidden shadow-2xl mb-8 bg-white p-4 flex items-center justify-center border border-gray-200"
            >
              <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full h-full">
                <div className="bg-[#a8cfbd] rounded-lg shadow-sm" />
                <div className="bg-[#e49a8e] rounded-lg shadow-sm" />
                <div className="bg-[#e6c88e] rounded-lg shadow-sm" />
                <div className="bg-[#8ec9c4] rounded-lg shadow-sm" />
              </div>
            </motion.div>

            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-display text-4xl font-extrabold tracking-tight mb-2 text-primary dark:text-white"
            >
              Block Fit
            </motion.h1>

            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 0.8 }}
              transition={{ delay: 0.3 }}
              className="font-body-lg text-sm italic tracking-widest uppercase text-[#426657]"
            >
              Think. Fit. Win.
            </motion.p>
          </div>

          <div className="w-full max-w-xs flex flex-col items-center">
            <div className="w-full mb-8">
              <div className="flex justify-between items-end mb-2 text-xs">
                <span className="opacity-70 font-semibold tracking-wider uppercase">Initialising...</span>
                <span className="font-bold text-sm">{splashProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-[#426657] rounded-full"
                  animate={{ width: `${splashProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>

            {/* Rotating Tips Badge */}
            <motion.div 
              key={splashTip}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-full shadow-md"
            >
              <Lightbulb className="w-4 h-4 text-[#e6c88e] animate-pulse" />
              <span className="text-xs font-medium italic opacity-80">{splashTip}</span>
            </motion.div>
          </div>
          <div className="absolute bottom-4 right-4 text-[10px] opacity-40 font-mono">v1.0.0</div>
        </motion.div>
      )}

      {/* 1.5. USER AUTHENTICATION SCREEN */}
      {currentScreen === 'auth' && (
        <motion.div
          key="auth"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden"
        >
          {/* Backdrop/Accent */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#426657]/10 to-transparent -z-10" />

          <div className="w-full max-w-sm bg-white dark:bg-gray-950 rounded-3xl p-6 border border-gray-150/10 dark:border-gray-900 shadow-2xl relative">
            
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#426657]/10 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-3 border border-[#426657]/20">
                <Key className="w-6 h-6 text-[#426657] dark:text-emerald-400" />
              </div>
              <h2 className="font-display text-2xl font-extrabold text-primary dark:text-white">
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-xs opacity-70 mt-1">
                {authMode === 'login' ? 'Sign in to sync your puzzle progress' : 'Get a personal cloud account to save your progress'}
              </p>
            </div>

            {/* Error Message */}
            {authErrorMessage && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-2xl p-3 mb-4 font-medium">
                ⚠️ {authErrorMessage}
              </div>
            )}

            {/* Toggle Tabs */}
            <div className="flex bg-gray-100/70 dark:bg-gray-900/50 p-1 rounded-2xl border border-gray-200/50 dark:border-gray-800/40 mb-5">
              <button
                type="button"
                onClick={() => { sound.playClick(); setAuthMode('login'); setAuthErrorMessage(''); }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
                  authMode === 'login'
                    ? 'bg-[#426657] text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { sound.playClick(); setAuthMode('signup'); setAuthErrorMessage(''); }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
                  authMode === 'signup'
                    ? 'bg-[#426657] text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Register
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Username</label>
                  <input
                    type="text"
                    required
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    placeholder="e.g. PuzzleGuru"
                    className="w-full mt-1.5 bg-gray-100 dark:bg-gray-900 border border-transparent focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-primary dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full mt-1.5 bg-gray-100 dark:bg-gray-900 border border-transparent focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-primary dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full mt-1.5 bg-gray-100 dark:bg-gray-900 border border-transparent focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-primary dark:text-white"
                />
              </div>

              {/* Terms and Conditions Checkbox (Sign Up Mode Only) */}
              {authMode === 'signup' && (
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 text-xs opacity-85 cursor-pointer select-none leading-tight">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 accent-[#426657]"
                    />
                    <span>
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => { sound.playClick(); setShowTermsModal(true); }}
                        className="text-[#426657] dark:text-emerald-400 font-extrabold underline hover:text-[#355246]"
                      >
                        Privacy Policy & Terms
                      </button>
                    </span>
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={authLoading || (authMode === 'signup' && !termsAccepted)}
                className="w-full py-3.5 bg-[#426657] hover:bg-[#355246] disabled:opacity-50 text-white rounded-2xl font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200/50 dark:border-gray-800" />
              </div>
              <span className="relative px-3 bg-white dark:bg-gray-900 text-[10px] font-bold uppercase tracking-wider opacity-45">
                Or
              </span>
            </div>

            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              className="w-full py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-2xl font-bold text-xs text-primary dark:text-white flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.48 0-6.3-2.82-6.3-6.3s2.82-6.3 6.3-6.3c1.558 0 2.978.569 4.08 1.505l2.972-2.972C18.98 2.502 15.792 1.5 12.24 1.5 6.363 1.5 1.5 6.363 1.5 12.24s4.863 10.74 10.74 10.74c6.111 0 11.232-4.402 11.232-10.74 0-.693-.075-1.349-.195-1.955H12.24Z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Play as Guest Option */}
            <div className="text-center mt-5">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setProfile(prev => ({ ...prev, restrictedMode: true }));
                  setCurrentScreen('main_menu');
                }}
                className="text-xs font-bold opacity-60 hover:opacity-100 transition-opacity hover:underline"
              >
                Play as Guest (Restricted Progress)
              </button>
            </div>

          </div>
        </motion.div>
      )}

      {/* 2. MAIN MENU SCREEN */}
      {currentScreen === 'main_menu' && (
        <motion.div
          key="main_menu"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="flex-grow flex flex-col relative overflow-hidden"
        >
          {/* Top Header */}
          {mainMenuSubView === 'archive' ? (
            <header className="flex justify-between items-center w-full px-6 h-16 bg-white/40 dark:bg-black/20 backdrop-blur-md z-20 shadow-sm border-b border-gray-100/10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { sound.playClick(); setMainMenuSubView('main'); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors text-xs font-bold border border-gray-200/50 dark:border-gray-800/50 bg-white/20 dark:bg-black/20"
                  title="Back to Map"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                  <span>Main Map</span>
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Archive</span>
              </div>
            </header>
          ) : (
            <header className="flex justify-between items-center w-full px-6 h-16 bg-white/40 dark:bg-black/20 backdrop-blur-md z-20 shadow-sm border-b border-gray-100/10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { sound.playClick(); setIsSettingsOpen(true); }}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
                  title="Settings"
                >
                  <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
                <button 
                  onClick={() => {
                    const nextMute = !profile.soundEnabled;
                    setProfile(prev => ({ ...prev, soundEnabled: nextMute, musicEnabled: nextMute }));
                    sound.playClick();
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
                  title="Toggle Mute"
                >
                  {profile.soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-red-500" />
                  )}
                </button>
                <button 
                  onClick={() => { sound.playClick(); setIsHowToPlayOpen(true); }}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors text-sm font-extrabold text-gray-700 dark:text-gray-300"
                  title="How to Play"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider opacity-90">{profile.username}</span>
              </div>
            </header>
          )}

          {/* Interactive Scrollable Area */}
          {mainMenuSubView === 'archive' ? (
            <main className="flex-grow overflow-y-auto px-6 pt-6 pb-24 scroll-smooth">
              <section className="text-center py-4 mb-4 relative flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-sm mb-3">
                  <Archive className="w-8 h-8" />
                </div>
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  Completed Daily Fits
                </h2>
                <p className="text-xs opacity-70 mt-1 max-w-xs">
                  Revisit and replay your completed daily challenges to improve your score or enjoy past layouts.
                </p>
              </section>

              {/* Completed daily challenges list */}
              <div className="space-y-4 max-w-sm mx-auto">
                {(() => {
                  const dailyKeys = Object.keys(profile.levelProgress)
                    .filter(k => k.startsWith('daily_') && profile.levelProgress[k]?.completed)
                    .sort((a, b) => b.localeCompare(a)); // Newest first

                  if (dailyKeys.length === 0) {
                    return (
                      <div className="text-center py-12 bg-white/20 dark:bg-black/10 border border-gray-200/20 dark:border-gray-800/20 rounded-3xl p-6">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-60" />
                        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">No Archive Entries</h4>
                        <p className="text-xs opacity-60 mt-1 max-w-xs mx-auto">
                          Solve today's Daily Fit Challenge to start building your personal archive!
                        </p>
                        <button
                          onClick={() => {
                            sound.playClick();
                            setMainMenuSubView('main');
                          }}
                          className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow"
                        >
                          View Daily Challenge
                        </button>
                      </div>
                    );
                  }

                  return dailyKeys.map(key => {
                    const stats = profile.levelProgress[key];
                    const dateStr = key.replace('daily_', '');
                    
                    // Format nice header date
                    const formattedDate = formatDailyKey(key);
                    
                    // Completion date (fallback to challenge date if completedAt doesn't exist)
                    const compDate = stats.completedAt || formattedDate;

                    return (
                      <div 
                        key={key}
                        className="bg-white/45 dark:bg-gray-900/45 border border-gray-200/50 dark:border-gray-800/50 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex flex-col items-center justify-center text-indigo-500 border border-indigo-500/20">
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                                {formattedDate}
                              </h4>
                              <p className="text-[10px] opacity-65 flex items-center gap-1 mt-0.5">
                                Completed: <span className="font-semibold text-gray-800 dark:text-gray-200">{compDate}</span>
                              </p>
                            </div>
                          </div>
                          
                          {/* Stars */}
                          <div className="flex items-center gap-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-lg text-xs font-extrabold">
                            <span className="text-amber-500">★</span>
                            <span>{stats.stars || 1}</span>
                          </div>
                        </div>

                        {/* Best Scores */}
                        <div className="grid grid-cols-2 gap-3 mb-3 bg-gray-500/5 dark:bg-white/5 rounded-2xl p-2.5 text-center">
                          <div>
                            <span className="block text-[9px] uppercase tracking-widest opacity-65">Best Moves</span>
                            <span className="text-xs font-mono font-bold text-gray-900 dark:text-white">{stats.moves} moves</span>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase tracking-widest opacity-65">Best Time</span>
                            <span className="text-xs font-mono font-bold text-gray-900 dark:text-white">{stats.time}s</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              sound.playClick();
                              startDailyChallenge(dateStr);
                            }}
                            className="flex-grow bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Replay Challenge</span>
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </main>
          ) : (
            <main className="flex-grow overflow-y-auto px-6 pt-6 pb-24 scroll-smooth">
              
              {/* Animated Brand Logo Container */}
              <section className="text-center py-6 mb-4 relative flex flex-col items-center">
                <motion.div 
                  animate={{ 
                    scale: [0.98, 1.02, 0.98],
                    rotate: [0, 1, 0, -1, 0]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 4,
                    ease: "easeInOut"
                  }}
                  className="w-24 h-24 rounded-3xl overflow-hidden shadow-xl mb-4 bg-white dark:bg-gray-900 p-3 flex items-center justify-center border border-gray-150 dark:border-gray-800"
                >
                  <div className="grid grid-cols-2 grid-rows-2 gap-1.5 w-full h-full">
                    <div className="bg-[#a8cfbd] rounded-lg shadow-inner" />
                    <div className="bg-[#e49a8e] rounded-lg shadow-inner" />
                    <div className="bg-[#e6c88e] rounded-lg shadow-inner" />
                    <div className="bg-[#8ec9c4] rounded-lg shadow-inner" />
                  </div>
                </motion.div>
                
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  Block Fit Puzzle
                </h2>
                <p className="text-xs italic tracking-widest uppercase text-[#426657] dark:text-emerald-400 font-semibold mt-1">
                  Think. Fit. Win.
                </p>

                {/* Bouncy Streak Badge */}
                <motion.div 
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="inline-flex items-center gap-1.5 mt-4 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold shadow-sm"
                >
                  <Flame className="w-3.5 h-3.5 fill-current animate-bounce" />
                  <span>🔥 {computedStreak} Day Streak Active!</span>
                </motion.div>
              </section>

              {/* Primary CTA Play Button Card */}
              <section className="mb-6 max-w-sm mx-auto">
                <button 
                  onClick={() => {
                    sound.playClick();
                    const lvl = PRESET_LEVELS.find(l => l.id === profile.currentLevel) || PRESET_LEVELS[0];
                    startLevel(lvl);
                  }}
                  className="w-full text-left bg-gradient-to-r from-[#426657] to-[#5a8674] dark:from-emerald-900 dark:to-teal-950 text-white p-5 rounded-3xl shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden flex items-center justify-between group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -z-10 group-hover:scale-125 transition-transform" />
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                      <Play className="w-6 h-6 fill-current text-white animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold uppercase tracking-wide">
                        {playButtonState === 'StartJourney' && "▶ PLAY"}
                        {playButtonState === 'Continue' && "▶ CONTINUE"}
                        {playButtonState === 'DailyAvailable' && "▶ DAILY READY"}
                        {playButtonState === 'AllComplete' && "▶ PLAY RANDOM"}
                      </h3>
                      <p className="text-xs text-white/80 font-medium mt-0.5">
                        {playButtonState === 'StartJourney' && "Start your geometric journey"}
                        {playButtonState === 'Continue' && `Resume Level ${profile.currentLevel}`}
                        {playButtonState === 'DailyAvailable' && "Special daily level is available"}
                        {playButtonState === 'AllComplete' && "Conquered all! Replay standard levels"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-white/50 group-hover:text-white transition-colors" />
                </button>
              </section>

              {/* Difficulty Selection Card */}
              <section className="mb-6 max-w-sm mx-auto">
                <div className="bg-white/40 dark:bg-gray-900/40 border border-gray-200/50 dark:border-gray-800/50 rounded-3xl p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        Standard Difficulty
                      </h4>
                      <p className="text-[11px] opacity-75 mt-0.5">Adjust complexity for standard levels</p>
                    </div>
                  </div>

                  {/* Difficulty Buttons */}
                  <div className="grid grid-cols-3 gap-2 p-1 bg-gray-150/50 dark:bg-gray-800/80 rounded-2xl">
                    {(['Easy', 'Medium', 'Hard'] as const).map((diff) => {
                      const isActive = (profile.difficultySetting || 'Medium') === diff;
                      let activeStyle = '';
                      if (diff === 'Easy') {
                        activeStyle = 'bg-emerald-600 dark:bg-emerald-700 text-white shadow-sm';
                      } else if (diff === 'Medium') {
                        activeStyle = 'bg-amber-500 dark:bg-amber-600 text-white shadow-sm';
                      } else {
                        activeStyle = 'bg-rose-500 dark:bg-rose-600 text-white shadow-sm';
                      }

                      return (
                        <button
                          key={diff}
                          onClick={() => {
                            sound.playClick();
                            setProfile((prev) => ({ ...prev, difficultySetting: diff }));
                          }}
                          className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                            isActive
                              ? activeStyle
                              : 'text-gray-600 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-800/40'
                          }`}
                        >
                          {diff}
                        </button>
                      );
                    })}
                  </div>

                  {/* Difficulty Explanations */}
                  <div className="mt-3 px-1">
                    <p className="text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
                      {(profile.difficultySetting || 'Medium') === 'Easy' && (
                        <span>
                          💚 <strong>Easy Mode:</strong> Simplifies layouts by removing blocks and pre-filling those spots as starting obstacles.
                        </span>
                      )}
                      {(profile.difficultySetting || 'Medium') === 'Medium' && (
                        <span>
                          💛 <strong>Medium Mode:</strong> Standard level designs, par targets, and full block configurations.
                        </span>
                      )}
                      {(profile.difficultySetting || 'Medium') === 'Hard' && (
                        <span>
                          ❤️ <strong>Hard Mode:</strong> Increases layout complexity by splitting largest blocks into smaller pieces.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </section>

              {/* Daily Challenge Bento Card */}
              <section className="mb-6 max-w-sm mx-auto">
                <div className="bg-white/40 dark:bg-gray-900/40 border border-gray-200/50 dark:border-gray-800/50 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-sm">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        Daily Fit Challenge
                      </h4>
                      <p className="text-[11px] opacity-75 mt-0.5">Fresh procedural layouts every 24h</p>
                    </div>
                  </div>

                  {profile.levelProgress[`daily_${dailyDate}`]?.completed ? (
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-[10px] font-bold shadow-sm">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Solved</span>
                    </div>
                  ) : (
                    <button
                      onClick={startDailyChallenge}
                      disabled={isFetchingDaily}
                      className="bg-gray-900 dark:bg-amber-500 hover:bg-gray-800 dark:hover:bg-amber-600 text-white dark:text-gray-950 font-bold text-xs px-4 py-2 rounded-xl transition-all shadow hover:scale-105 active:scale-95 flex items-center gap-1"
                    >
                      {isFetchingDaily ? (
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>PLAY</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </section>

              {/* Speedrun Challenge Bento Card */}
              <section className="mb-6 max-w-sm mx-auto">
                <button
                  onClick={() => {
                    sound.playClick();
                    setIsSpeedrunPreToggled(true);
                    setCurrentScreen('level_select');
                  }}
                  className="w-full text-left bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent dark:from-amber-950/10 dark:via-orange-950/5 dark:to-transparent border border-amber-500/20 dark:border-amber-500/10 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex justify-between items-center group hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl -z-10 group-hover:scale-110 transition-transform" />
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center border border-amber-500 shadow-md group-hover:animate-pulse">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                        Speedrun Challenge ⚡
                      </h4>
                      <p className="text-[11px] opacity-75 mt-0.5 text-orange-600 dark:text-orange-400 font-medium">Race against the countdown!</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-bold">
                    <span>GO</span>
                    <ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </section>

              {/* Puzzle Archive Card */}
              <section className="mb-6 max-w-sm mx-auto">
                <button
                  onClick={() => {
                    sound.playClick();
                    setMainMenuSubView('archive');
                  }}
                  className="w-full text-left bg-white/40 dark:bg-gray-900/40 border border-gray-200/50 dark:border-gray-800/50 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex justify-between items-center group hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-sm">
                      <Archive className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        Puzzle Archive
                      </h4>
                      <p className="text-[11px] opacity-75 mt-0.5">Revisit &amp; replay solved daily fits</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs opacity-60">
                    <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full">
                      {Object.keys(profile.levelProgress).filter(k => k.startsWith('daily_') && profile.levelProgress[k]?.completed).length} Solved
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </button>
              </section>

              {/* Daily Streak History Card (Recharts) */}
              <section className="mb-6 max-w-sm mx-auto">
                <div className="bg-white/40 dark:bg-gray-900/40 border border-gray-200/50 dark:border-gray-800/50 rounded-3xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-amber-500 fill-current" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">Streak History</span>
                        <span className="text-[10px] opacity-65">Daily challenge history</span>
                      </div>
                    </div>
                    
                    {/* Metric Selector Tabs */}
                    <div className="flex bg-gray-150 dark:bg-gray-800/80 rounded-xl p-0.5 text-[10px] font-bold">
                      <button
                        onClick={() => { sound.playClick(); setChartMetric('stars'); }}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${chartMetric === 'stars' ? 'bg-white dark:bg-gray-900 shadow-xs text-amber-500' : 'opacity-65 text-gray-700 dark:text-gray-300'}`}
                      >
                        Stars
                      </button>
                      <button
                        onClick={() => { sound.playClick(); setChartMetric('moves'); }}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${chartMetric === 'moves' ? 'bg-white dark:bg-gray-900 shadow-xs text-indigo-500' : 'opacity-65 text-gray-700 dark:text-gray-300'}`}
                      >
                        Moves
                      </button>
                    </div>
                  </div>

                  {/* Chart Container */}
                  <div className="h-44 w-full -ml-4 pr-1">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartMetric === 'stars' ? (
                        <BarChart data={streakHistoryData} margin={{ top: 10, right: 5, left: 0, bottom: 5 }}>
                          <defs>
                            <linearGradient id="starsColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
                          <XAxis 
                            dataKey="label" 
                            tickLine={false} 
                            axisLine={false}
                            tick={{ fontSize: 9, fontWeight: 600 }}
                            stroke="currentColor"
                            className="text-gray-500 dark:text-gray-400"
                          />
                          <YAxis 
                            domain={[0, 3]} 
                            tickCount={4}
                            tickLine={false} 
                            axisLine={false}
                            tick={{ fontSize: 9, fontWeight: 600 }}
                            stroke="currentColor"
                            className="text-gray-500 dark:text-gray-400"
                          />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-xl p-2.5 shadow-xl text-[11px] font-sans">
                                    <p className="font-bold text-gray-900 dark:text-white mb-1">{data.label}</p>
                                    {data.completed ? (
                                      <p className="text-amber-500 font-extrabold flex items-center gap-0.5">
                                        ★ {data.stars} {data.stars === 1 ? 'Star' : 'Stars'}
                                      </p>
                                    ) : (
                                      <p className="text-gray-400 dark:text-gray-500 font-semibold italic">Not played yet</p>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar 
                            dataKey="stars" 
                            fill="url(#starsColor)" 
                            radius={[6, 6, 0, 0]} 
                            maxBarSize={28}
                          />
                        </BarChart>
                      ) : (
                        <AreaChart data={streakHistoryData} margin={{ top: 10, right: 5, left: 0, bottom: 5 }}>
                          <defs>
                            <linearGradient id="movesColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
                          <XAxis 
                            dataKey="label" 
                            tickLine={false} 
                            axisLine={false}
                            tick={{ fontSize: 9, fontWeight: 600 }}
                            stroke="currentColor"
                            className="text-gray-500 dark:text-gray-400"
                          />
                          <YAxis 
                            tickLine={false} 
                            axisLine={false}
                            tick={{ fontSize: 9, fontWeight: 600 }}
                            stroke="currentColor"
                            className="text-gray-500 dark:text-gray-400"
                          />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-xl p-2.5 shadow-xl text-[11px] font-sans">
                                    <p className="font-bold text-gray-900 dark:text-white mb-1">{data.label}</p>
                                    {data.completed ? (
                                      <div className="space-y-0.5 font-semibold text-gray-700 dark:text-gray-300">
                                        <p className="text-indigo-500 font-extrabold">{data.moves} moves used</p>
                                        <p className="text-[10px] opacity-75">{data.time}s solving time</p>
                                      </div>
                                    ) : (
                                      <p className="text-gray-400 dark:text-gray-500 font-semibold italic">Not played yet</p>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="moves" 
                            stroke="#6366f1" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#movesColor)" 
                          />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>

                  {/* Footer summary stats inside card */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800/60 text-center">
                    <div>
                      <span className="block text-[8px] uppercase tracking-widest opacity-60">Active Streak</span>
                      <span className="text-sm font-extrabold text-amber-500 font-mono">{computedStreak} Days</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase tracking-widest opacity-60">Avg. Stars</span>
                      <span className="text-sm font-extrabold text-gray-800 dark:text-gray-200 font-mono">
                        {(() => {
                          const completed = streakHistoryData.filter(d => d.completed);
                          if (completed.length === 0) return '0.0';
                          const sum = completed.reduce((acc, curr) => acc + curr.stars, 0);
                          return (sum / completed.length).toFixed(1);
                        })()} ★
                      </span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase tracking-widest opacity-60">Best Solved</span>
                      <span className="text-sm font-extrabold text-emerald-500 font-mono">
                        {(() => {
                          const completed = streakHistoryData.filter(d => d.completed);
                          if (completed.length === 0) return '0';
                          const minMoves = Math.min(...completed.map(d => d.moves));
                          return `${minMoves}m`;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Quick Level Selector Dot Bar */}
              <section className="mb-6 max-w-sm mx-auto p-4 bg-white/20 dark:bg-black/10 border border-gray-200/20 dark:border-gray-800/20 rounded-3xl text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-3 text-gray-700 dark:text-gray-300">
                  Quick Level Selector
                </p>
                <div className="flex justify-center items-center gap-3">
                  {[...Array(5)].map((_, i) => {
                    const targetLevelId = Math.max(1, Math.min(PRESET_LEVELS.length - 4, profile.currentLevel - 2)) + i;
                    const targetLvl = PRESET_LEVELS.find(l => l.id === targetLevelId) || PRESET_LEVELS[0];
                    const progress = profile.levelProgress[targetLevelId];
                    const isCompleted = progress?.completed;
                    const isCurrent = targetLevelId === profile.currentLevel;
                    const isLocked = targetLevelId > profile.currentLevel;

                    return (
                      <button
                        key={targetLevelId}
                        disabled={isLocked}
                        onClick={() => {
                          sound.playClick();
                          startLevel(targetLvl);
                        }}
                        className={`w-9 h-9 rounded-full flex flex-col items-center justify-center text-xs font-mono font-bold transition-all border ${
                          isCurrent 
                            ? 'bg-amber-500 text-white border-amber-500 ring-4 ring-amber-500/20 scale-110 shadow-md'
                            : isCompleted
                            ? 'bg-[#426657] text-white border-[#426657] hover:scale-105'
                            : isLocked
                            ? 'bg-gray-200 dark:bg-gray-800 border-transparent text-gray-400 dark:text-gray-600 cursor-not-allowed'
                            : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:scale-105'
                        }`}
                      >
                        {isLocked ? (
                          <Lock className="w-3 h-3 opacity-50" />
                        ) : (
                          <span>{targetLevelId}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Star Progress indicators block to unlock themes */}
              <section className="mb-6 max-w-sm mx-auto px-1">
                <div className="bg-white/40 dark:bg-gray-900/40 border border-gray-200/50 dark:border-gray-800/50 rounded-3xl p-5 shadow-sm text-center">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Theme Unlock Progress</span>
                    <span className="text-xs font-mono font-extrabold text-[#426657] dark:text-amber-500 flex items-center gap-0.5">
                      ★ {totalStarsEarned} / 150
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mb-1">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (totalStarsEarned / 150) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] opacity-65">
                    Reach 150 stars to unlock all custom color skins &amp; themes!
                  </p>
                </div>
              </section>

              {/* Themes Button CTA */}
              <section className="mb-6 max-w-sm mx-auto">
                <button 
                  onClick={() => { sound.playClick(); setIsSettingsOpen(true); }}
                  className="w-full flex items-center justify-between p-4 bg-white/40 dark:bg-gray-900/40 border border-gray-200/50 dark:border-gray-800/50 rounded-3xl hover:bg-white/60 dark:hover:bg-gray-900/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-bold text-gray-800 dark:text-white">Custom Themes &amp; Skins</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs opacity-60">
                    <span>Change styling</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              </section>

              {/* Block Fit Plus Premium Banner */}
              {!profile.isSubscribed && (
                <section className="max-w-sm mx-auto">
                  <div 
                    onClick={() => { sound.playClick(); setCurrentScreen('subscription'); }}
                    className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white p-5 rounded-3xl flex items-center justify-between shadow-xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center text-white font-bold shadow-md">
                        <Crown className="w-5 h-5 text-yellow-100" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-yellow-100">Block Fit Plus</h4>
                        <p className="text-[10px] text-white/90 font-medium mt-0.5">Unlimited hints &amp; infinite levels for $2.99/mo</p>
                      </div>
                    </div>
                    <span className="bg-white text-amber-600 font-extrabold text-[11px] px-3.5 py-1.5 rounded-xl shadow-sm transition-colors hover:bg-gray-50">
                      Get Plus
                    </span>
                  </div>
                </section>
              )}

            </main>
          )}

          {/* Bottom Navigation Bars */}
          <nav className="fixed bottom-0 w-full z-40 flex justify-around items-center px-4 py-3 pb-safe bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-900 shadow-2xl rounded-t-3xl">
            <button 
              onClick={() => { sound.playClick(); setCurrentScreen('level_select'); }}
              className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 hover:text-primary active:scale-95 transition-all"
            >
              <Palette className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400" />
              <span className="text-[10px] font-bold">Level Select</span>
            </button>
            <button 
              onClick={() => sound.playClick()}
              className="flex flex-col items-center justify-center text-[#426657] dark:text-amber-500 font-extrabold active:scale-95 transition-all bg-emerald-500/10 dark:bg-amber-500/10 px-6 py-2 rounded-2xl"
            >
              <Menu className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold">Main Map</span>
            </button>
            <button 
              onClick={() => { sound.playClick(); setCurrentScreen('leaderboard'); }}
              className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 hover:text-primary active:scale-95 transition-all"
            >
              <Award className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400" />
              <span className="text-[10px] font-bold">Leaderboards</span>
            </button>
          </nav>
        </motion.div>
      )}

      {/* 3. LEVEL SELECT SCREEN */}
      {currentScreen === 'level_select' && (() => {
        // Declaring internal variables for world navigation
        const WORLDS_CONFIG = [
          { id: 1, name: 'Beginner', range: [1, 10], theme: 'Warm Neutrals', minLevelToUnlock: 1 },
          { id: 2, name: 'Intermediate', range: [11, 20], theme: 'Soft Pastels', minLevelToUnlock: 11 },
          { id: 3, name: 'Advanced', range: [21, 30], theme: 'Deep Jewel', minLevelToUnlock: 21 },
          { id: 4, name: 'Expert', range: [31, 40], theme: 'Dark Elegance', minLevelToUnlock: 31 },
          { id: 5, name: 'Master', range: [41, 50], theme: 'Random Premium', minLevelToUnlock: 41 }
        ];

        const worldStats = WORLDS_CONFIG.map(w => {
          const levels = PRESET_LEVELS.filter(l => l.id >= w.range[0] && l.id <= w.range[1]);
          const completed = levels.filter(l => profile.levelProgress[l.id]?.completed).length;
          const isUnlocked = w.id === 1 || profile.currentLevel >= w.minLevelToUnlock || profile.isSubscribed;
          return {
            ...w,
            levels,
            completed,
            isUnlocked,
            total: levels.length
          };
        });

        const currentWorld = worldStats[Math.max(0, Math.min(4, (selectedWorldId || 1) - 1))];
        const isWorldLocked = currentWorld.id > 1 && profile.currentLevel < currentWorld.minLevelToUnlock && !profile.isSubscribed;
        const worldLevels = currentWorld.levels;
        const completedCount = currentWorld.completed;

        const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
          const container = e.currentTarget;
          const scrollTop = container.scrollTop;
          const scrollHeight = container.scrollHeight;
          const clientHeight = container.clientHeight;
          const maxScroll = scrollHeight - clientHeight;
          if (maxScroll > 0) {
            const ratio = scrollTop / maxScroll;
            setLevelScrollRatio(ratio);
            
            // Calculate active world based on closest world boundary
            const activeIndex = Math.round(ratio * (worldStats.length - 1));
            const activeWorldId = worldStats[activeIndex]?.id || 1;
            if (activeWorldId !== selectedWorldId) {
              setSelectedWorldId(activeWorldId);
            }
          }
        };

        const scrollToWorld = (worldId: number) => {
          if (levelSelectScrollRef.current) {
            const container = levelSelectScrollRef.current;
            const element = container.querySelector(`#world-section-${worldId}`);
            if (element) {
              const containerTop = container.getBoundingClientRect().top;
              const elementTop = element.getBoundingClientRect().top;
              const targetScrollTop = container.scrollTop + elementTop - containerTop;
              
              container.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
              });
            }
          }
        };

        const totalCompleted = PRESET_LEVELS.filter(l => profile.levelProgress[l.id]?.completed).length;
        const totalLevels = PRESET_LEVELS.length;

        return (
          <motion.div
            key="level_select"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex-grow flex flex-col h-screen max-h-screen overflow-hidden"
          >
            {/* Header */}
            <header className="flex justify-between items-center w-full px-6 h-16 bg-white/40 dark:bg-black/20 backdrop-blur-md z-10 border-b border-gray-150/10 flex-shrink-0">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => { sound.playClick(); setCurrentScreen('main_menu'); }}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="font-extrabold text-base">Select Puzzle</h1>
                  <p className="text-[10px] opacity-60">Earn stars &amp; solve boards</p>
                </div>
              </div>

              {/* Progress & Star Count display */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#426657]/10 border border-[#426657]/20 text-[#426657] dark:text-emerald-400 rounded-xl text-xs font-extrabold shadow-sm">
                  <span className="text-[10px]">PROGRESS:</span>
                  <span>{totalCompleted}/{totalLevels}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-extrabold shadow-sm">
                  <span>★</span>
                  <span>{totalStarsEarned}</span>
                </div>
              </div>
            </header>

            {/* Split layout row containing Levels List/Grid on Left & Visual Scroll Sidebar on Right */}
            <div className="flex-grow flex flex-row overflow-hidden relative">
              
              {/* Left Column: Levels List Scroll Container with Carousel & Scroll-Snap Grid */}
              <div className="flex-grow flex flex-col h-full overflow-hidden">
                
                {/* Sticky Horizontal World Navigation Carousel Selector at the top of Left Column */}
                <section className="px-6 py-4 flex flex-col items-center bg-gray-50/50 dark:bg-gray-900/10 border-b border-gray-150/5 flex-shrink-0">
                  <div className="flex items-center justify-between w-full max-w-sm">
                    <button 
                      disabled={selectedWorldId === 1}
                      onClick={() => { 
                        sound.playClick(); 
                        const targetId = Math.max(1, selectedWorldId - 1);
                        setSelectedWorldId(targetId);
                        scrollToWorld(targetId);
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-20 transition-all text-gray-700 dark:text-gray-300"
                    >
                      ◀
                    </button>
                    
                    <div className="text-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#426657] dark:text-emerald-400">
                        World {currentWorld.id}
                      </span>
                      <h2 className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                        {currentWorld.name}
                      </h2>
                      <p className="text-[10px] opacity-60 mt-0.5 text-gray-500 dark:text-gray-400">
                        {currentWorld.theme} Theme ({completedCount}/{worldLevels.length} Complete)
                      </p>
                    </div>

                    <button 
                      disabled={selectedWorldId === 5}
                      onClick={() => { 
                        sound.playClick(); 
                        const targetId = Math.min(5, selectedWorldId + 1);
                        setSelectedWorldId(targetId);
                        scrollToWorld(targetId);
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-20 transition-all text-gray-700 dark:text-gray-300"
                    >
                      ▶
                    </button>
                  </div>

                  {/* Page Indicator Dot indicators */}
                  <div className="flex justify-center gap-1.5 mt-3">
                    {WORLDS_CONFIG.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => {
                          sound.playClick();
                          setSelectedWorldId(w.id);
                          scrollToWorld(w.id);
                        }}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          w.id === selectedWorldId 
                            ? 'w-6 bg-amber-500' 
                            : 'w-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Mode Selector Toggle */}
                  <div className="mt-3.5 flex items-center justify-between w-full max-w-sm bg-gray-100/80 dark:bg-gray-950/50 p-1 rounded-2xl border border-gray-200/50 dark:border-gray-800/40 shadow-inner">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setIsSpeedrunPreToggled(false);
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                        !isSpeedrunPreToggled 
                          ? 'bg-[#426657] text-white shadow-sm' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Campaign Mode</span>
                    </button>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setIsSpeedrunPreToggled(true);
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                        isSpeedrunPreToggled 
                          ? 'bg-amber-500 text-white shadow-sm' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Speedrun Mode ⚡</span>
                    </button>
                  </div>
                </section>

                {/* Scrollable Container (snappable) for levels */}
                <div 
                  ref={levelSelectScrollRef}
                  onScroll={handleScroll}
                  className="flex-grow overflow-y-auto snap-y snap-mandatory scroll-smooth scrollbar-thin pb-24"
                >
                  {worldStats.map((w) => {
                    const isWLocked = w.id > 1 && profile.currentLevel < w.minLevelToUnlock && !profile.isSubscribed;
                    const wLevels = w.levels;

                    return (
                      <section 
                        key={w.id}
                        id={`world-section-${w.id}`}
                        className="w-full h-full min-h-[calc(100vh-12rem)] flex-shrink-0 snap-start flex flex-col justify-start px-6 py-6 border-b border-gray-150/5"
                      >
                        {/* Section Header for clear world identification during scroll */}
                        <div className="flex justify-between items-center mb-4 max-w-sm mx-auto w-full">
                          <h3 className="font-extrabold text-sm text-[#426657] dark:text-emerald-400">
                            {w.name} levels
                          </h3>
                          <span className="text-[10px] font-mono opacity-60">
                            {w.completed}/{w.total} Solved
                          </span>
                        </div>

                        {/* Grid list of levels or locked state */}
                        <div className="flex-grow flex flex-col justify-center">
                          {isWLocked ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center max-w-sm mx-auto">
                              <div className="w-16 h-16 rounded-3xl bg-gray-250 dark:bg-gray-800 flex items-center justify-center text-gray-500 mb-4 shadow-inner border border-gray-300/20">
                                <Lock className="w-6 h-6" />
                              </div>
                              <h4 className="font-extrabold text-base text-gray-900 dark:text-white">Locked</h4>
                              <p className="text-xs opacity-75 mt-1 mb-4 max-w-xs text-gray-500 dark:text-gray-400">
                                Reach Level {w.minLevelToUnlock} in World {w.id - 1} to unlock this world, or purchase Block Fit Plus!
                              </p>
                              <button
                                onClick={() => { sound.playClick(); setCurrentScreen('subscription'); }}
                                className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-black text-xs px-6 py-2.5 rounded-2xl shadow-md transition-all hover:scale-105"
                              >
                                Unlock Instantly
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 xs:grid-cols-4 gap-3.5 max-w-sm mx-auto w-full">
                              {wLevels.map((lvl) => {
                                const progress = profile.levelProgress[lvl.id];
                                const isCompleted = progress?.completed;
                                const isCurrent = lvl.id === profile.currentLevel;
                                const isLocked = lvl.id > profile.currentLevel && !profile.isSubscribed;
                                const speedrunLimitVal = Math.max(15, lvl.parTime || (lvl.availableBlocks.length * 8) + 5);

                                return (
                                  <motion.button
                                    key={lvl.id}
                                    disabled={isLocked}
                                    onClick={() => {
                                      sound.playClick();
                                      setPreviewLevel(lvl);
                                    }}
                                    initial={isCurrent ? { scale: 0.3, opacity: 0 } : { scale: 1, opacity: 1 }}
                                    animate={isCurrent ? { scale: [0.3, 1.22, 0.95, 1.05], opacity: 1 } : { scale: 1, opacity: 1 }}
                                    transition={isCurrent ? { type: "spring", stiffness: 220, damping: 12, delay: 0.1 } : { duration: 0.15 }}
                                    whileHover={!isLocked ? { 
                                      scale: 1.05,
                                      boxShadow: isCurrent 
                                        ? "0 0 16px rgba(245, 158, 11, 0.65)" 
                                        : isSpeedrunPreToggled
                                        ? "0 0 14px rgba(245, 158, 11, 0.4)"
                                        : isCompleted
                                        ? "0 0 14px rgba(212, 175, 55, 0.45)"
                                        : "0 0 12px rgba(156, 163, 175, 0.3)",
                                      zIndex: 10,
                                      transition: { type: "spring", stiffness: 400, damping: 20 }
                                    } : {}}
                                    whileTap={!isLocked ? { 
                                      scale: 0.96,
                                      transition: { type: "spring", stiffness: 500, damping: 15 }
                                    } : {}}
                                    className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-colors duration-200 border shadow-sm ${
                                      isCurrent 
                                        ? 'bg-amber-500 text-white border-amber-500 shadow-md font-extrabold ring-4 ring-amber-500/20'
                                        : isSpeedrunPreToggled
                                        ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:border-amber-500'
                                        : isCompleted
                                        ? 'bg-white dark:bg-gray-900 border-[#D4AF37] text-primary dark:text-white hover:bg-gray-50 dark:hover:bg-gray-850'
                                        : 'bg-gray-100 dark:bg-gray-800 border-transparent text-gray-400 dark:text-gray-600'
                                    }`}
                                  >
                                    {isCurrent && (
                                      <motion.div
                                        className="absolute inset-0 rounded-2xl border-2 border-amber-400 pointer-events-none"
                                        animate={{
                                          scale: [1, 1.25, 1],
                                          opacity: [0.8, 0, 0.8],
                                        }}
                                        transition={{
                                          duration: 1.8,
                                          repeat: Infinity,
                                          ease: "easeInOut",
                                        }}
                                      />
                                    )}
                                    {isCompleted && progress?.time !== undefined && (
                                      <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-md text-[7.5px] font-black font-mono border border-emerald-500/10 leading-none shadow-sm">
                                        ⏱️ {progress.time}s
                                      </div>
                                    )}
                                    {isLocked ? (
                                      <Lock className="w-4 h-4 opacity-40" />
                                    ) : (
                                      <>
                                        <span className="text-base font-bold font-mono leading-none">{lvl.id}</span>
                                        {isSpeedrunPreToggled ? (
                                          <div className="text-[9px] font-bold font-mono opacity-80 mt-1 flex items-center gap-0.5">
                                            <span>⚡</span>
                                            <span>{speedrunLimitVal}s</span>
                                          </div>
                                        ) : (
                                          isCompleted && (
                                            <div className="flex gap-0.5 absolute bottom-1.5">
                                              {[...Array(3)].map((_, i) => (
                                                <span 
                                                  key={i} 
                                                  className={`text-[8px] ${i < progress.stars ? 'text-[#D4AF37]' : 'text-gray-300 dark:text-gray-700'}`}
                                                >
                                                  ★
                                                </span>
                                              ))}
                                            </div>
                                          )
                                        )}
                                      </>
                                    )}
                                  </motion.button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Infinite dynamic Master level hint inside World 5 section */}
                        {w.id === 5 && !isWLocked && (
                          <div className="mt-6 bg-[#426657]/10 dark:bg-emerald-950/20 rounded-3xl p-4 max-w-sm mx-auto border border-emerald-500/10 flex items-start gap-4">
                            <div className="w-10 h-10 bg-[#426657] text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                              <Crown className="w-4 h-4 text-amber-400 animate-pulse" />
                            </div>
                            <div>
                              <h5 className="font-bold text-xs text-[#466a5b] dark:text-emerald-400">Unlock Master World</h5>
                              <p className="text-[10px] text-[#466a5b]/90 dark:text-emerald-400/80 mt-0.5">
                                World 5 contains infinite master levels generated dynamically.
                              </p>
                            </div>
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>

              </div>

              {/* Right Column: Visual Scroll-Indicator Sidebar */}
              <div className="w-16 sm:w-20 flex-shrink-0 bg-white/20 dark:bg-black/15 border-l border-gray-150/10 flex flex-col justify-around py-6 items-center select-none relative z-10">
                {/* Vertical Timeline connection line axis */}
                <div className="absolute top-12 bottom-12 w-[2px] bg-gray-200 dark:bg-gray-800 rounded-full" />
                
                {/* Vertical illuminated active indicator line */}
                <div 
                  className="absolute top-12 w-[2px] bg-amber-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                  style={{
                    height: `calc(${levelScrollRatio} * (100% - 96px))`
                  }}
                />

                {/* Real-time smooth sliding indicator thumb/node */}
                <div 
                  className="absolute w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-white dark:border-gray-900 shadow-[0_0_10px_rgba(245,158,11,0.8)] transition-all duration-300 ease-out z-20 pointer-events-none"
                  style={{
                    top: `calc(48px + ${levelScrollRatio} * (100% - 96px))`,
                    transform: 'translateY(-50%)'
                  }}
                />

                {/* Interactive World Markers */}
                {worldStats.map((w) => {
                  const isSelected = w.id === selectedWorldId;
                  const isUnlocked = w.isUnlocked;

                  return (
                    <div key={w.id} className="relative flex flex-col items-center group z-10">
                      
                      {/* World Abbreviation Name label */}
                      <span className={`text-[9px] font-black uppercase tracking-wider mb-1 transition-all duration-200 ${
                        isSelected 
                          ? 'text-amber-500 scale-110 font-black' 
                          : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-300'
                      }`}>
                        {w.name.substring(0, 3)}
                      </span>

                      {/* Discrete Anchor Button representing the world */}
                      <button
                        onClick={() => {
                          sound.playClick();
                          setSelectedWorldId(w.id);
                          scrollToWorld(w.id);
                        }}
                        title={`Scroll to ${w.name}`}
                        className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all duration-300 relative border ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-500 ring-4 ring-amber-500/25 scale-110 shadow-[0_4px_12px_rgba(245,158,11,0.3)]'
                            : !isUnlocked
                            ? 'bg-gray-150 dark:bg-gray-900 border-transparent text-gray-400 dark:text-gray-600'
                            : w.completed === w.total
                            ? 'bg-emerald-50 text-[#426657] dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-100 hover:scale-105'
                            : 'bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-amber-400 hover:scale-105'
                        }`}
                      >
                        {/* Circle radial SVGs for visual completion arc indicator */}
                        {isUnlocked && !isSelected && w.completed > 0 && w.completed < w.total && (
                          <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <rect
                              x="2"
                              y="2"
                              width="40"
                              height="40"
                              rx="10"
                              className="stroke-emerald-500/20 dark:stroke-emerald-500/10 fill-none"
                              strokeWidth="2"
                            />
                            <rect
                              x="2"
                              y="2"
                              width="40"
                              height="40"
                              rx="10"
                              className="stroke-emerald-500 fill-none transition-all duration-500"
                              strokeWidth="2"
                              strokeDasharray={`${2 * (40 + 40)}`}
                              strokeDashoffset={`${2 * (40 + 40) * (1 - w.completed / w.total)}`}
                            />
                          </svg>
                        )}

                        {/* Node Symbol (Lock, Check, or World ID number / Anchor symbol on hover) */}
                        {!isUnlocked ? (
                          <Lock className="w-3.5 h-3.5 opacity-60 text-gray-500" />
                        ) : w.completed === w.total ? (
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 font-extrabold" />
                        ) : (
                          <span className="font-mono text-xs font-black transition-all group-hover:scale-110">
                            {w.id}
                          </span>
                        )}

                        {/* Action Anchor Quick-Jump Indicator Icon shown on hover */}
                        {isUnlocked && (
                          <div className="absolute opacity-0 group-hover:opacity-100 transition-all duration-200 -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-sm border border-white dark:border-gray-900 scale-75 group-hover:scale-100">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        )}

                        {/* Compact fraction completion floating badge */}
                        {isUnlocked && (
                          <div className={`absolute -bottom-1.5 text-[7px] font-mono font-black px-1 rounded shadow-sm border ${
                            isSelected 
                              ? 'bg-amber-600 text-white border-amber-700' 
                              : 'bg-white/95 dark:bg-gray-900/95 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800'
                          }`}>
                            {w.completed}/{w.total}
                          </div>
                        )}
                      </button>

                      {/* Tooltip on hovering a node */}
                      <div className="absolute right-16 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gray-900 text-white text-[10px] py-1.5 px-3 rounded-xl whitespace-nowrap shadow-xl z-30 flex items-center gap-1.5 border border-gray-800 translate-x-2 group-hover:translate-x-0">
                        <span className="font-extrabold">{w.name} World</span>
                        <span className="opacity-60">|</span>
                        <span className="text-amber-400 font-mono font-bold">{w.completed}/{w.total} Solved</span>
                        {isUnlocked ? (
                          <span className="text-emerald-400 font-bold ml-1 flex items-center gap-0.5">
                            • Click to Jump
                          </span>
                        ) : (
                          <>
                            <span className="opacity-60">|</span>
                            <span className="text-red-400 flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> Locked</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </motion.div>
        );
      })()}

      {/* 4. GAMEPLAY PLAY AREA SCREEN */}
      {currentScreen === 'gameplay' && (
        <motion.div
          key="gameplay"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="flex-grow flex flex-col relative select-none"
        >
          {/* HUD Header & Progress Row */}
          <header className="flex flex-col w-full px-6 py-3.5 bg-white/45 dark:bg-black/20 backdrop-blur-md z-20 border-b border-gray-150/10 shadow-sm">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { sound.playClick(); setCurrentScreen('main_menu'); }}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
                <button 
                  onClick={() => { sound.playClick(); setIsHowToPlayOpen(true); }}
                  className="flex flex-col items-start hover:opacity-85 transition-opacity"
                >
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#426657] dark:text-emerald-400 leading-none">
                    {isDailyChallenge ? `Daily Seed` : `World Level`}
                  </span>
                  <span className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1 mt-0.5">
                    {isDailyChallenge ? `Daily Fit` : `Level ${activeLevel.id}`}
                    <Info className="w-3 h-3 opacity-60" />
                  </span>
                </button>
              </div>

              {/* Par / Time Remaining Timer */}
              {isSpeedrunMode ? (
                <div className="flex items-center gap-1.5 bg-amber-500/10 dark:bg-amber-950/20 px-3 py-1.5 rounded-xl border border-amber-500/30 shadow-inner">
                  <span className="text-xs text-amber-500">⚡</span>
                  <span className={`font-mono text-sm font-black ${
                    speedrunTimeRemaining <= 5 
                      ? 'text-red-500 animate-pulse font-extrabold scale-110' 
                      : 'text-amber-500'
                  }`}>
                    {Math.floor(speedrunTimeRemaining / 60).toString().padStart(2, '0')}:{(speedrunTimeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="text-[8px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    SPEEDRUN
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-black/20 px-3 py-1.5 rounded-xl border border-gray-200/40 dark:border-gray-850/40 shadow-inner">
                  <span className="text-xs opacity-60">⏱</span>
                  <span className={`font-mono text-sm font-extrabold ${
                    timerSeconds > activeLevel.parTime ? 'text-red-500 animate-pulse font-black' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}
                  </span>
                  {timerSeconds > activeLevel.parTime && (
                    <span className="text-[8px] font-mono font-bold text-red-500 uppercase tracking-widest bg-red-100 dark:bg-red-950/40 px-1 rounded">PAR!</span>
                  )}
                </div>
              )}
            </div>

            {/* Sub-HUD Progress Row */}
            <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-gray-100/10">
              <div className="w-1/2">
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider opacity-60 mb-1 text-gray-700 dark:text-gray-300">
                  <span>Placements Progress</span>
                  <span>{Math.round((placedBlocks.length / (placedBlocks.length + trayBlocks.length || 1)) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-850 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${(placedBlocks.length / (placedBlocks.length + trayBlocks.length || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-right flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-60 text-gray-700 dark:text-gray-300">Moves</span>
                  <p className="text-xs font-mono font-extrabold text-[#426657] dark:text-amber-500">
                    {moveCount}/{activeLevel.parMoves}
                  </p>
                </div>
                <div className="text-right border-l border-gray-150/10 pl-4">
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-60 text-gray-700 dark:text-gray-300 font-sans">Undo Limit</span>
                  <p className="text-xs font-mono font-extrabold text-amber-600 dark:text-amber-400">
                    {profile.isSubscribed ? '∞' : Math.max(0, 3 - moveHistory.length)}
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Main Game Grid Board Stage */}
          <main 
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="flex-grow flex flex-col items-center justify-center p-6 touch-none relative"
          >
            <VictoryParticles 
              active={gameWon} 
              boardRef={boardRef} 
              gridWidth={activeLevel.gridWidth} 
              gridHeight={activeLevel.gridHeight} 
            />

            {/* The Grid Board */}
            {isSudokuMode && sudokuGrid ? (
              <div ref={boardRef} className="w-full max-w-[360px] aspect-square rounded-3xl overflow-hidden shadow-xl border border-gray-300 dark:border-gray-800">
                <SudokuGridRenderer
                  gridData={sudokuGrid}
                  draggedBlock={draggedBlock}
                  ghostPlacement={ghostPlacement}
                  isGhostValid={isGhostValid}
                  onCellClick={handleSudokuCellClick}
                  colorblindMode={profile.colorblindMode}
                  showColorHints={showSudokuHints}
                  conflictCells={sudokuConflicts}
                />
              </div>
            ) : (
              <div 
                ref={boardRef}
                className={getBoardClass()}
                style={{
                  gridTemplateColumns: `repeat(${activeLevel.gridWidth}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${activeLevel.gridHeight}, minmax(0, 1fr))`
                }}
              >
                {/* Build empty / filled cells */}
                {[...Array(activeLevel.gridHeight)].map((_, r) => (
                  [...Array(activeLevel.gridWidth)].map((_, c) => {
                    const isBlocked = activeLevel.blockedCells.some(([bx, by]) => bx === c && by === r);
                    const placingInfo = placedBlocks.find(pb => pb.cells.some(([cx, cy]) => cx === c && cy === r));
                    
                    // Hint Highlight Solution Coords
                    const isHintActive = activeHintIndex !== null;
                    let isHintCoordinate = false;
                    if (isHintActive) {
                      const solution = activeLevel.hintSequence?.find(h => h.blockIndex === activeHintIndex);
                      if (solution) {
                        // Get offsets for that solution block
                        const originalBlock = activeLevel.availableBlocks[solution.blockIndex];
                        let trans = rotateOffsets(originalBlock.cells as [number, number][], solution.rotations);
                        trans = mirrorOffsets(trans, solution.mirrored);
                        isHintCoordinate = trans.some(([ox, oy]) => (solution.x + ox) === c && (solution.y + oy) === r);
                      }
                    }

                    // Determine color of filled block
                    const colorClass = placingInfo ? placingInfo.color : undefined;
                    const state = isBlocked ? 'blocked' : placingInfo ? 'filled' : 'empty';

                    // Ghost Hover Preview Outline
                    const isGhostActive = ghostPlacement !== null && draggedBlock !== null;
                    let isGhostCoordinate = false;
                    if (isGhostActive && draggedBlock) {
                      isGhostCoordinate = draggedBlock.cells.some(([ox, oy]) => (ghostPlacement.x + ox) === c && (ghostPlacement.y + oy) === r);
                    }

                    return (
                      <div 
                        key={`${r}-${c}`}
                        className={`relative w-full aspect-square rounded-xl transition-all duration-150 flex items-center justify-center ${getCellBgClass(state, colorClass)} ${
                          state === 'filled' ? 'block-tactile' : ''
                        } ${
                          isGhostCoordinate 
                            ? isGhostValid 
                              ? 'border-2 border-emerald-500 bg-emerald-500/25 scale-95 shadow-lg animate-pulse' 
                              : 'border-2 border-dashed border-red-500 bg-red-500/15 scale-95 shadow-inner'
                            : ''
                        } ${
                          isHintCoordinate && !placingInfo ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 shadow-md animate-pulse z-10' : ''
                        }`}
                        onClick={() => {
                          if (placingInfo) {
                            handleLiftPlacedBlock(placingInfo);
                          }
                        }}
                      >
                        {/* Grid index dots or simple minimalist aesthetics */}
                        {!placingInfo && !isBlocked && (
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            profile.theme === 'neon' ? 'bg-[#ff007f]/50 shadow-[0_0_4px_#ff007f]' :
                            profile.theme === 'sunset' ? 'bg-[#fca311]/50 shadow-[0_0_4px_#fca311]' :
                            profile.theme === 'retro' ? 'bg-[#39ff14]/50 shadow-[0_0_4px_#39ff14]' :
                            profile.theme === 'dark' ? 'bg-zinc-700/65' : 'bg-gray-400/40'
                          }`} />
                        )}
                        
                        {/* Blocked obstacle graphics */}
                        {isBlocked && (
                          <div className={`w-3.5 h-3.5 rounded-md ${
                            profile.theme === 'neon' ? 'bg-[#ff007f]/10 border border-[#ff007f]/30' :
                            profile.theme === 'sunset' ? 'bg-[#fca311]/10 border border-[#fca311]/30' :
                            profile.theme === 'retro' ? 'bg-[#39ff14]/10 border border-[#39ff14]/30' :
                            profile.theme === 'dark' ? 'bg-zinc-800/60 border border-zinc-700/40' :
                            'bg-gray-300/60 border border-gray-400/40 shadow-sm'
                          }`} />
                        )}

                        {/* Colorblind Pattern Assist Overlay */}
                        {placingInfo && profile.colorblindMode && (
                          <div 
                            className="absolute inset-0 rounded-xl pointer-events-none mix-blend-overlay opacity-90"
                            style={getBlockPatternStyle(colorClass)}
                          />
                        )}
                      </div>
                    );
                  })
                ))}
              </div>
            )}

            {/* Custom Instructions Indicator */}
            {isSudokuMode ? (
              <div className="flex flex-col items-center gap-2 mt-4">
                <button
                  onClick={() => setShowSudokuHints(!showSudokuHints)}
                  className="px-3 py-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-amber-500/25 transition-all shadow-sm flex items-center gap-1"
                >
                  <span>💡 {showSudokuHints ? 'Hide Cell Color Hints' : 'Show Cell Color Hints'}</span>
                </button>
                <p className="text-xs opacity-60 text-center font-medium">
                  Each row, col, and 2x3 region must contain unique colors. Tap block to rotate.
                </p>
              </div>
            ) : (
              <p className="text-xs opacity-60 text-center mt-4 font-medium">
                Tap piece in tray to rotate 90°. Drag to place on board.
              </p>
            )}
          </main>

          {/* Bottom Actions row, positioned cleanly above block tray */}
          <section className="px-6 py-2.5 bg-white/45 dark:bg-black/20 border-t border-gray-150/10 flex justify-around items-center z-10">
            {/* Hint Button */}
            <button 
              onClick={handleUseHint}
              className="w-12 h-12 rounded-full flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-855 shadow-md hover:scale-105 active:scale-95 transition-all text-amber-500 relative"
              title="Hint"
            >
              <Lightbulb className="w-5 h-5 fill-current" />
              <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5">
                Hint ({profile.isSubscribed ? '∞' : profile.hintsRemaining})
              </span>
            </button>

            {/* Undo Button */}
            <button 
              onClick={handleUndo}
              disabled={placedBlocks.length === 0}
              className="w-12 h-12 rounded-full flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-855 shadow-md hover:scale-105 active:scale-95 transition-all text-[#426657] dark:text-emerald-400 disabled:opacity-30 disabled:pointer-events-none"
              title="Undo"
            >
              <Undo className="w-5 h-5" />
              <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5 font-sans">Undo</span>
            </button>

            {/* Reset Board */}
            <button 
              onClick={resetLevel}
              className="w-12 h-12 rounded-full flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-855 shadow-md hover:scale-105 active:scale-95 transition-all text-gray-700 dark:text-gray-300"
              title="Reset level"
            >
              <RotateCcw className="w-5 h-5" />
              <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5 font-sans">Reset</span>
            </button>

            {/* Pause Menu Button */}
            <button 
              onClick={() => { sound.playClick(); setIsPauseOpen(true); }}
              className="w-12 h-12 rounded-full flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-855 shadow-md hover:scale-105 active:scale-95 transition-all text-gray-700 dark:text-gray-300"
              title="Pause"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5 font-sans">Pause</span>
            </button>
          </section>

          {/* Block Tray (Horizontal snap carousel) - 20% of screen height */}
          <section className="bg-gray-100/70 dark:bg-gray-950/40 h-32 flex items-center justify-start gap-6 px-6 overflow-x-auto scroll-smooth border-t border-gray-150/10 scrollbar-thin scrollbar-thumb-gray-350 select-none pb-safe">
            {trayBlocks.length === 0 ? (
              <div className="w-full text-center text-xs opacity-65 flex flex-col items-center justify-center gap-1.5 py-4">
                <Sparkles className="w-5 h-5 text-amber-500 animate-bounce" />
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400">All blocks placed! Check for perfect fit!</span>
              </div>
            ) : (
              trayBlocks.map((block) => {
                // Determine layout bounding box for previewing inside tray container
                const xs = block.cells.map(c => c[0]);
                const ys = block.cells.map(c => c[1]);
                const maxCol = Math.max(...xs) - Math.min(...xs) + 1;
                const maxRow = Math.max(...ys) - Math.min(...ys) + 1;

                // Process rotated coordinates
                let previewCells = rotateOffsets(block.cells, block.rotations);
                previewCells = mirrorOffsets(previewCells, block.mirrored);

                const boundingWidth = Math.max(...previewCells.map(c => c[0])) + 1;
                const boundingHeight = Math.max(...previewCells.map(c => c[1])) + 1;

                return (
                  <div 
                    key={block.id}
                    className="relative cursor-grab active:cursor-grabbing hover:scale-105 transition-transform flex-shrink-0 bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-200/40 dark:border-gray-800/40 shadow-md"
                    onPointerDown={(e) => {
                      const blockId = block.id;
                      if (blockPressTimers.current[blockId]) {
                        clearTimeout(blockPressTimers.current[blockId]);
                      }
                      blockPressTimers.current[blockId] = setTimeout(() => {
                        handleMirrorBlock(blockId);
                        sound.playRotate();
                        delete blockPressTimers.current[blockId];
                      }, 500);
                      handlePointerDown(e, block, 'tray');
                    }}
                    onPointerUp={() => {
                      const blockId = block.id;
                      if (blockPressTimers.current[blockId]) {
                        clearTimeout(blockPressTimers.current[blockId]);
                        delete blockPressTimers.current[blockId];
                      }
                      
                      const now = Date.now();
                      const lastTap = blockLastTapTimes.current[blockId] || 0;
                      if (now - lastTap < 300) {
                        handleRotateBlock(blockId);
                        blockLastTapTimes.current[blockId] = 0;
                      } else {
                        blockLastTapTimes.current[blockId] = now;
                      }
                    }}
                    onClick={() => {
                      // Desktop click fallback for quick rotation
                      handleRotateBlock(block.id);
                    }}
                  >
                    <div 
                      className="grid gap-0.5 p-1 bg-white/30 dark:bg-gray-900/30 rounded-xl"
                      style={{
                        gridTemplateColumns: `repeat(${boundingWidth}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${boundingHeight}, minmax(0, 1fr))`
                      }}
                    >
                      {[...Array(boundingHeight)].map((_, r) => (
                        [...Array(boundingWidth)].map((_, c) => {
                          const isOccupied = previewCells.some(([cx, cy]) => cx === c && cy === r);
                           return (
                            <div 
                              key={`${r}-${c}`}
                              className={`relative w-5.5 h-5.5 rounded ${
                                isOccupied ? `${block.color} block-tactile` : 'bg-transparent'
                              }`}
                            >
                              {isOccupied && profile.colorblindMode && (
                                <div 
                                  className="absolute inset-0 rounded pointer-events-none mix-blend-overlay opacity-90"
                                  style={getBlockPatternStyle(block.color)}
                                />
                              )}
                            </div>
                          );
                        })
                      ))}
                    </div>

                    {/* Small Mirror Badge trigger */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMirrorBlock(block.id);
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 p-1 rounded-full shadow text-[8px] font-bold text-gray-800 dark:text-gray-200"
                      title="Mirror Block"
                    >
                      ↔
                    </button>
                  </div>
                );
              })
            )}
          </section>

          {/* Active Custom Floating drag item node */}
          {draggedBlock && (
            <div 
              style={{
                position: 'fixed',
                left: dragPosition.x - dragOffset.x,
                top: dragPosition.y - dragOffset.y - 45, // Elevated by 45px above touch point
                pointerEvents: 'none',
                zIndex: 100,
                opacity: 0.9,
                transform: 'scale(1.1) rotate(2deg)'
              }}
            >
              {/* Render the block in actual cells */}
              <div 
                className="grid gap-0.5 p-1 bg-white/10 dark:bg-black/10 rounded-xl backdrop-blur-sm"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(...draggedBlock.cells.map(c => c[0])) + 1}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${Math.max(...draggedBlock.cells.map(c => c[1])) + 1}, minmax(0, 1fr))`
                }}
              >
                {[...Array(Math.max(...draggedBlock.cells.map(c => c[1])) + 1)].map((_, r) => (
                  [...Array(Math.max(...draggedBlock.cells.map(c => c[0])) + 1)].map((_, c) => {
                    const isOccupied = draggedBlock.cells.some(([cx, cy]) => cx === c && cy === r);
                    return (
                      <div 
                        key={`${r}-${c}`}
                        className={`relative w-8 h-8 rounded-lg shadow-xl ${
                          isOccupied ? `${draggedBlock.color} block-tactile` : 'bg-transparent'
                        }`}
                      >
                        {isOccupied && profile.colorblindMode && (
                          <div 
                            className="absolute inset-0 rounded-lg pointer-events-none mix-blend-overlay opacity-90"
                            style={getBlockPatternStyle(draggedBlock.color)}
                          />
                        )}
                      </div>
                    );
                  })
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* 5. GLOBAL LEADERBOARDS SCREEN */}
      {currentScreen === 'leaderboard' && (
        <motion.div
          key="leaderboard"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="flex-grow flex flex-col"
        >
          {/* Header */}
          <header className="flex justify-between items-center w-full px-6 h-16 bg-transparent z-10">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { sound.playClick(); setCurrentScreen('main_menu'); }}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="font-bold text-lg">Global Leaderboards</h1>
            </div>
            <button 
              onClick={() => { sound.playClick(); setIsSettingsOpen(true); }}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </header>

          <main className="flex-1 overflow-y-auto px-6 py-4 pb-24 max-w-md mx-auto w-full">
            {/* Board Type Toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-2xl mb-4 max-w-md mx-auto border border-gray-200/50 dark:border-gray-800/50">
              <button
                onClick={() => {
                  sound.playClick();
                  setLeaderboardTab('campaign');
                  fetchLeaderboard(16);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  leaderboardTab === 'campaign' 
                    ? 'bg-[#426657] text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                Campaign (Lvl 16)
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setLeaderboardTab('speedrun');
                  fetchSpeedrunLeaderboard(speedrunLeaderboardLevelId);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
                  leaderboardTab === 'speedrun' 
                    ? 'bg-amber-500 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <span>Speedrun ⚡</span>
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setLeaderboardTab('daily');
                  fetchDailyLeaderboard(dailyDate);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  leaderboardTab === 'daily' 
                    ? 'bg-[#426657] text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                Daily Fit
              </button>
            </div>

            {/* Speedrun Level Cycler (Only visible in speedrun tab) */}
            {leaderboardTab === 'speedrun' && (
              <div className="flex items-center justify-between mb-4 bg-gray-50 dark:bg-gray-900/60 p-2 rounded-2xl border border-gray-200/40 dark:border-gray-800/40 max-w-md mx-auto w-full">
                <button
                  disabled={speedrunLeaderboardLevelId <= 1}
                  onClick={() => {
                    sound.playClick();
                    const newLvl = speedrunLeaderboardLevelId - 1;
                    setSpeedrunLeaderboardLevelId(newLvl);
                    fetchSpeedrunLeaderboard(newLvl);
                  }}
                  className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow flex items-center justify-center text-xs font-bold disabled:opacity-30 border border-gray-200/50 dark:border-gray-700/50"
                >
                  ◀
                </button>
                <div className="text-center">
                  <span className="text-[9px] font-bold opacity-50 uppercase tracking-widest block leading-none">Speedrun Target</span>
                  <span className="text-sm font-black text-amber-500">Level {speedrunLeaderboardLevelId}</span>
                </div>
                <button
                  disabled={speedrunLeaderboardLevelId >= 50}
                  onClick={() => {
                    sound.playClick();
                    const newLvl = speedrunLeaderboardLevelId + 1;
                    setSpeedrunLeaderboardLevelId(newLvl);
                    fetchSpeedrunLeaderboard(newLvl);
                  }}
                  className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow flex items-center justify-center text-xs font-bold disabled:opacity-30 border border-gray-200/50 dark:border-gray-700/50"
                >
                  ▶
                </button>
              </div>
            )}

            {/* World Selector Header */}
            <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-4 flex justify-between items-center mb-6">
              <div>
                <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest leading-none">Selected Board</span>
                <h3 className="text-sm font-extrabold mt-1">
                  {leaderboardTab === 'campaign' 
                    ? 'Level 16: Geometry Master' 
                    : leaderboardTab === 'speedrun'
                    ? `Level ${speedrunLeaderboardLevelId} (Speedrun Challenge)`
                    : `Daily Challenge: ${dailyDate}`}
                </h3>
              </div>
              <button 
                onClick={() => {
                  if (leaderboardTab === 'campaign') {
                    fetchLeaderboard(16);
                  } else if (leaderboardTab === 'speedrun') {
                    fetchSpeedrunLeaderboard(speedrunLeaderboardLevelId);
                  } else {
                    fetchDailyLeaderboard(dailyDate);
                  }
                }}
                className="bg-primary dark:bg-amber-500 text-white dark:text-gray-950 font-bold text-xs px-4 py-2 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-sm"
              >
                Refresh
              </button>
            </div>

            {/* List entries */}
            {isLoadingScores ? (
              <div className="text-center py-10">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <span className="text-xs opacity-60">Syncing live leaderboards...</span>
              </div>
            ) : leaderboardScores.length === 0 ? (
              <div className="text-center py-10 text-xs opacity-60">
                No scores posted yet. Be the first to win!
              </div>
            ) : (
              <div className="space-y-2.5">
                {leaderboardScores.map((score, idx) => {
                  const isUser = score.username === profile.username;
                  return (
                    <div 
                      key={idx}
                      className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${
                        isUser 
                          ? 'bg-amber-500/10 border-amber-500/30' 
                          : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 text-sm font-black text-center ${idx === 0 ? 'text-yellow-500 text-base' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'opacity-60'}`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className={`text-sm font-bold ${isUser ? 'text-amber-600 dark:text-amber-400 font-extrabold' : ''}`}>{score.username}</p>
                          <p className="text-[10px] opacity-50 mt-0.5">{new Date(score.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="text-xs font-mono font-bold">{Math.floor(score.time / 60)}m {score.time % 60}s</p>
                          <p className="text-[9px] opacity-60 uppercase tracking-widest mt-0.5">{score.moves} moves</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[#D4AF37] text-xs">★</span>
                          <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 leading-none mt-0.5">{score.stars}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </motion.div>
      )}

      {/* 6. PREMIUM UPGRADE SUBSCRIPTION SCREEN */}
      {currentScreen === 'subscription' && (
        <motion.div
          key="subscription"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="flex-grow flex flex-col relative overflow-x-hidden"
        >
          {/* Header */}
          <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 h-16 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
            <button 
              onClick={() => { sound.playClick(); setCurrentScreen('main_menu'); }}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="font-display font-bold text-base tracking-tight">Block Fit Plus</div>
            <div className="w-10" />
          </nav>

          <main className="relative pt-24 pb-12 px-6 max-w-lg mx-auto w-full flex-1 flex flex-col justify-between">
            {/* Hero Brand Title */}
            <header className="text-center mb-10 relative">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 dark:bg-amber-500/10 rounded-full blur-3xl -z-10" />
              <div className="inline-flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary dark:bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
                  <Crown className="w-7 h-7 text-white dark:text-gray-900" />
                </div>
                <h1 className="font-display text-3xl font-extrabold flex flex-col items-start leading-none text-primary dark:text-white">
                  <span>Block Fit</span>
                  <span className="text-[#426657] dark:text-amber-500 text-lg">Plus</span>
                </h1>
              </div>
              <p className="text-sm opacity-80 max-w-[280px] mx-auto">Elevate your focus with the ultimate puzzle experience.</p>
            </header>

            {/* Benefits Checkmarks */}
            <section className="space-y-5 mb-12">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center flex-shrink-0 text-[#426657] dark:text-amber-500">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold leading-none">Infinite Levels</h3>
                  <p className="text-[11px] opacity-65 mt-1">Endless procedurally generated puzzles past level 100.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center flex-shrink-0 text-[#426657] dark:text-amber-500">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold leading-none">Daily Challenges</h3>
                  <p className="text-[11px] opacity-65 mt-1">Exclusive curated puzzles with a globally ranked leaderboards.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center flex-shrink-0 text-[#426657] dark:text-amber-500">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold leading-none">Unlimited Hints &amp; Undos</h3>
                  <p className="text-[11px] opacity-65 mt-1">Never get stuck again. Keep your flow state completely uninterrupted.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center flex-shrink-0 text-[#426657] dark:text-amber-500">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold leading-none">10 Premium Themes</h3>
                  <p className="text-[11px] opacity-65 mt-1">Unlock Minimalist, Neon Night, Sunset Glow, and Retro aesthetics.</p>
                </div>
              </div>
            </section>

            {/* Price Plans Toggle Grid */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="border-2 border-[#426657] dark:border-amber-500 bg-white dark:bg-gray-900 p-5 rounded-3xl relative flex flex-col justify-between shadow-lg">
                <div className="absolute -top-3 left-4 bg-[#426657] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Save 33%</div>
                <div>
                  <h4 className="text-xs font-extrabold opacity-70">Annual</h4>
                  <div className="flex items-baseline gap-0.5 mt-2">
                    <span className="text-2xl font-extrabold">$14.99</span>
                    <span className="text-[10px] opacity-65">/yr</span>
                  </div>
                </div>
                <p className="text-[9px] opacity-50 mt-4">$1.25 / month, billed annually</p>
              </div>

              <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 rounded-3xl flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-extrabold opacity-70">Monthly</h4>
                  <div className="flex items-baseline gap-0.5 mt-2">
                    <span className="text-2xl font-extrabold">$2.99</span>
                    <span className="text-[10px] opacity-65">/mo</span>
                  </div>
                </div>
                <p className="text-[9px] opacity-50 mt-4">Cancel anytime, instant trial</p>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-4 text-center">
              <button 
                onClick={handleUnlockPlus}
                className="w-full h-16 bg-[#426657] hover:bg-[#345044] text-white rounded-2xl font-bold text-base shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Crown className="w-5 h-5 text-amber-400" />
                <span>Start 7-Day Free Trial</span>
              </button>
              <button 
                onClick={() => { sound.playClick(); setCurrentScreen('main_menu'); }}
                className="block w-full py-2 text-xs font-bold opacity-60 hover:opacity-100 transition-opacity"
              >
                Maybe Later
              </button>
            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>

      {/* --- OVERLAY 0.5: LEVEL PREVIEW MODAL --- */}
      <AnimatePresence>
        {previewLevel && (() => {
          const progress = profile.levelProgress[previewLevel.id];
          const isCompleted = progress?.completed;
          const starsCount = progress?.stars || 0;
          const worldId = previewLevel.id <= 10 ? 1 : previewLevel.id <= 20 ? 2 : previewLevel.id <= 30 ? 3 : previewLevel.id <= 40 ? 4 : 5;
          const worldName = worldId === 1 ? 'Beginner' : worldId === 2 ? 'Intermediate' : worldId === 3 ? 'Advanced' : worldId === 4 ? 'Expert' : 'Master';
          const speedrunLimitVal = Math.max(15, previewLevel.parTime || (previewLevel.availableBlocks.length * 8) + 5);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPreviewLevel(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />

              {/* Card Content */}
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ type: "spring", duration: 0.35 }}
                className="bg-white dark:bg-gray-950 rounded-3xl p-6 w-full max-w-sm border border-gray-150/10 dark:border-gray-900 shadow-2xl relative z-10 text-primary dark:text-white"
              >
                {/* Header Row */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-[#426657] dark:text-emerald-400 uppercase tracking-wider block">
                      {worldName} World • Level {previewLevel.id}
                    </span>
                    <h3 className="font-extrabold text-xl mt-0.5">
                      Puzzle Details
                    </h3>
                  </div>
                  <button 
                    onClick={() => { sound.playClick(); setPreviewLevel(null); }}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center border border-gray-200/40 dark:border-gray-850/20"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Level Target / Grid Visualization Summary */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-150/10 text-center">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold block">Grid Size</span>
                    <p className="text-sm font-mono font-black mt-1 text-gray-800 dark:text-gray-200">
                      {previewLevel.gridWidth} × {previewLevel.gridHeight}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-150/10 text-center">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold block">Pieces</span>
                    <p className="text-sm font-mono font-black mt-1 text-gray-800 dark:text-gray-200">
                      {previewLevel.availableBlocks.length} Blocks
                    </p>
                  </div>
                </div>

                {/* Mode Preview Toggle inside Card */}
                <div className="mb-4 bg-gray-100/70 dark:bg-gray-900/50 p-1.5 rounded-2xl border border-gray-200/50 dark:border-gray-800/40 shadow-inner">
                  <span className="text-[10px] font-extrabold opacity-50 uppercase tracking-widest px-2 pb-1 block leading-none">Game Mode</span>
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setIsSpeedrunPreToggled(false);
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                        !isSpeedrunPreToggled 
                          ? 'bg-[#426657] text-white shadow-sm' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Campaign</span>
                    </button>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setIsSpeedrunPreToggled(true);
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                        isSpeedrunPreToggled 
                          ? 'bg-amber-500 text-white shadow-sm' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Speedrun ⚡</span>
                    </button>
                  </div>
                </div>

                {/* Stats / Targets Box based on pre-toggled mode */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/90 rounded-2xl border border-gray-150/10 mb-5 space-y-3">
                  {isSpeedrunPreToggled ? (
                    <>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 dark:text-gray-500 font-bold">Speedrun Limit:</span>
                        <span className="font-mono font-black text-amber-500 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" /> {speedrunLimitVal} seconds
                        </span>
                      </div>
                      <div className="h-px bg-gray-200 dark:bg-gray-800" />
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium leading-relaxed">
                        ⚡ Fit all blocks on the grid before the countdown reaches zero! Solving in Speedrun Mode records your score on the Speedrun Leaderboard.
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 dark:text-gray-500 font-bold">Par Moves target:</span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {previewLevel.parMoves} moves
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 dark:text-gray-500 font-bold">Par Time target:</span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {previewLevel.parTime} seconds
                        </span>
                      </div>
                      <div className="h-px bg-gray-200 dark:bg-gray-800" />
                      
                      {/* Personal Best info */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400 dark:text-gray-500 font-bold">Your Status:</span>
                          <span className="font-bold flex items-center gap-1">
                            {isCompleted ? (
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                Completed {[...Array(3)].map((_, i) => (
                                  <span key={i} className={`text-xs ${i < starsCount ? 'text-amber-400' : 'text-gray-300 dark:text-gray-700'}`}>★</span>
                                ))}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[11px]">Not Completed</span>
                            )}
                          </span>
                        </div>
                        {isCompleted && (
                          <>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-400 dark:text-gray-500 font-bold">Best Moves:</span>
                              <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                                {progress?.moves || '—'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-400 dark:text-gray-500 font-bold">Best Time:</span>
                              <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                                {progress?.time ? `${progress.time}s` : '—'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* CTAs */}
                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      sound.playClick();
                      const lvl = previewLevel;
                      setPreviewLevel(null);
                      startLevel(lvl, isSpeedrunPreToggled);
                    }}
                    className={`w-full py-4 rounded-2xl font-black text-sm text-white shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all hover:scale-[1.01] ${
                      isSpeedrunPreToggled 
                        ? 'bg-amber-500 hover:bg-amber-600' 
                        : 'bg-[#426657] hover:bg-[#355246]'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Level {previewLevel.id}</span>
                  </button>

                  <button 
                    onClick={() => {
                      sound.playClick();
                      const targetLimit = Math.max(15, previewLevel.parTime || (previewLevel.availableBlocks.length * 8) + 5);
                      const text = isSpeedrunPreToggled
                        ? `⚡ Can you solve Level ${previewLevel.id} of Block Fit in SPEEDRUN Mode under ${targetLimit}s? 🏆 Try to beat the clock! Play here: ${appUrl}`
                        : `🧩 Let's play Block Fit Level ${previewLevel.id}! Can you solve this puzzle? 🏆 Play here: ${appUrl}`;
                      navigator.clipboard.writeText(text);
                      setLevelShareCopied(true);
                      sound.playWin();
                      setTimeout(() => setLevelShareCopied(false), 2000);
                    }}
                    className="w-full py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-2xl font-bold text-xs text-primary dark:text-white flex items-center justify-center gap-1.5 transition-all"
                  >
                    {levelShareCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-500 font-extrabold">Invite Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 text-amber-500" />
                        <span>Invite Friends / Share Level</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* --- OVERLAY 1: SYSTEM SETTINGS MODAL --- */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Card Content */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-950 rounded-3xl p-6 w-full max-w-sm border border-gray-100 dark:border-gray-900 shadow-2xl relative z-10 text-primary dark:text-white"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-extrabold text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-500 animate-spin" />
                  <span>Settings</span>
                </h3>
                <button 
                  onClick={() => { sound.playClick(); setIsSettingsOpen(false); }}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Edit Username Section */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Leaderboard Name</label>
                  <div className="flex gap-2 mt-1.5">
                    <input 
                      type="text" 
                      value={localUsername} 
                      onChange={(e) => setLocalUsername(e.target.value)}
                      placeholder="Input username..."
                      className="flex-grow bg-gray-100 dark:bg-gray-900 border border-transparent focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-2 text-sm text-primary dark:text-white"
                    />
                    <button 
                      onClick={saveUsername}
                      className="bg-primary dark:bg-amber-500 text-white dark:text-gray-950 font-bold px-4 py-2 rounded-xl text-xs"
                    >
                      Save
                    </button>
                  </div>
                </div>

                {/* Toggles */}
                <div className="border-t border-gray-100 dark:border-gray-900 pt-4 space-y-3.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {profile.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      <span className="text-sm font-semibold">Sound Effects</span>
                    </div>
                    <button 
                      onClick={() => {
                        setProfile(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
                        sound.playClick();
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative ${profile.soundEnabled ? 'bg-[#426657]' : 'bg-gray-300 dark:bg-gray-700'}`}
                    >
                      <motion.div 
                        layout
                        className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                        style={{ left: profile.soundEnabled ? '26px' : '2px' }}
                      />
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      <span className="text-sm font-semibold">Background Music</span>
                    </div>
                    <button 
                      onClick={() => {
                        const nextVal = !(profile.musicEnabled !== false);
                        setProfile(prev => ({ ...prev, musicEnabled: nextVal }));
                        sound.playClick();
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative ${profile.musicEnabled !== false ? 'bg-[#426657]' : 'bg-gray-300 dark:bg-gray-700'}`}
                    >
                      <motion.div 
                        layout
                        className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                        style={{ left: profile.musicEnabled !== false ? '26px' : '2px' }}
                      />
                    </button>
                  </div>

                  {/* Soundscape Track Selection */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Soundscape</span>
                        <span className="text-[10px] opacity-60">Procedural synthesizer track</span>
                      </div>
                    </div>
                    <select 
                      value={profile.soundscape || 'zen'}
                      onChange={(e) => {
                        sound.playClick();
                        setProfile(prev => ({ ...prev, soundscape: e.target.value as any }));
                      }}
                      className="bg-gray-100 dark:bg-gray-900 text-xs font-bold border-transparent rounded-xl px-3 py-1.5 text-primary dark:text-white focus:outline-none"
                    >
                      <option value="zen">🧘 Zen Harmony</option>
                      <option value="cosmic">🌌 Cosmic Drift</option>
                      <option value="nature">🍃 Nature Focus</option>
                    </select>
                  </div>

                  {/* Dark Mode Theme */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      <span className="text-sm font-semibold">Theme Selection</span>
                    </div>
                    <select 
                      value={profile.theme}
                      onChange={(e) => {
                        sound.playClick();
                        setProfile(prev => ({ ...prev, theme: e.target.value as any }));
                      }}
                      className="bg-gray-100 dark:bg-gray-900 text-xs font-bold border-transparent rounded-xl px-3 py-1.5 text-primary dark:text-white focus:outline-none"
                    >
                      <option value="light">Light Slate</option>
                      <option value="dark">Dark Charcoal</option>
                      <option value="neon">Neon Night</option>
                      <option value="sunset">Sunset Glow</option>
                      <option value="retro">8-Bit Retro</option>
                    </select>
                  </div>

                  {/* Colorblind Patterns */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Colorblind Assist</span>
                        <span className="text-[10px] opacity-60">Overlays patterns on block segments</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const nextVal = !profile.colorblindMode;
                        setProfile(prev => ({ ...prev, colorblindMode: nextVal }));
                        sound.playClick();
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative ${profile.colorblindMode ? 'bg-[#426657]' : 'bg-gray-300 dark:bg-gray-700'}`}
                    >
                      <motion.div 
                        layout
                        className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                        style={{ left: profile.colorblindMode ? '26px' : '2px' }}
                      />
                    </button>
                  </div>

                  {/* Haptic Feedback */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Haptic Feedback</span>
                        <span className="text-[10px] opacity-60">Tactile hums on placing, rotating & flipping</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const nextVal = !(profile.hapticEnabled !== false);
                        setProfile(prev => ({ ...prev, hapticEnabled: nextVal }));
                        sound.playClick();
                        if (nextVal && typeof navigator !== 'undefined' && navigator.vibrate) {
                          try {
                            navigator.vibrate(15);
                          } catch (e) {}
                        }
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative ${profile.hapticEnabled !== false ? 'bg-[#426657]' : 'bg-gray-300 dark:bg-gray-700'}`}
                    >
                      <motion.div 
                        layout
                        className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                        style={{ left: profile.hapticEnabled !== false ? '26px' : '2px' }}
                      />
                    </button>
                  </div>
                </div>

                {/* Cloud Account Section */}
                <div className="border-t border-gray-100 dark:border-gray-900 pt-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Cloud Account</h4>
                  {profile.isLoggedIn ? (
                    <div className="flex flex-col gap-2 bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 dark:text-gray-500 font-bold">Email:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 truncate max-w-[170px]">{profile.userEmail}</span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <button 
                          onClick={() => { sound.playClick(); saveProfileToCloud(); }}
                          className="flex-grow bg-[#426657] hover:bg-[#355246] text-white font-extrabold text-[10px] py-2 rounded-xl transition-all"
                        >
                          ☁️ Sync Progress
                        </button>
                        <button 
                          onClick={handleLogout}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold text-[10px] px-3.5 py-2 rounded-xl border border-red-500/20 transition-all"
                        >
                          Log Out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        sound.playClick();
                        setIsSettingsOpen(false);
                        setCurrentScreen('auth');
                      }}
                      className="w-full py-3 bg-[#426657] hover:bg-[#355246] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>🔑 Sign In or Register (Save Progress)</span>
                    </button>
                  )}
                </div>

                {/* Cross Platform Synchronizer */}
                <div className="border-t border-gray-100 dark:border-gray-900 pt-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Cross-Platform Sync</h4>
                  
                  {/* Generate Sync Code */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 flex justify-between items-center border border-gray-100 dark:border-gray-800 mb-3">
                    <div>
                      <p className="text-[10px] font-bold">Cloud Sync Code</p>
                      <p className="text-xs font-mono font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">
                        {profile.syncCode || "NOT GENERATED"}
                      </p>
                    </div>
                    {profile.syncCode ? (
                      <button 
                        onClick={saveToSyncCode}
                        disabled={syncLoading}
                        className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg"
                      >
                        Push Progress
                      </button>
                    ) : (
                      <button 
                        onClick={generateSyncCode}
                        disabled={syncLoading}
                        className="bg-primary dark:bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg"
                      >
                        Generate Code
                      </button>
                    )}
                  </div>

                  {/* Input Sync Code */}
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={syncCodeInput} 
                      onChange={(e) => setSyncCodeInput(e.target.value)}
                      placeholder="Input 6-digit sync code..."
                      className="flex-grow bg-gray-100 dark:bg-gray-900 border border-transparent focus:border-emerald-500 focus:outline-none rounded-xl px-3 py-1.5 text-xs text-primary dark:text-white"
                    />
                    <button 
                      onClick={loadFromSyncCode}
                      disabled={syncLoading}
                      className="bg-[#426657] text-white font-bold text-xs px-3 py-1.5 rounded-xl"
                    >
                      Sync
                    </button>
                  </div>

                  {syncStatus && (
                    <p className={`text-[10px] font-semibold mt-2 ${syncStatus.type === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>
                      {syncStatus.msg}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- OVERLAY 1.8: TERMS & PRIVACY POLICY MODAL --- */}
      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-950 rounded-3xl p-6 w-full max-w-sm border border-gray-150 dark:border-gray-900 shadow-2xl relative z-10 text-primary dark:text-white"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span>Privacy & Data Policy</span>
                </h3>
                <button
                  onClick={() => { sound.playClick(); setShowTermsModal(false); }}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs leading-relaxed max-h-60 overflow-y-auto pr-1">
                <div>
                  <h4 className="font-extrabold text-[#426657] dark:text-emerald-400 mb-1">1. What Data We Collect</h4>
                  <p className="opacity-70">
                    To save your progress and enable live leaderboard competition, we collect your email address, username, and level performance records (stars, moves, and seconds).
                  </p>
                </div>
                <div>
                  <h4 className="font-extrabold text-[#426657] dark:text-emerald-400 mb-1">2. How Your Data is Used</h4>
                  <p className="opacity-70">
                    We use your data solely to maintain your online puzzle profile and synchronise your progress across devices. We do not use tracking scripts or run external ads targeting your profile.
                  </p>
                </div>
                <div>
                  <h4 className="font-extrabold text-[#426657] dark:text-emerald-400 mb-1">3. Security & Safety Guarantee</h4>
                  <p className="opacity-70">
                    Your personal information is strictly private and stored securely. We will **never sell, share, rent, or lease** your data to any third-party advertisers, companies, or analytics firms.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  sound.playClick();
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }}
                className="w-full mt-6 py-3 bg-[#426657] hover:bg-[#355246] text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Agree & Close</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- OVERLAY 1.5: HOW TO PLAY MODAL --- */}
      <AnimatePresence>
        {isHowToPlayOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-950 rounded-3xl p-6 w-full max-w-md border border-gray-150 dark:border-gray-850 shadow-2xl relative z-10 text-primary dark:text-white"
            >
              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Info className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-xl">How to Play</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Master the geometric puzzles in simple steps</p>
              </div>

              <div className="space-y-4 my-2 text-sm text-left">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#426657] text-white flex items-center justify-center font-mono text-xs font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Drag &amp; Place</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Drag colored polyomino block pieces from the horizontal tray and position them cleanly onto the grid cells.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#426657] text-white flex items-center justify-center font-mono text-xs font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Rotate &amp; Mirror</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Double-tap a block in the tray to rotate it 90 degrees clockwise, or click the mirror (↔) icon to horizontal-flip it.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#426657] text-white flex items-center justify-center font-mono text-xs font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Perfect Fit Wins</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Fill every grid cell completely with NO overlaps and NO blocks left over to complete the puzzle!</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#426657] text-white flex items-center justify-center font-mono text-xs font-bold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Stars &amp; Par Limits</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Complete within the move limit and timer targets to secure a perfect 3-star gold rating.</p>
                  </div>
                </div>
              </div>

              {/* Close CTA */}
              <button 
                onClick={() => { sound.playClick(); setIsHowToPlayOpen(false); }}
                className="w-full py-3.5 mt-6 bg-[#426657] hover:bg-[#345044] text-white rounded-2xl font-bold text-sm shadow-md"
              >
                Got It! Let's Fit
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- OVERLAY 2: GAMEPLAY PAUSE OVERLAY --- */}
      <AnimatePresence>
        {isPauseOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPauseOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-950 rounded-3xl p-6 w-full max-w-sm border border-gray-100 dark:border-gray-900 shadow-2xl relative z-10 text-primary dark:text-white text-center"
            >
              <h3 className="font-extrabold text-xl mb-6">Game Paused</h3>

              <div className="space-y-3.5">
                <button 
                  onClick={() => { sound.playClick(); setIsPauseOpen(false); }}
                  className="w-full py-4 bg-[#426657] text-white rounded-2xl font-bold text-sm shadow-md"
                >
                  Resume Puzzle
                </button>
                <button 
                  onClick={() => { sound.playClick(); setIsPauseOpen(false); resetLevel(); }}
                  className="w-full py-4 bg-gray-100 dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl font-bold text-sm"
                >
                  Restart Level
                </button>
                <button 
                  onClick={() => { sound.playClick(); setIsPauseOpen(false); setCurrentScreen('main_menu'); }}
                  className="w-full py-4 bg-gray-100 dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl font-bold text-sm text-red-500"
                >
                  Quit to Main Menu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- OVERLAY 5: SPEEDRUN FAILED OVERLAY --- */}
      <AnimatePresence>
        {isSpeedrunMode && isSpeedrunFailed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-950 rounded-3xl p-6 w-full max-w-sm border border-gray-100 dark:border-gray-900 shadow-2xl relative z-10 text-primary dark:text-white text-center"
            >
              <div className="w-14 h-14 bg-red-100 dark:bg-red-950/50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <TimerOff className="w-8 h-8" />
              </div>
              
              <h3 className="font-extrabold text-2xl mb-2 text-red-500">Speedrun Failed!</h3>
              <p className="text-xs opacity-75 mb-6 px-4 text-gray-500 dark:text-gray-400">
                You ran out of time! Standard level speedruns are tough. Practice makes perfect.
              </p>

              <div className="space-y-3.5">
                <button 
                  onClick={() => { 
                    sound.playClick(); 
                    startLevel(activeLevel, true); 
                  }}
                  className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:bg-amber-600 active:scale-95 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Try Speedrun Again</span>
                </button>
                <button 
                  onClick={() => { 
                    sound.playClick(); 
                    startLevel(activeLevel, false); 
                  }}
                  className="w-full py-4 bg-gray-100 dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl font-bold text-sm text-[#426657] dark:text-emerald-400"
                >
                  Play Normal Mode (Chill)
                </button>
                <button 
                  onClick={() => { 
                    sound.playClick(); 
                    setCurrentScreen('main_menu'); 
                  }}
                  className="w-full py-4 bg-gray-100 dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl font-bold text-sm text-red-500"
                >
                  Quit to Main Menu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- OVERLAY 3: WIN CELEBRATION MODAL --- */}
      <AnimatePresence>
        {showWinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-950 rounded-3xl p-8 w-full max-w-md border border-gray-100 dark:border-gray-900 shadow-2xl text-center text-primary dark:text-white"
            >
              {/* Star popping animation */}
              <div className="flex justify-center gap-3 mb-6">
                {[1, 2, 3].map((starIdx) => {
                  const isActive = starIdx <= starsAwarded;
                  return (
                    <motion.span 
                      key={starIdx}
                      initial={{ scale: 0, rotate: -30 }}
                      animate={isActive ? { scale: [1, 1.3, 1], rotate: [0, 15, 0] } : { scale: 1 }}
                      transition={{ delay: 0.3 * starIdx, type: "spring" }}
                      className={`text-4xl ${isActive ? 'text-yellow-500 filter drop-shadow-md' : 'text-gray-200 dark:text-gray-800'}`}
                    >
                      ★
                    </motion.span>
                  );
                })}
              </div>

              <h2 className="font-display text-3xl font-extrabold tracking-tight mb-2">
                {isDailyChallenge ? 'Challenge Solved!' : 'Level Completed!'}
              </h2>
              <p className="text-xs opacity-75 max-w-[240px] mx-auto mb-6">
                {isDailyChallenge 
                  ? `You masterfully solved today's Daily Geometry Challenge!`
                  : `You masterfully solved the geometry of Level ${activeLevel.id}!`}
              </p>

              {/* Stats overview */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl mb-8">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total Time</span>
                  <p className="text-base font-mono font-bold mt-0.5">
                    {Math.floor(timerSeconds / 60)}m {timerSeconds % 60}s
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total Moves</span>
                  <p className="text-base font-mono font-bold mt-0.5">
                    {moveCount} / {activeLevel.parMoves}
                  </p>
                </div>
              </div>

              {/* CTAs */}
              <div className="space-y-3.5">
                {isDailyChallenge ? (
                  <button 
                    onClick={() => {
                      sound.playClick();
                      setLeaderboardTab('daily');
                      fetchDailyLeaderboard(dailyDate);
                      setCurrentScreen('leaderboard');
                    }}
                    className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-sm shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Award className="w-5 h-5 text-white" />
                    <span>View Daily Leaderboard</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      sound.playClick();
                      const nextLvl = PRESET_LEVELS.find(l => l.id === activeLevel.id + 1);
                      if (nextLvl) {
                        startLevel(nextLvl);
                      } else {
                        // Restart active one or procedural
                        startLevel(activeLevel);
                      }
                    }}
                    className="w-full h-14 bg-[#426657] hover:bg-[#345044] text-white rounded-2xl font-bold text-sm shadow-md cursor-pointer"
                  >
                    Next Level
                  </button>
                )}
                <div className="grid grid-cols-2 gap-3.5">
                  <button 
                    onClick={handleCopyShare}
                    className="h-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 text-xs font-bold rounded-2xl flex items-center justify-center gap-1"
                  >
                    {shareCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4 text-emerald-500" />}
                    <span>{shareCopied ? 'Copied' : 'Share Score'}</span>
                  </button>
                  <button 
                    onClick={() => { sound.playClick(); setCurrentScreen('main_menu'); }}
                    className="h-12 bg-gray-100 dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl font-bold text-xs"
                  >
                    Exit Map
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* --- OVERLAY 4: REWARDED AD POPUP FOR UNDOS --- */}
      <AnimatePresence>
        {isUndoAdOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-950 rounded-3xl p-6 w-full max-w-sm border border-gray-100 dark:border-gray-900 shadow-2xl relative z-10 text-primary dark:text-white text-center"
            >
              {/* Ad/Refill Banner Icon */}
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/40 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                <Video className="w-8 h-8 animate-pulse" />
              </div>

              <h3 className="font-extrabold text-lg mb-2">Out of Free Undos</h3>
              <p className="text-xs opacity-70 mb-6 px-2">
                You have used your 3 free undos for this level. Unlock unlimited undos with Plus, or watch a quick ad to refill 3 more!
              </p>

              {/* CTAs */}
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    sound.playClick();
                    // Simulate ad view
                    setIsUndoAdOpen(false);
                    // Open a simulated fullscreen video ad
                    const adTimer = alert ? alert : console.log;
                    let countdown = 3;
                    const interval = setInterval(() => {
                      countdown--;
                      if (countdown <= 0) {
                        clearInterval(interval);
                        setUndosRemaining(3);
                        sound.playWin();
                      }
                    }, 1000);
                    // We can also just set it immediately for a highly satisfying user-experience!
                    setUndosRemaining(3);
                    sound.playWin();
                  }}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Watch Quick Ad (+3 Undos)</span>
                </button>
                
                <button 
                  onClick={() => {
                    sound.playClick();
                    setIsUndoAdOpen(false);
                    setCurrentScreen('subscription');
                  }}
                  className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 border border-gray-800"
                >
                  <Crown className="w-4 h-4 text-amber-400 fill-current" />
                  <span>Go Plus (Unlimited Undos)</span>
                </button>

                <button 
                  onClick={() => { sound.playClick(); setIsUndoAdOpen(false); }}
                  className="block w-full py-2 text-xs font-bold opacity-60 hover:opacity-100 transition-opacity"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
