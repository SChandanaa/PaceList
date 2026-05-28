import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  addTracksToPlaylist,
  createPlaylist,
  ensureValidToken,
  getAllPlaylistTracks,
  getUserPlaylists,
} from '../services/spotify.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const accessToken = await ensureValidToken(req.session);
    const limit = Math.min(Number(req.query.limit) || 50, 50);
    const offset = Number(req.query.offset) || 0;
    const data = await getUserPlaylists(accessToken, limit, offset);

    res.json({
      playlists: data.items.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        imageUrl: p.images?.[0]?.url ?? null,
        trackCount: p.tracks.total,
        owner: p.owner.display_name,
        uri: p.uri,
        externalUrl: p.external_urls.spotify,
      })),
      total: data.total,
      limit: data.limit,
      offset: data.offset,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/:playlistId/tracks', requireAuth, async (req, res) => {
  try {
    const accessToken = await ensureValidToken(req.session);
    const tracks = await getAllPlaylistTracks(accessToken, req.params.playlistId);
    res.json({ tracks });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/create', requireAuth, async (req, res) => {
  const { name, description, trackUris, isPublic } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Playlist name is required' });
  }
  if (!Array.isArray(trackUris) || trackUris.length === 0) {
    return res.status(400).json({ error: 'At least one track URI is required' });
  }

  try {
    const accessToken = await ensureValidToken(req.session);
    const userId = req.session.spotifyUserId;
    const playlist = await createPlaylist(accessToken, userId, {
      name: name.trim(),
      description: description?.trim() || 'Created with PaceList',
      public: isPublic ?? false,
    });

    await addTracksToPlaylist(accessToken, playlist.id, trackUris);

    res.status(201).json({
      id: playlist.id,
      name: playlist.name,
      uri: playlist.uri,
      externalUrl: playlist.external_urls.spotify,
    });
  } catch (err) {
    console.error('Create playlist failed:', err.response?.data ?? err.message);
    res.status(err.status || 500).json({
      error: err.response?.data?.error?.message ?? err.message,
    });
  }
});

export default router;
