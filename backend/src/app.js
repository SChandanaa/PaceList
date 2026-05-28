import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import playlistRoutes from './routes/playlists.js';
import timelineRoutes from './routes/timeline.js';

const app = express();

app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  })
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'pacelist-backend' });
});

app.use('/auth', authRoutes);
app.use('/playlists', playlistRoutes);
app.use('/timeline', timelineRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
