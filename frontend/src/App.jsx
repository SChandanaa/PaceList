import { useMemo, useState } from "react";
import { playlists } from "./data/playlists.js";
import {
  createTimeline,
  formatFit,
  getCoachNote,
  getTimelineTotal,
  recalculateStarts,
  secondsToClock,
} from "./utils/playlistPlanner.js";

const DEFAULT_TARGET_MINUTES = 45;

export default function App() {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(playlists[0].id);
  const [targetMinutes, setTargetMinutes] = useState(DEFAULT_TARGET_MINUTES);
  const [playlistName, setPlaylistName] = useState("Saturday 45 Minute Run");
  const [paceGoal, setPaceGoal] = useState("steady");
  const [toast, setToast] = useState("");
  const selectedPlaylist = useMemo(
    () => playlists.find((playlist) => playlist.id === selectedPlaylistId),
    [selectedPlaylistId],
  );
  const generatedTimeline = useMemo(
    () => createTimeline(selectedPlaylist, targetMinutes, paceGoal),
    [paceGoal, selectedPlaylist, targetMinutes],
  );
  const [manualTimeline, setManualTimeline] = useState(null);
  const timeline = manualTimeline ?? generatedTimeline;
  const totalSeconds = getTimelineTotal(timeline);
  const targetSeconds = targetMinutes * 60;
  const fitDelta = totalSeconds - targetSeconds;
  const progress = Math.min((totalSeconds / targetSeconds) * 100, 100);
  const spotifySearchUrl = `https://open.spotify.com/search/${encodeURIComponent(
    playlistName || "PaceList Run",
  )}`;

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  function regenerateTimeline(event) {
    event.preventDefault();
    setManualTimeline(null);
    showToast("Timeline generated from your Spotify playlist.");
  }

  function choosePlaylist(playlistId) {
    setSelectedPlaylistId(playlistId);
    setManualTimeline(null);
  }

  function updatePaceGoal(goal) {
    setPaceGoal(goal);
    setManualTimeline(null);
  }

  function moveTrack(trackId, direction) {
    const currentIndex = timeline.findIndex((track) => track.id === trackId);
    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (nextIndex < 0 || nextIndex >= timeline.length) {
      return;
    }

    const nextTimeline = [...timeline];
    const [track] = nextTimeline.splice(currentIndex, 1);
    nextTimeline.splice(nextIndex, 0, track);
    setManualTimeline(recalculateStarts(nextTimeline));
  }

  function smartShuffle() {
    const sorted = [...timeline].sort((a, b) => a.bpm - b.bpm);
    const openingEnd = Math.ceil(sorted.length / 3);
    const middleEnd = Math.ceil((sorted.length / 3) * 2);
    const opening = sorted.slice(0, openingEnd);
    const middle = sorted.slice(openingEnd, middleEnd);
    const finish = sorted.slice(middleEnd);

    setManualTimeline(recalculateStarts([...opening, ...middle.reverse(), ...finish]));
    showToast("Timeline reordered with a stronger finish.");
  }

  function handleDrop(event, targetTrackId) {
    event.preventDefault();
    const draggedTrackId = event.dataTransfer.getData("text/plain");

    if (!draggedTrackId || draggedTrackId === targetTrackId) {
      return;
    }

    const nextTimeline = [...timeline];
    const fromIndex = nextTimeline.findIndex((track) => track.id === draggedTrackId);
    const toIndex = nextTimeline.findIndex((track) => track.id === targetTrackId);
    const [track] = nextTimeline.splice(fromIndex, 1);
    nextTimeline.splice(toIndex, 0, track);
    setManualTimeline(recalculateStarts(nextTimeline));
  }

  function createInSpotify() {
    showToast("Playlist ready. Opening Spotify preview link.");
    window.open(spotifySearchUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <div className="app-shell">
        <aside className="sidebar" aria-label="Spotify account and playlist sources">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              P
            </span>
            <div>
              <p className="eyebrow">Spotify companion</p>
              <h1>PaceList</h1>
            </div>
          </div>

          <section className="connect-card" aria-labelledby="connect-title">
            <div>
              <p className="eyebrow">Step 1</p>
              <h2 id="connect-title">Connect your Spotify</h2>
              <p>
                Pick a playlist, set your run time, then turn the timeline into a
                brand new Spotify playlist.
              </p>
            </div>
            <button
              className="spotify-button"
              type="button"
              onClick={() => showToast("Spotify OAuth will start here once credentials are configured.")}
            >
              <span aria-hidden="true"></span>
              Connect Spotify
            </button>
          </section>

          <section className="account-card" aria-label="Connected account">
            <img
              src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=160&q=80"
              alt=""
            />
            <div>
              <p className="eyebrow">Connected as</p>
              <strong>Alex Runner</strong>
              <span>Premium account</span>
            </div>
          </section>

          <section aria-labelledby="playlist-title" className="playlist-section">
            <div className="section-heading">
              <p className="eyebrow">Step 2</p>
              <h2 id="playlist-title">Choose playlist</h2>
            </div>
            <div className="playlist-list">
              {playlists.map((playlist) => (
                <PlaylistButton
                  key={playlist.id}
                  playlist={playlist}
                  isSelected={playlist.id === selectedPlaylistId}
                  onSelect={choosePlaylist}
                />
              ))}
            </div>
          </section>
        </aside>

        <main className="workspace">
          <header className="hero">
            <div>
              <p className="eyebrow">Run-ready playlist designer</p>
              <h2>Build a Spotify playlist that ends when your run does.</h2>
              <p>
                PaceList lays tracks onto a timeline, highlights gaps or overrun,
                and lets you tune the order before saving it back to Spotify.
              </p>
            </div>
            <div className="hero-metric" aria-label="Current timeline length">
              <span>{targetMinutes}</span>
              <small>minutes planned</small>
            </div>
          </header>

          <section className="planner-grid">
            <form className="planner-card" onSubmit={regenerateTimeline}>
              <div className="section-heading">
                <p className="eyebrow">Step 3</p>
                <h2>Set run details</h2>
              </div>

              <label htmlFor="runLength">Run time</label>
              <div className="duration-control">
                <input
                  type="range"
                  id="runLength"
                  name="runLength"
                  min="15"
                  max="120"
                  step="5"
                  value={targetMinutes}
                  onChange={(event) => {
                    setTargetMinutes(Number(event.target.value));
                    setManualTimeline(null);
                  }}
                />
                <output htmlFor="runLength">{targetMinutes} min</output>
              </div>

              <div className="field-row">
                <label>
                  Playlist name
                  <input
                    type="text"
                    value={playlistName}
                    onChange={(event) => setPlaylistName(event.target.value)}
                    autoComplete="off"
                  />
                </label>
                <label>
                  Pace goal
                  <select value={paceGoal} onChange={(event) => updatePaceGoal(event.target.value)}>
                    <option value="steady">Steady run</option>
                    <option value="tempo">Tempo finish</option>
                    <option value="intervals">Intervals</option>
                    <option value="recovery">Recovery</option>
                  </select>
                </label>
              </div>

              <button className="primary-action" type="submit">
                Generate timeline
              </button>
            </form>

            <section className="summary-card" aria-labelledby="summary-title">
              <div className="section-heading">
                <p className="eyebrow">Timeline fit</p>
                <h2 id="summary-title">Ready to tune</h2>
              </div>
              <dl>
                <div>
                  <dt>Selected playlist</dt>
                  <dd>{selectedPlaylist.title}</dd>
                </div>
                <div>
                  <dt>Tracks</dt>
                  <dd>{timeline.length}</dd>
                </div>
                <div>
                  <dt>Total length</dt>
                  <dd>{secondsToClock(totalSeconds)}</dd>
                </div>
                <div>
                  <dt>Fit</dt>
                  <dd className={Math.abs(fitDelta) <= 15 ? "fit-good" : fitDelta > 0 ? "fit-over" : "fit-short"}>
                    {formatFit(fitDelta)}
                  </dd>
                </div>
              </dl>
            </section>
          </section>

          <section className="timeline-section" aria-labelledby="timeline-title">
            <div className="timeline-toolbar">
              <div>
                <p className="eyebrow">Step 4</p>
                <h2 id="timeline-title">Adjust timeline order</h2>
              </div>
              <div className="toolbar-actions">
                <button type="button" className="ghost-button" onClick={smartShuffle}>
                  Smart shuffle
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    setManualTimeline(null);
                    showToast("Timeline reset to the generated order.");
                  }}
                >
                  Reset order
                </button>
              </div>
            </div>

            <div className="progress-wrap" aria-label="Timeline progress">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="progress-labels">
                <span>0:00</span>
                <span>{secondsToClock(targetSeconds)} target</span>
              </div>
            </div>

            <ol className="track-list">
              {timeline.map((track, index) => (
                <TrackItem
                  key={track.id}
                  track={track}
                  index={index}
                  onMove={moveTrack}
                  onDrop={handleDrop}
                />
              ))}
            </ol>
          </section>
        </main>

        <aside className="publish-panel" aria-label="Create Spotify playlist">
          <section className="phone-preview">
            <div className="phone-topbar"></div>
            <div className="cover-art" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p className="eyebrow">New Spotify playlist</p>
            <h2>{playlistName || "Untitled Run Playlist"}</h2>
            <p>
              {timeline.length} tracks | {Math.round(totalSeconds / 60)} min
            </p>
            <button className="primary-action" type="button" onClick={createInSpotify}>
              Create in Spotify
            </button>
            <a className="spotify-link" href={spotifySearchUrl} target="_blank" rel="noreferrer">
              Open Spotify preview
            </a>
          </section>

          <section className="insight-card" aria-labelledby="insight-title">
            <p className="eyebrow">Coach notes</p>
            <h2 id="insight-title">Energy curve</h2>
            <p>{getCoachNote(timeline, paceGoal)}</p>
          </section>
        </aside>
      </div>

      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </>
  );
}

function PlaylistButton({ playlist, isSelected, onSelect }) {
  const initials = playlist.title
    .split(" ")
    .map((word) => word[0])
    .join("");

  return (
    <button
      className="playlist-button"
      type="button"
      aria-pressed={isSelected}
      onClick={() => onSelect(playlist.id)}
    >
      <span
        className="playlist-cover"
        style={{ "--cover-a": playlist.colors[0], "--cover-b": playlist.colors[1] }}
        aria-hidden="true"
      >
        {initials}
      </span>
      <span>
        <strong>{playlist.title}</strong>
        <span>{playlist.description}</span>
      </span>
      <span className="playlist-count">{playlist.tracks.length}</span>
    </button>
  );
}

function TrackItem({ track, index, onMove, onDrop }) {
  return (
    <li
      className="track-item"
      draggable="true"
      onDragStart={(event) => event.dataTransfer.setData("text/plain", track.id)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => onDrop(event, track.id)}
    >
      <div className="track-main">
        <span className="track-position">{index + 1}</span>
        <div className="track-info">
          <strong>{track.title}</strong>
          <span>
            {track.artist} | starts {secondsToClock(track.startsAt)}
          </span>
        </div>
      </div>
      <div className="track-actions">
        <span className="track-pill">{secondsToClock(track.duration)}</span>
        <span className="track-pill">{track.bpm} BPM</span>
        <button
          className="icon-button"
          type="button"
          onClick={() => onMove(track.id, "up")}
          aria-label={`Move ${track.title} earlier`}
        >
          Up
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => onMove(track.id, "down")}
          aria-label={`Move ${track.title} later`}
        >
          Down
        </button>
      </div>
    </li>
  );
}
