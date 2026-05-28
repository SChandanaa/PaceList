import app from './app.js';
import { config } from './config.js';

app.listen(config.port, () => {
  console.log(`PaceList backend running on http://localhost:${config.port}`);
  console.log(`Spotify login: http://localhost:${config.port}/auth/login`);
});
