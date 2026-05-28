import { Router } from "express";
import { config } from "../config.js";

export const spotifyRoutes = Router();

spotifyRoutes.get("/login", (_request, response) => {
  if (!config.spotify.clientId) {
    response.status(503).json({
      message: "Spotify client ID is not configured.",
    });
    return;
  }

  const params = new URLSearchParams({
    client_id: config.spotify.clientId,
    response_type: "code",
    redirect_uri: config.spotify.redirectUri,
    scope: [
      "playlist-read-private",
      "playlist-read-collaborative",
      "playlist-modify-private",
      "playlist-modify-public",
      "user-read-private",
    ].join(" "),
  });

  response.json({
    authorizationUrl: `https://accounts.spotify.com/authorize?${params.toString()}`,
  });
});

spotifyRoutes.get("/callback", (request, response) => {
  response.json({
    message: "Exchange this authorization code for Spotify tokens.",
    code: request.query.code ?? null,
  });
});

spotifyRoutes.get("/playlists", (_request, response) => {
  response.json({
    message: "Replace this mock with Spotify Web API playlist retrieval.",
    playlists: [],
  });
});

spotifyRoutes.post("/playlists", (request, response) => {
  response.status(201).json({
    message: "Replace this mock with Spotify Web API playlist creation.",
    playlist: {
      name: request.body?.name ?? "PaceList Run",
      tracks: request.body?.tracks ?? [],
    },
  });
});
