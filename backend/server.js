import app from './src/app.js';
import env from './src/config/env.js';
import { connectDB } from './src/config/db.js';

const start = async () => {
  try {
    await connectDB();
    app.listen(env.port, () => {
      console.log(`[server] API running on http://localhost:${env.port} (${env.nodeEnv})`);
      console.log(`[server] Gemini AI: ${env.ai.apiKey ? `enabled (model ${env.ai.model})` : 'NOT configured - set GEMINI_API_KEY'}`);
    });
  } catch (err) {
    console.error('[server] Failed to start:', err.message);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));
start();
