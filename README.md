# 🧩 Block Fit

A premium, modern geometric puzzle game where players fit custom-shaped blocks to fully tile a grid board. Featuring campaign mode, speedrun leaderboards, deterministically generated daily challenges, a hybrid Sudoku mode, and a secure serverless backend.

---

## 🌟 Game Modes

*   **Campaign Mode**: Progress through 30+ handcrafted levels of increasing difficulty across 5 unique geometric worlds.
*   **Speedrun Mode**: Race against the clock! Complete levels as fast as possible to climb the global speedrun rankings (primary-sorted by time).
*   **Daily Fit Challenge**: A new puzzle dynamically generated every day using a seeded randomizer. Compete against real players and AI competitors on today's leaderboard.
*   **Sudoku Color Hybrid**: A mind-bending variant where block placements must respect Sudoku color-exclusivity rules (no repeating colors in any row, column, or 3x2 sub-grid).

---

## 🚀 Key Upgrades & Professional Features

### 📐 Unified 8x8 Play Board Grid
*   All gameplay layouts are standardized onto a fixed **8x8 board** to provide a consistent visual interface.
*   Puzzles with smaller dimensions (e.g. 3x3, 4x4, or 5x5) are dynamically centered on the board. Unused outer cells are disabled as styled border obstacles.

### 🔐 Supabase-Backed Authentication Proxy
*   **Google OAuth & Email/Password Auth**: Secure sign-up, login, and Google OAuth redirects are routed through backend serverless APIs, keeping your database credentials hidden from the browser.
*   **Multi-User Isolation**: Scores are bound to a persistent `userId` rather than just a display name. This resolves collision issues if multiple players choose identical usernames (like `Player` or `Guest`).
*   **Account Username Sync**: Changing your display name in settings automatically updates all your previous leaderboard ranks and scores.

### ⏱️ 7-Day Free Guest Trial
*   New players can play as guests without an account for 7 days.
*   Upon trial expiration, players are prompted to register/login to keep saving progress and submitting scores, or continue in a restricted "No-Profile" mode.

### 🛡️ Production-Grade Security
*   **IP-Based Rate Limiting**: Built-in sliding-window rate limiters guard API endpoints from abuse and brute-forcing.
*   **Content Hardening**: Custom HTTP headers protect the app from XSS, clickjacking, and content-type sniffing at the CDN level.

---

## 🛠️ Tech Stack

*   **Frontend**: React (Vite), Tailwind CSS v4, Motion (Framer Motion), Recharts.
*   **Backend**: Node.js, Vercel Serverless Functions (`@vercel/node`), Supabase Client.
*   **Database**: PostgreSQL (Supabase) with custom indexes for fast queries.

---

## 💻 Local Development

### Prerequisites
*   Node.js (v18+)
*   Vercel CLI (`npm i -g vercel` or run via `npx vercel`)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` or `.env.local` file in the root directory:
```env
# Supabase credentials (never expose these on the client side!)
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-secret-service-role-key"

# App public URL (used for OAuth redirects)
APP_URL="http://localhost:5173"
```

### 3. Deploy the SQL Schema
Go to your **Supabase Dashboard -> SQL Editor -> New Query**, paste the contents of `supabase/schema.sql`, and click **Run**.

### 4. Run the Dev Server
For full local development with serverless APIs:
```bash
npx vercel dev
```
*(This links to your Vercel project, runs the Vite client, and mounts the `/api` routes locally).*

---

## 📄 Database Schema Summary

The database uses a clean PostgreSQL schema optimized for leaderboard ranking lookups:

*   **`scores` table**: Stores campaign, speedrun, and daily challenges.
    *   Indexed on `(mode, level_id, stars DESC, moves ASC, time ASC)` for Campaign rankings.
    *   Indexed on `(mode, level_id, time ASC, moves ASC)` for Speedrun rankings.
    *   Uses `user_id` to enforce one personal best per user.
*   **`sync_profiles` table**: Temporarily holds cross-device player progress mapping keys.

---

## ☁️ Deployment

Block Fit is configured for instant deployment on **Vercel**:

1.  Connect your GitHub repository to your Vercel account.
2.  Add the environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_URL`) in **Project Settings -> Environment Variables**.
3.  Deploy! The `vercel.json` file in the repository will configure the SPA route mapping, CDN headers, and api endpoints automatically.
