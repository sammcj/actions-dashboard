import { log } from "./log";

/**
 * Read-through cache module for caching responses from APIs.
 *
 * Example Usage:
 * const cache = new ResponseCache();
 * const cacheKey = 'my-unqiue-cache-key';
 * const fetchFn = <function that fetches your API response and returns a Promise of ResponseData>
 * const cacheDuration = 300; // Cache duration in seconds
 * const isCacheDisabled = false;
 *
 * cache.cache<ResponseData>(
 *   cacheKey,
 *   fetchFn,
 *   cacheDuration,
 * ).then(data => {
 *   log.debug('Cached data:', data);
 * });
 */

// Define a type for the cache key
type CacheKey = string;

// Define a type for the cache entry
interface CacheEntry<T> {
  data: T;
  expiry: number;
  ttl: number; // Time-to-live in milliseconds
}

// Class representing the response cache
export class ResponseCache {
  private cacheMap: Map<CacheKey, CacheEntry<any>> = new Map();

  /**
   * Manually clear the cache, typically called when the application's config file changes.
   */
  bustCacheOnConfigChange() {
    this.cacheMap.clear();
  }

  /**
   * Caches the response data or retrieves it from cache if available and not expired.
   * @param key - The cache key.
   * @param fetchFunction - The function that returns a Promise representing the data to be fetched.
   * @param cacheDurationSeconds - The duration in seconds for which the data should be cached (default: 300 seconds aka 5 minutes).
   * @param disableCache - A boolean flag to bypass/disable caching (default: false).
   * @param perKeyTTL - Optional time-to-live (TTL) for the specific cache key in milliseconds (default: 0, which means it will use the cacheDurationSeconds value if provided).
   * @returns A Promise that resolves to the response data and a boolean indicating whether the response was loaded from the cache.
   */
  async cache<T>(
    key: CacheKey,
    fetchFunction: () => Promise<T>,
    cacheDurationSeconds: number = 300,
    disableCache: boolean = false,
    perKeyTTL: number = 0,
  ): Promise<[T, boolean]> {
    // Check if caching is disabled
    if (disableCache) {
      return [await fetchFunction(), false]; // Fetch data directly without caching
    }

    // Check if the data is already in the cache and not expired
    const cacheEntry = this.cacheMap.get(key);
    if (cacheEntry && cacheEntry.expiry > Date.now()) {
      return [cacheEntry.data, true]; // Return cached data and indicate that it was loaded from the cache
    }

    // Fetch the data and store it in the cache
    const data = await fetchFunction();
    const expiry = Date.now() + (perKeyTTL || cacheDurationSeconds) * 1000; // Use perKeyTTL if provided, else use cacheDurationSeconds
    this.cacheMap.set(key, { data, expiry, ttl: perKeyTTL });

    log.debug("cache size: " + this.getCacheSize() || 0);

    return [data, false]; // Return fetched data and indicate that it was loaded from the API
  }

  // Clear the cache
  clearCache() {
    this.cacheMap.clear();
    log.debug("cache cleared");
  }

  // Get the size of the cache
  getCacheSize() {
    // output the size of the cache in items
    log.debug("cache items: " + this.cacheMap.size);
    // return the size of the cache in kb
    log.debug(
      "cache size (KB): " + JSON.stringify(this.cacheMap).length / 1024,
    );
  }
}

export const cache = new ResponseCache();
