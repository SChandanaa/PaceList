# PaceList

Build timed run playlists from your Spotify library — pick a playlist, set how long you want to run, adjust the track order on a timeline, and publish a new playlist to Spotify.

## Project structure

```
PaceList/
├── backend/     Node.js + Express API (Spotify OAuth, timeline, playlist creation)
└── README.md
```

## Quick start

1. [Create a Spotify app](https://developer.spotify.com/dashboard) and add redirect URI `http://localhost:3001/auth/callback`
2. Configure and run the backend — see [backend/README.md](backend/README.md)

```bash
cd backend
cp .env.example .env   # add your Spotify Client ID & Secret
npm install
npm run dev
```

3. Log in at `http://localhost:3001/auth/login`

A frontend UI can be added separately; the backend exposes REST endpoints for playlist selection, timeline generation, reordering, and creating playlists in Spotify.
