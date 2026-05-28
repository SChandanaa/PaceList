# PaceList

PaceList is a Spotify playlist planning app for runners. The frontend lets a
user choose a Spotify playlist, pick a run duration, arrange tracks on a
timeline, and prepare a new playlist to open in Spotify. The backend folder is
scaffolded for Spotify OAuth, playlist reads, and playlist creation.

## Repository structure

```text
frontend/   React + Vite app for the playlist timeline UI
backend/    Node.js + Express API scaffold for Spotify integration
```

## Development

Install dependencies once from the repository root:

```bash
npm install
```

Run the React app:

```bash
npm run dev:frontend
```

Run the Node API:

```bash
npm run dev:backend
```

Build the frontend:

```bash
npm run build
```

## Backend configuration

Copy `backend/.env.example` to `backend/.env` and fill in Spotify credentials
before wiring real Spotify OAuth and Web API requests.
