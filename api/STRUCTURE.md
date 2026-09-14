# API Structure Reference

This document maps the API route structure and file organization.

## Directory Layout

```
api/
├── README.md                 # Main API documentation
├── STRUCTURE.md              # This file
├── types.ts                  # Shared API types and contracts
├── lib/
│   ├── apiResponses.ts       # Response builders (success/error)
│   ├── apiSecurity.ts        # Security headers, CORS, auth guards
│   ├── cors.ts               # CORS policy enforcement
│   ├── rateLimit.ts          # IP-based rate limiting
│   ├── validate.ts           # Input validation helpers
│   └── supabase.ts           # Supabase client initialization
│
├── auth/
│   ├── signup.ts             # POST /api/auth/signup
│   ├── login.ts              # POST /api/auth/login
│   ├── google.ts             # GET /api/auth/google
│   └── callback.ts           # GET /api/auth/callback
│
├── profiles/
│   ├── load.ts               # GET /api/profiles/load
│   ├── save.ts               # POST /api/profiles/save
│   └── delete.ts             # POST /api/profiles/delete
│
├── leaderboards/
│   ├── campaign.ts           # GET /api/leaderboards/campaign
│   ├── speedrun.ts           # GET /api/leaderboards/speedrun
│   ├── daily.ts              # GET /api/leaderboards/daily
│   └── sudoku.ts             # GET /api/leaderboards/sudoku
│
├── challenges/
│   ├── index.ts              # GET /api/challenges/daily
│   ├── submit.ts             # POST /api/challenges/daily/submit
│   ├── contests.ts           # GET /api/challenges/contests
│   └── join.ts               # POST /api/challenges/contests/join
│
├── sync/
│   ├── generate.ts           # POST /api/sync/generate
│   ├── load.ts               # GET /api/sync/load
│   └── save.ts               # POST /api/sync/save
│
└── health.ts                 # GET /api/health
```

## Route Details

### Authentication (`/api/auth/*`)

| Route | Method | File | Purpose |
|-------|--------|------|---------|
| `/auth/signup` | POST | `auth/signup.ts` | Register new account |
| `/auth/login` | POST | `auth/login.ts` | Login with credentials |
| `/auth/google` | GET | `auth/google.ts` | Start Google OAuth flow |
| `/auth/callback` | GET | `auth/callback.ts` | Handle OAuth redirect |

**Rate Limits:**
- signup: 5/hour
- login: 20/hour
- google: 20/hour
- callback: 20/hour

**Authentication:** None (auth routes are public)

### Profiles (`/api/profiles/*`)

| Route | Method | File | Purpose |
|-------|--------|------|---------|
| `/profiles/load` | GET | `profiles/load.ts` | Load user profile |
| `/profiles/save` | POST | `profiles/save.ts` | Save profile changes |
| `/profiles/delete` | POST | `profiles/delete.ts` | Delete account (GDPR) |

**Rate Limits:** 30/min for all

**Authentication:** Required (Bearer token)

### Leaderboards (`/api/leaderboards/*`)

| Route | Method | File | Purpose | Query Params |
|-------|--------|------|---------|--------------|
| `/leaderboards/campaign` | GET | `leaderboards/campaign.ts` | Campaign mode rankings | levelId, limit, offset |
| `/leaderboards/speedrun` | GET | `leaderboards/speedrun.ts` | Speedrun rankings | levelId, limit, offset |
| `/leaderboards/daily` | GET | `leaderboards/daily.ts` | Daily challenge rankings | date, limit, offset |
| `/leaderboards/sudoku` | GET | `leaderboards/sudoku.ts` | Sudoku mode rankings | levelId, limit, offset |

**Rate Limits:** 30/min for all

**Authentication:** Optional (shows player rank if authenticated)

### Challenges (`/api/challenges/*`)

| Route | Method | File | Purpose | Body/Params |
|-------|--------|------|---------|------------|
| `/challenges/daily` | GET | `challenges/index.ts` | Get daily puzzle | date? (YYYY-MM-DD) |
| `/challenges/daily/submit` | POST | `challenges/submit.ts` | Submit daily result | moves, time, stars |
| `/challenges/contests` | GET | `challenges/contests.ts` | List contests | limit, offset |
| `/challenges/contests/join` | POST | `challenges/join.ts` | Join contest | contestId |

**Rate Limits:** 
- daily GET: 30/min
- daily POST: 20/min (1 per user per day)
- contests: 30/min

**Authentication:** Required for submit/join, optional for GET

### Sync (`/api/sync/*`)

| Route | Method | File | Purpose | Body/Params |
|-------|--------|------|---------|------------|
| `/sync/generate` | POST | `sync/generate.ts` | Create sync code | userId |
| `/sync/load` | GET | `sync/load.ts` | Load by code | code (query) |
| `/sync/save` | POST | `sync/save.ts` | Save with code | code, profile |

**Rate Limits:**
- generate: 10/hour
- load: 30/min
- save: 30/min

**Authentication:** Optional (userId validation for generate)

### Health (`/api/health`)

| Route | Method | File | Purpose |
|-------|--------|------|---------|
| `/health` | GET | `health.ts` | Health check |

**Response:** `{ status: "ok", time: "..." }`

**No Rate Limit:** For monitoring only

---

## Middleware Stack Order

Every route applies this middleware stack:

1. **CORS Validation** (`applyCors`)
   - Check origin whitelist
   - Handle OPTIONS preflight
   - Set CORS headers

2. **Security Headers** (`setSecurityHeaders` via `applySecurityGuards`)
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection: 1; mode=block

3. **Rate Limiting** (`isRateLimited`)
   - Per-IP sliding window
   - Configurable threshold per route

4. **Input Validation** (route-specific)
   - Type checking (assertString, assertInt, etc.)
   - Sanitization
   - Length constraints

5. **Business Logic**
   - Database operations
   - Supabase queries
   - Calculations

---

## Error Response Codes

| Code | HTTP | Meaning |
|------|------|---------|
| 200 | OK | Success |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Auth required or failed |
| 403 | Forbidden | Auth succeeded but access denied |
| 404 | Not Found | Resource not found |
| 405 | Method Not Allowed | Wrong HTTP method |
| 429 | Too Many Requests | Rate limited |
| 500 | Server Error | Unexpected error |

---

## Database Integration

All routes use Supabase with:

### Connection
- **Service Role Key** (server-side only, never exposed to client)
- **Connection Pool** (via Supabase client)
- **Environment Variables:**
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Security
- **Row Level Security (RLS)** on all tables
- **Public Read:** Leaderboards, profiles (public data only)
- **Service Role Write:** All write operations

### Tables Used
- `auth.users`: Supabase auth (managed by Supabase)
- `profiles`: User profile data
- `scores`: Game scores/leaderboards
- `sync_profiles`: Temporary sync codes
- `achievements`: Achievement definitions (future)
- `contests`: Contest metadata (future)

---

## Common Utilities

### Response Builders (`api/lib/apiResponses.ts`)

```typescript
sendSuccess(res, data, 200);
sendError(res, message, 400, 'ERROR_CODE');
sendValidationError(res, 'fieldName', 'reason');
sendNotFound(res, 'resource');
sendUnauthorized(res);
sendRateLimited(res, retryAfter);
```

### Validation (`api/lib/validate.ts`)

```typescript
assertString(val, fieldName, res, maxLen);
assertInt(val, fieldName, res, min, max);
assertDate(val, fieldName, res);
assertSyncCode(val, fieldName, res);
assertStars(val, res);
assertMoves(val, res);
assertTime(val, res);
```

### Security (`api/lib/apiSecurity.ts`)

```typescript
applySecurityGuards(req, res);    // Headers + CORS
applyCors(req, res);              // CORS only
setSecurityHeaders(res);          // Headers only
```

### Rate Limiting (`api/lib/rateLimit.ts`)

```typescript
isRateLimited(req, res, requestsPerMinute);
```

---

## Local Development

### Start Dev Server

```bash
npx vercel dev
```

This mounts all routes at `http://localhost:3000/api/*`

### Test a Route

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "secure123",
    "username": "testuser"
  }'
```

### Environment Setup

Create `.env.local`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sbp_xxx...
APP_URL=http://localhost:5173
```

---

## Deployment

Vercel automatically:
1. Detects `/api` directory
2. Creates serverless function for each `.ts` file
3. Routes requests based on file path
4. Sets environment variables from project settings
5. Scales functions independently

**No additional deployment config needed.**
