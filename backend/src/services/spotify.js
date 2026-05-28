import axios from 'axios';
import { config } from '../config.js';

const SPOTIFY_ACCOUNTS = 'https://accounts.spotify.com';
const SPOTIFY_API = 'https://api.spotify.com/v1';

export function getLoginUrl(state) {
  const params = new URLSearchParams({
    client_id: config.spotify.clientId,
    response_type: 'code',
    redirect_uri: config.spotify.redirectUri,
    scope: config.spotify.scopes,
    state,
    show_dialog: 'true',
  });

  return `${SPOTIFY_ACCOUNTS}/authorize?${params}`;
}

export async function exchangeCodeForTokens(code) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.spotify.redirectUri,
  });

  const { data } = await axios.post(`${SPOTIFY_ACCOUNTS}/api/token`, body, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${config.spotify.clientId}:${config.spotify.clientSecret}`
      ).toString('base64')}`,
    },
  });

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const { data } = await axios.post(`${SPOTIFY_ACCOUNTS}/api/token`, body, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${config.spotify.clientId}:${config.spotify.clientSecret}`
      ).toString('base64')}`,
    },
  });

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

function spotifyClient(accessToken) {
  return axios.create({
    baseURL: SPOTIFY_API,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function getCurrentUser(accessToken) {
  const client = spotifyClient(accessToken);
  const { data } = await client.get('/me');
  return data;
}

export async function getUserPlaylists(accessToken, limit = 50, offset = 0) {
  const client = spotifyClient(accessToken);
  const { data } = await client.get('/me/playlists', {
    params: { limit, offset },
  });
  return data;
}

export async function getAllPlaylistTracks(accessToken, playlistId) {
  const client = spotifyClient(accessToken);
  const tracks = [];
  let url = `/playlists/${playlistId}/tracks`;
  let params = { limit: 100, fields: 'items(track(id,name,duration_ms,artists(name),album(name,images))),next' };

  while (url) {
    const { data } = await client.get(url, url.startsWith('http') ? undefined : { params });
    for (const item of data.items ?? []) {
      if (item.track?.id) {
        tracks.push(normalizeTrack(item.track));
      }
    }
    if (data.next) {
      url = data.next.replace(SPOTIFY_API, '');
      params = undefined;
    } else {
      url = null;
    }
  }

  return tracks;
}

export async function createPlaylist(accessToken, userId, { name, description, public: isPublic }) {
  const client = spotifyClient(accessToken);
  const { data } = await client.post(`/users/${userId}/playlists`, {
    name,
    description,
    public: isPublic ?? false,
  });
  return data;
}

export async function addTracksToPlaylist(accessToken, playlistId, trackUris) {
  const client = spotifyClient(accessToken);
  const batchSize = 100;

  for (let i = 0; i < trackUris.length; i += batchSize) {
    const uris = trackUris.slice(i, i + batchSize);
    await client.post(`/playlists/${playlistId}/tracks`, { uris });
  }
}

function normalizeTrack(track) {
  return {
    id: track.id,
    uri: `spotify:track:${track.id}`,
    name: track.name,
    durationMs: track.duration_ms,
    artists: track.artists.map((a) => a.name).join(', '),
    album: track.album?.name ?? '',
    imageUrl: track.album?.images?.[0]?.url ?? null,
  };
}

export async function ensureValidToken(session) {
  if (!session.spotify) {
    throw Object.assign(new Error('Not authenticated'), { status: 401 });
  }

  if (Date.now() < session.spotify.expiresAt - 60_000) {
    return session.spotify.accessToken;
  }

  const tokens = await refreshAccessToken(session.spotify.refreshToken);
  session.spotify = { ...session.spotify, ...tokens };
  return tokens.accessToken;
}
