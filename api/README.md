# Block Fit API Structure

## Organization

The API is organized by domain/feature rather than by HTTP method. Each domain has its own folder with related routes.

```
api/
├── auth/                    # Authentication & user management
├── profiles/                # User profile CRUD
├── leaderboards/            # Leaderboard queries
├── challenges/              # Daily challenges and contests
├── sync/                    # Cross-device sync
└── health.ts                # Health check endpoint
```

## Patterns

### 1. Route Structure

Each route is an async handler following Vercel Serverless conventions:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Middleware
  if (applySecurityGuards(req, res)) return;
  if (isRateLimited(req, res, 20)) return;

  // Method validation
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
    return;
  }

  // Input validation
  const { field } = req.body ?? {};
  if (!field) {
    res.status(400).json({ error: 'field is required' });
    return;
  }

  try {
    // Business logic
    const result = await businessLogic(field);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('[route] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### 2. Security

All routes apply:
- **Security Headers**: XSS protection, frame options, content type sniffing
- **Rate Limiting**: IP-based sliding window (configurable per route)
- **Input Validation**: Type checking and sanitization
- **CORS**: Whitelist-based origin checking

### 3. Error Handling

Standardized response format:

```typescript
// Success
{ success: true, data: {...} }

// Error
{ error: "Human-readable error message", code?: "ERROR_CODE" }
```

### 4. Database Access

All database calls:
- Use Supabase service-role key (server-side only)
- Use Row-Level Security policies (public read, service-role write)
- Include error logging with context
- Handle transaction rollback on failure

---

## Domain: Authentication (`/api/auth/*`)

Handles user registration, login, and OAuth.

### Routes

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/callback` | OAuth callback handler |

### Rate Limits
- signup: 5 req/hour
- login: 20 req/hour
- callback: 20 req/hour

---

## Domain: Profiles (`/api/profiles/*`)

Handles user profile data (progress, settings, achievements).

### Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/profiles/load` | Load user profile |
| POST | `/api/profiles/save` | Save user profile |
| POST | `/api/profiles/delete` | Delete profile (GDPR) |

### Rate Limits
- All: 30 req/min

### Database Tables
- `profiles`: User profile data
  - Columns: user_id, email, username, profile_data (JSONB), created_at, updated_at

---

## Domain: Leaderboards (`/api/leaderboards/*`)

Handles leaderboard queries across game modes.

### Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/leaderboards/campaign` | Campaign leaderboard |
| GET | `/api/leaderboards/speedrun` | Speedrun leaderboard |
| GET | `/api/leaderboards/daily` | Daily challenge leaderboard |
| GET | `/api/leaderboards/sudoku` | Sudoku mode leaderboard |

### Query Parameters
- `levelId` (required): Level ID
- `limit` (optional): Max results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `date` (optional): For daily challenges (YYYY-MM-DD)

### Rate Limits
- All: 30 req/min

### Database Tables
- `scores`: All score submissions
  - Columns: id, username, user_id, mode, level_id, stars, moves, time, challenge_date, created_at
  - Indexes: (mode, level_id, stars DESC, moves ASC, time ASC)

---

## Domain: Challenges (`/api/challenges/*`)

Handles daily challenges and contest management.

### Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/challenges/daily` | Get daily challenge puzzle |
| POST | `/api/challenges/daily/submit` | Submit daily challenge result |
| GET | `/api/challenges/contests` | List active contests |
| POST | `/api/challenges/contests/join` | Join contest |

### Rate Limits
- daily: 30 req/min
- submit: 20 req/min (1 per user per day)
- contests: 30 req/min

### Query Parameters (daily)
- `date` (optional): Challenge date (YYYY-MM-DD, defaults to today)

### Request Body (submit)
```typescript
{
  date: string;           // YYYY-MM-DD
  moves: number;          // Number of moves taken
  time: number;           // Seconds elapsed
  stars: number;          // 1-3 stars
  placement: PlacedBlock[]; // Solution (optional, for validation)
}
```

---

## Domain: Sync (`/api/sync/*`)

Handles cross-device profile synchronization.

### Routes

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/sync/generate` | Generate sync code (24h expiry) |
| GET | `/api/sync/load` | Load profile by sync code |
| POST | `/api/sync/save` | Save profile with sync code |

### Rate Limits
- generate: 10 req/hour
- load: 30 req/min
- save: 30 req/min

### Database Tables
- `sync_profiles`: Temporary sync codes
  - Columns: code, profile (JSONB), created_at, updated_at
  - Expiry: 24 hours (via scheduled job)

---

## Health Check (`/api/health`)

Simple health check for monitoring.

```bash
GET /api/health
→ { status: "ok" }
```

---

## Middleware Stack

Each route applies this middleware stack in order:

1. **CORS Check** (`applyCors`)
   - Validate origin against whitelist
   - Set CORS headers

2. **Security Headers** (`setSecurityHeaders`)
   - X-Frame-Options
   - X-Content-Type-Options
   - X-XSS-Protection
   - Strict-Transport-Security

3. **Rate Limiting** (`isRateLimited`)
   - Per-IP sliding window
   - Configurable per route

4. **Input Validation** (`assertString`, `assertInt`, etc.)
   - Type checking
   - Length validation
   - Sanitization

5. **Error Handling**
   - Consistent error responses
   - Logging with context
   - No stack trace leaking

---

## Common Patterns

### Pagination

```typescript
const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
const offset = parseInt(req.query.offset as string) || 0;

const { data, error } = await supabase
  .from('scores')
  .select('*')
  .limit(limit)
  .offset(offset);
```

### Filtering by Mode

```typescript
const { data, error } = await supabase
  .from('scores')
  .select('*')
  .eq('mode', 'campaign')
  .eq('level_id', levelId);
```

### Sorting/Ranking

```typescript
.order('stars', { ascending: false })
.order('moves', { ascending: true })
.order('time', { ascending: true })
```

### Error Handling

```typescript
if (error) {
  console.error('[route] Database error:', error.message);
  return res.status(500).json({ error: 'Database query failed' });
}
```

### Response Format

```typescript
// Success with data
res.status(200).json({
  success: true,
  data: { ...payload }
});

// Error
res.status(400).json({
  error: 'Human-readable error message',
  code: 'ERROR_CODE' // optional, for client handling
});
```

---

## Testing

### Local Development

```bash
npx vercel dev
```

This mounts all `/api` routes locally with hot reload.

### Testing Routes

```bash
# Health check
curl http://localhost:3000/api/health

# With authentication
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/profiles/load

# With rate limiting
for i in {1..25}; do curl http://localhost:3000/api/health; done
# Should fail on 21st request (20 req/min limit)
```

---

## Deployment

Routes are deployed to Vercel with environment variables:

```env
SUPABASE_URL=https://project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sbp_xxx...
APP_URL=https://blockfit.app
```

Each request is isolated and stateless. No shared memory between requests.
