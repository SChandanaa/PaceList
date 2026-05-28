# PaceList Backend

Node.js API for building timed run playlists from your Spotify library. Connect your account, pick a source playlist, set a duration, reorder tracks on a timeline, and publish a new playlist to Spotify.

## Setup

### 1. Spotify Developer App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create an app
3. Add Redirect URI: `http://localhost:3001/auth/callback`
4. Copy **Client ID** and **Client Secret**

### 2. Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your Spotify credentials
npm install
npm run dev
```

Server runs at `http://localhost:3001`.

## API

All authenticated routes require a session cookie (log in via browser first).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/login` | Redirect to Spotify OAuth |
| GET | `/auth/callback` | OAuth callback (handled by Spotify redirect) |
| GET | `/auth/me` | Current user profile |
| POST | `/auth/logout` | End session |
| GET | `/playlists` | List your Spotify playlists |
| GET | `/playlists/:id/tracks` | All tracks in a playlist |
| POST | `/timeline/generate` | Build timeline for a duration |
| POST | `/timeline/reorder` | Recalculate timeline after reorder |
| POST | `/playlists/create` | Create new playlist in Spotify |

### Example flow

**1. Log in** — open `http://localhost:3001/auth/login` in the browser.

**2. List playlists**

```http
GET /playlists
Cookie: connect.sid=...
```

**3. Generate timeline** (e.g. 30-minute run)

```json
POST /timeline/generate
{
  "playlistId": "YOUR_PLAYLIST_ID",
  "durationMinutes": 30
}
```

Response includes tracks with `startMs`, `endMs`, and human-readable labels (`startLabel`, `endLabel`).

**4. Reorder tracks** (send back the new order from your UI)

```json
POST /timeline/reorder
{
  "tracks": [
    { "id": "...", "uri": "spotify:track:...", "durationMs": 210000, "name": "...", ... }
  ]
}
```

**5. Create playlist in Spotify**

```json
POST /playlists/create
{
  "name": "30min Run — May 29",
  "description": "Built with PaceList",
  "isPublic": false,
  "trackUris": ["spotify:track:...", "spotify:track:..."]
}
```

Returns the new playlist URL to open in Spotify.

## Timeline logic

- Tracks are taken **in playlist order** until the target duration is filled.
- Each track gets `startMs` / `endMs` offsets for timeline UI.
- After reordering, call `/timeline/reorder` to refresh offsets before creating the playlist.

## Frontend

Set `FRONTEND_URL` in `.env` to your frontend origin (default `http://localhost:5173`). After login, users are redirected to `{FRONTEND_URL}?authenticated=true`.

Use `credentials: 'include'` on fetch calls so session cookies are sent.
