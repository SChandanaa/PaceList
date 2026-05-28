export function secondsToClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatFit(deltaSeconds) {
  const absolute = Math.abs(deltaSeconds);

  if (absolute <= 15) {
    return "Perfect fit";
  }

  return deltaSeconds > 0
    ? `${secondsToClock(absolute)} over`
    : `${secondsToClock(absolute)} short`;
}

export function orderTracksForPace(tracks, goal) {
  const clone = [...tracks];

  if (goal === "tempo" || goal === "recovery") {
    return clone.sort((a, b) => a[3] - b[3]);
  }

  if (goal === "intervals") {
    const fast = clone.filter((track) => track[3] >= 132);
    const steady = clone.filter((track) => track[3] < 132);
    return steady.flatMap((track, index) => [track, fast[index]].filter(Boolean));
  }

  return clone;
}

export function recalculateStarts(tracks) {
  let elapsed = 0;

  return tracks.map((track) => {
    const updatedTrack = { ...track, startsAt: elapsed };
    elapsed += track.duration;
    return updatedTrack;
  });
}

export function createTimeline(playlist, targetMinutes, paceGoal) {
  const targetSeconds = targetMinutes * 60;
  const orderedTracks = orderTracksForPace(playlist.tracks, paceGoal);
  const timeline = [];
  let totalSeconds = 0;
  let index = 0;

  while (totalSeconds < targetSeconds - 20 && index < orderedTracks.length) {
    const [title, artist, duration, bpm] = orderedTracks[index];
    timeline.push({
      id: `${playlist.id}-${title.toLowerCase().replaceAll(" ", "-")}`,
      title,
      artist,
      duration,
      bpm,
      startsAt: totalSeconds,
    });
    totalSeconds += duration;
    index += 1;
  }

  return recalculateStarts(timeline);
}

export function getTimelineTotal(timeline) {
  return timeline.reduce((total, track) => total + track.duration, 0);
}

export function getCoachNote(timeline, paceGoal) {
  const firstTrack = timeline[0];
  const lastTrack = timeline[timeline.length - 1];

  if (!firstTrack || !lastTrack) {
    return "Choose a playlist and run time to see your energy curve.";
  }

  if (lastTrack.bpm > firstTrack.bpm + 8) {
    return "Starts controlled and builds toward a faster finish for a strong final mile.";
  }

  if (paceGoal === "intervals") {
    return "Alternates steady tracks with harder efforts so the music cues your interval changes.";
  }

  if (paceGoal === "recovery") {
    return "Keeps the BPM low and relaxed so the playlist supports an easy recovery run.";
  }

  return "Maintains a steady effort with enough lift in the middle to keep momentum.";
}
