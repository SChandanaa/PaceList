import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { ensureValidToken, getAllPlaylistTracks } from '../services/spotify.js';
import { buildTimeline, formatMs, reorderTimeline } from '../services/timeline.js';

const router = Router();

router.post('/generate', requireAuth, async (req, res) => {
  const { playlistId, durationMinutes } = req.body;

  if (!playlistId) {
    return res.status(400).json({ error: 'playlistId is required' });
  }
  if (!durationMinutes || durationMinutes <= 0) {
    return res.status(400).json({ error: 'durationMinutes must be a positive number' });
  }

  try {
    const accessToken = await ensureValidToken(req.session);
    const sourceTracks = await getAllPlaylistTracks(accessToken, playlistId);
    const timeline = buildTimeline(sourceTracks, Number(durationMinutes));

    res.json({
      ...timeline,
      targetDurationLabel: formatMs(timeline.targetDurationMs),
      filledDurationLabel: formatMs(timeline.filledDurationMs),
      remainingLabel: formatMs(timeline.remainingMs),
      tracks: timeline.tracks.map((t) => ({
        ...t,
        startLabel: formatMs(t.startMs),
        endLabel: formatMs(t.endMs),
        durationLabel: formatMs(t.durationMs),
      })),
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/reorder', requireAuth, (req, res) => {
  const { tracks } = req.body;

  if (!Array.isArray(tracks) || tracks.length === 0) {
    return res.status(400).json({ error: 'tracks array is required' });
  }

  for (const track of tracks) {
    if (!track.id || !track.uri || typeof track.durationMs !== 'number') {
      return res.status(400).json({
        error: 'Each track must include id, uri, and durationMs',
      });
    }
  }

  const timeline = reorderTimeline(tracks);

  res.json({
    ...timeline,
    filledDurationLabel: formatMs(timeline.filledDurationMs),
    tracks: timeline.tracks.map((t) => ({
      ...t,
      startLabel: formatMs(t.startMs),
      endLabel: formatMs(t.endMs),
      durationLabel: formatMs(t.durationMs),
    })),
  });
});

export default router;
