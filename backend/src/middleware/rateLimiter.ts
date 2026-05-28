import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../config/redis';

export async function generationRateLimiter(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const today = new Date().toISOString().split('T')[0];
    const key = `rate_limit:${userId}:${today}`;
    const limit = 5;

    const redisClient = getRedisClient();
    const currentCount = await redisClient.incr(key);

    if (currentCount === 1) {
      await redisClient.expire(key, 86400); // 24 hours
    }

    if (currentCount > limit) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. You can only generate 5 assignments per day.' 
      });
    }

    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open if Redis is down
    next();
  }
}
