/**
 * Server-side cache middleware for expensive API routes
 * Provides in-memory caching with TTL to reduce redundant calculations
 */

import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Cache middleware with configurable TTL
 * @param duration Cache duration in seconds (default: 30)
 */
export const cacheMiddleware = (duration: number = 30) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.originalUrl || req.url;
    const now = Date.now();
    
    // Check for cached data
    const cached = cache.get(key);
    if (cached && (now - cached.timestamp) < (duration * 1000)) {
      console.log(`[Cache HIT] ${key}`);
      res.json(cached.data);
      return;
    }
    
    console.log(`[Cache MISS] ${key}`);
    
    // Intercept res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Cache the response
      cache.set(key, {
        data: body,
        timestamp: now
      });
      
      // Return original response
      return originalJson(body);
    };
    
    next();
  };
};

/**
 * Clear cache for a specific key or all cache
 * @param key Optional cache key to clear
 */
export const clearCache = (key?: string): void => {
  if (key) {
    cache.delete(key);
    console.log(`[Cache CLEAR] ${key}`);
  } else {
    cache.clear();
    console.log('[Cache CLEAR] All cache cleared');
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
};
