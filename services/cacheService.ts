import { GenAIResponse } from '../types';

const CACHE_KEY = 'toma_query_cache';
const CACHE_EXPIRY_MS = 1000 * 60 * 60 * 24; // 24 hours

interface CacheEntry {
  timestamp: number;
  data: GenAIResponse;
}

export const getCachedResponse = (query: string): GenAIResponse | null => {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (!cacheStr) return null;
    const cache: Record<string, CacheEntry> = JSON.parse(cacheStr);
    const normalizedQuery = query.toLowerCase().trim();
    
    const entry = cache[normalizedQuery];
    if (entry) {
      if (Date.now() - entry.timestamp < CACHE_EXPIRY_MS) {
        return entry.data;
      } else {
        // expired
        delete cache[normalizedQuery];
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      }
    }
  } catch (e) {
    console.error("Cache read error", e);
  }
  return null;
};

export const setCachedResponse = (query: string, data: GenAIResponse) => {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    const cache: Record<string, CacheEntry> = cacheStr ? JSON.parse(cacheStr) : {};
    const normalizedQuery = query.toLowerCase().trim();
    
    // Keep cache size manageable (e.g., max 50 entries)
    const keys = Object.keys(cache);
    if (keys.length > 50) {
       // remove oldest
       const oldestKey = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp)[0];
       delete cache[oldestKey];
    }

    cache[normalizedQuery] = {
      timestamp: Date.now(),
      data
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error("Cache write error", e);
  }
};
