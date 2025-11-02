import memoizee from 'memoizee';

// Cache configuration
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes in milliseconds
const CACHE_TTL_SHORT = 30 * 1000; // 30 seconds for WebSocket updates
const CACHE_TTL_STALE = 10 * 60 * 1000; // 10 minutes for stale data (fallback) - reduced from 30
const CACHE_MAX_SIZE = 100; // Maximum number of cached items
const STALE_CACHE_MAX_SIZE = 200; // Maximum stale cache entries

// Track cache sizes manually
let cacheStats = {
  cryptoList: 0,
  singleCrypto: 0,
  ohlc: 0,
};

// Stale cache for fallback when API fails
const staleCache = new Map<string, { data: any; timestamp: number }>();

// Helper to evict old stale entries (prevent memory leak)
function evictStaleCache(): void {
  if (staleCache.size <= STALE_CACHE_MAX_SIZE) return;
  
  // Sort by timestamp and remove oldest 20%
  const entries = Array.from(staleCache.entries());
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
  
  const toRemove = Math.floor(entries.length * 0.2);
  for (let i = 0; i < toRemove; i++) {
    staleCache.delete(entries[i][0]);
  }
  
  console.log(`[Cache] Evicted ${toRemove} stale entries, now ${staleCache.size} entries`);
}

// Helper to get stale data
function getStaleData(key: string): any | null {
  const cached = staleCache.get(key);
  if (!cached) return null;
  
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL_STALE) {
    staleCache.delete(key);
    return null;
  }
  
  return cached.data;
}

// Helper to set stale data
function setStaleData(key: string, data: any): void {
  staleCache.set(key, { data, timestamp: Date.now() });
  evictStaleCache(); // Evict if needed
}

// Helper: Fetch crypto data from CoinGecko with cache
const fetchCryptoDataCachedBase = memoizee(
  async (limit: number = 100) => {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h,7d`
    );
    if (!response.ok) {
      const text = await response.text();
      console.error(`CoinGecko API error (${response.status}):`, text);
      
      // On rate limit, throw a specific error
      if (response.status === 429) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      
      throw new Error(`Failed to fetch crypto data: ${response.status} ${response.statusText}`);
    }
    console.log(`[Cache] Fetched fresh crypto list data (limit: ${limit})`);
    cacheStats.cryptoList++;
    const data = await response.json();
    
    // Save to stale cache
    setStaleData(`cryptoList:${limit}`, data);
    
    return data;
  },
  {
    maxAge: CACHE_TTL,
    max: CACHE_MAX_SIZE,
    promise: true,
    normalizer: (args) => String(args[0] || 100),
  }
);

// Wrapper with fallback
export async function fetchCryptoDataCached(limit: number = 100): Promise<any> {
  try {
    return await fetchCryptoDataCachedBase(limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
      const staleData = getStaleData(`cryptoList:${limit}`);
      if (staleData) {
        console.log(`[Cache] Returning stale data for crypto list (limit: ${limit})`);
        return { data: staleData, isStale: true };
      }
    }
    throw error;
  }
}

// Helper: Fetch single crypto data with cache (short TTL for WebSocket)
const fetchSingleCryptoCachedBase = memoizee(
  async (id: string, shortTTL: boolean = false) => {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
    );
    if (!response.ok) {
      const text = await response.text();
      console.error(`CoinGecko API error for ${id} (${response.status}):`, text);
      
      // On rate limit, throw a specific error
      if (response.status === 429) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      
      throw new Error(`Failed to fetch crypto data: ${response.status} ${response.statusText}`);
    }
    console.log(`[Cache] Fetched fresh data for ${id} (shortTTL: ${shortTTL})`);
    cacheStats.singleCrypto++;
    const data = await response.json();
    
    // Save to stale cache
    setStaleData(`singleCrypto:${id}`, data);
    
    return data;
  },
  {
    maxAge: CACHE_TTL_SHORT, // Use short TTL for WebSocket updates
    max: CACHE_MAX_SIZE,
    promise: true,
    normalizer: (args) => args[0], // Only cache by ID, ignore shortTTL flag
  }
);

// Wrapper with fallback
export async function fetchSingleCryptoCached(id: string, shortTTL: boolean = false): Promise<any> {
  try {
    return await fetchSingleCryptoCachedBase(id, shortTTL);
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
      const staleData = getStaleData(`singleCrypto:${id}`);
      if (staleData) {
        console.log(`[Cache] Returning stale data for ${id}`);
        return { ...staleData, isStale: true };
      }
    }
    throw error;
  }
}

// Helper: Fetch OHLC data with cache
const fetchOHLCDataCachedBase = memoizee(
  async (id: string, days: string) => {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/ohlc?vs_currency=usd&days=${days}`
    );
    if (!response.ok) {
      const text = await response.text();
      console.error(`CoinGecko OHLC API error for ${id} (${response.status}):`, text);
      
      // On rate limit, throw a specific error
      if (response.status === 429) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      
      throw new Error(`Failed to fetch OHLC data: ${response.status} ${response.statusText}`);
    }
    console.log(`[Cache] Fetched fresh OHLC data for ${id} (${days} days)`);
    cacheStats.ohlc++;
    const data = await response.json();
    
    // Save to stale cache
    setStaleData(`ohlc:${id}:${days}`, data);
    
    return data;
  },
  {
    maxAge: CACHE_TTL,
    max: CACHE_MAX_SIZE,
    promise: true,
    normalizer: (args) => `${args[0]}_${args[1]}`,
  }
);

// Wrapper with fallback
export async function fetchOHLCDataCached(id: string, days: string): Promise<any> {
  try {
    return await fetchOHLCDataCachedBase(id, days);
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
      const staleData = getStaleData(`ohlc:${id}:${days}`);
      if (staleData) {
        console.log(`[Cache] Returning stale OHLC data for ${id} (${days} days)`);
        return { data: staleData, isStale: true }; // Return with isStale flag
      }
    }
    throw error;
  }
}

// Get cache stats
export function getCacheStats() {
  return {
    cryptoList: {
      fetches: cacheStats.cryptoList,
    },
    singleCrypto: {
      fetches: cacheStats.singleCrypto,
    },
    ohlc: {
      fetches: cacheStats.ohlc,
    },
  };
}

// Clear all caches
export function clearAllCaches() {
  (fetchCryptoDataCached as any).clear?.();
  (fetchSingleCryptoCached as any).clear?.();
  (fetchOHLCDataCached as any).clear?.();
  cacheStats = {
    cryptoList: 0,
    singleCrypto: 0,
    ohlc: 0,
  };
  console.log('[Cache] All caches cleared');
}
