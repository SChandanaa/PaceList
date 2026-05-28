export function requireAuth(req, res, next) {
  if (!req.session?.spotify?.accessToken) {
    return res.status(401).json({ error: 'Not authenticated. Visit /auth/login first.' });
  }
  next();
}
