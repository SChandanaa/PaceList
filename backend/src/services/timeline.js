/**
 * Build a timeline of tracks that fit within a target duration.
 * Tracks are taken in playlist order until the budget is exhausted.
 */
export function buildTimeline(tracks, durationMinutes) {
  const targetMs = durationMinutes * 60 * 1000;
  const selected = [];
  let elapsedMs = 0;

  for (const track of tracks) {
    if (elapsedMs + track.durationMs > targetMs) {
      break;
    }
    selected.push({
      ...track,
      startMs: elapsedMs,
      endMs: elapsedMs + track.durationMs,
    });
    elapsedMs += track.durationMs;
  }

  return {
    targetDurationMs: targetMs,
    filledDurationMs: elapsedMs,
    remainingMs: Math.max(0, targetMs - elapsedMs),
    tracks: selected,
  };
}

/**
 * Recompute start/end offsets after the user reorders tracks.
 */
export function reorderTimeline(tracks) {
  let elapsedMs = 0;
  const reordered = tracks.map((track) => {
    const entry = {
      ...track,
      startMs: elapsedMs,
      endMs: elapsedMs + track.durationMs,
    };
    elapsedMs += track.durationMs;
    return entry;
  });

  return {
    filledDurationMs: elapsedMs,
    tracks: reordered,
  };
}

export function formatMs(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
