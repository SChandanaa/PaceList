import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { healthRoutes } from "./routes/healthRoutes.js";
import { spotifyRoutes } from "./routes/spotifyRoutes.js";

const app = express();

app.use(
  cors({
    origin: config.frontendOrigin,
  }),
);
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/auth/spotify", spotifyRoutes);
app.use("/api/spotify", spotifyRoutes);

app.listen(config.port, () => {
  console.log(`PaceList API listening on port ${config.port}`);
});
