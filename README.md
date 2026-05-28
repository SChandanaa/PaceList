# PaceList

PaceList is a Spotify playlist planning app for runners. The frontend lets a
user choose a Spotify playlist, pick a run duration, arrange tracks on a
timeline, and prepare a new playlist to open in Spotify.

## Repository structure

```text
frontend/   React + Vite app for the playlist timeline UI
backend/    Node.js + Express API (Spotify OAuth, timeline, playlist creation)
```

## Development

Install frontend dependencies from the repository root:

```bash
npm install
```

Run the React app:

```bash
npm run dev:frontend
```

Run the backend API (see [backend/README.md](backend/README.md) for Spotify setup):

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Build the frontend:

```bash
npm run build
```
