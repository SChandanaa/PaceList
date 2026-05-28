import { Router } from 'express';
import crypto from 'crypto';
import { config } from '../config.js';
import {
  exchangeCodeForTokens,
  getCurrentUser,
  getLoginUrl,
} from '../services/spotify.js';

const router = Router();

router.get('/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  req.session.oauthState = state;
  res.redirect(getLoginUrl(state));
});

router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${config.frontendUrl}?error=${encodeURIComponent(String(error))}`);
  }

  if (!code || state !== req.session.oauthState) {
    return res.status(400).json({ error: 'Invalid OAuth callback' });
  }

  try {
    const tokens = await exchangeCodeForTokens(String(code));
    req.session.spotify = tokens;
    delete req.session.oauthState;

    const user = await getCurrentUser(tokens.accessToken);
    req.session.spotifyUserId = user.id;

    res.redirect(`${config.frontendUrl}?authenticated=true`);
  } catch (err) {
    console.error('OAuth callback failed:', err.message);
    res.redirect(`${config.frontendUrl}?error=auth_failed`);
  }
});

router.get('/me', async (req, res) => {
  if (!req.session?.spotify?.accessToken) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const user = await getCurrentUser(req.session.spotify.accessToken);
    res.json({
      authenticated: true,
      user: {
        id: user.id,
        displayName: user.display_name,
        email: user.email,
        imageUrl: user.images?.[0]?.url ?? null,
      },
    });
  } catch {
    res.status(401).json({ authenticated: false });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

export default router;
