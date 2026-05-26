import path from 'path';
import dotenv from 'dotenv';

// Load .env from the project root (one level up from backend/)
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

// Fallback: also try backend/.env if root .env doesn't exist
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

export interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  MONGODB_URI: string;
  REDIS_URL: string;
  GOOGLE_GENERATIVE_AI_API_KEY: string;
  CORS_ORIGIN: string;
}

export const config: EnvConfig = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

// Validate required env vars
const requiredVars: (keyof EnvConfig)[] = ['MONGODB_URI', 'REDIS_URL', 'GOOGLE_GENERATIVE_AI_API_KEY'];

for (const varName of requiredVars) {
  if (!config[varName]) {
    console.warn(`⚠️  Warning: Environment variable ${varName} is not set.`);
  }
}

export default config;
