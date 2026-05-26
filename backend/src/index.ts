import cors from 'cors';
import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { connectDatabase } from './config/database';
import { config } from './config/env';
import { createRedisClient } from './config/redis';
import { getGenerationQueue } from './queues/generationQueue';
import { getPdfQueue } from './queues/pdfQueue';
import { startGenerationWorker } from './queues/generationWorker';
import { startPdfWorker } from './queues/pdfWorker';
import assignmentRoutes from './routes/assignments';
import { initWebSocket } from './websocket/socketManager';

async function main(): Promise<void> {
  const app = express();

  app.use(
    cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  const server = http.createServer(app);

  await connectDatabase();
  createRedisClient();
  initWebSocket(server);

  getGenerationQueue();
  getPdfQueue();
  startGenerationWorker();
  startPdfWorker();

  const uploadsDir = path.resolve(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const generatedPdfDir = path.resolve(__dirname, '..', 'generated-pdfs');
  if (!fs.existsSync(generatedPdfDir)) {
    fs.mkdirSync(generatedPdfDir, { recursive: true });
  }

  app.use('/api/assignments', assignmentRoutes);

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  const errorHandler: express.ErrorRequestHandler = (error, _req, res, _next) => {
    console.error('Unhandled error:', (error as Error).message);
    res.status(500).json({
      error: 'Internal server error',
      message:
        config.NODE_ENV === 'development'
          ? (error as Error).message
          : 'Something went wrong',
    });
  };
  app.use(errorHandler);

  server.listen(config.PORT, () => {
    console.log(`VedaAI backend running on http://localhost:${config.PORT}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed');
    });
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

void main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
