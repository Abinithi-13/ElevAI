import 'dotenv/config';

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim()),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/elevator_maintenance',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  ai: {
    apiKey: process.env.GEMINI_API_KEY || '',
    baseUrl: (process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai').replace(/\/$/, ''),
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    fallbackModels: (process.env.GEMINI_FALLBACK_MODELS || 'gemini-3.6-flash').split(',').map((s) => s.trim()).filter(Boolean),
    timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || 60000,
  },
};

if (!env.jwtSecret || env.jwtSecret.length < 16) {
  console.error('[config] JWT_SECRET is missing or too short. Copy .env.example to .env and set a strong secret.');
  process.exit(1);
}

export default env;
