import memoizee from 'memoizee';

// Cache configuration
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes in milliseconds
const CACHE_TTL_SHORT = 30 * 1000; // 30 seconds for WebSocket updates
const CACHE_MAX_SIZE = 100; // Maximum number of cached items

// Track cache sizes manually
let cacheStats = {
  cryptoList: 0,
  singleCrypto: 0,
  ohlc: 0,
};

// Helper: Fetch crypto data from CoinGecko with cache
export const fetchCryptoDataCached = memoizee(
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
    return response.json();
  },
  {
    maxAge: CACHE_TTL,
    max: CACHE_MAX_SIZE,
    promise: true,
    normalizer: (args) => String(args[0] || 100),
  }
);

// Helper: Fetch single crypto data with cache (short TTL for WebSocket)
export const fetchSingleCryptoCached = memoizee(
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
    return response.json();
  },
  {
    maxAge: CACHE_TTL_SHORT, // Use short TTL for WebSocket updates
    max: CACHE_MAX_SIZE,
    promise: true,
    normalizer: (args) => args[0], // Only cache by ID, ignore shortTTL flag
  }
);

// Helper: Fetch OHLC data with cache
export const fetchOHLCDataCached = memoizee(
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
    return response.json();
  },
  {
    maxAge: CACHE_TTL,
    max: CACHE_MAX_SIZE,
    promise: true,
    normalizer: (args) => `${args[0]}_${args[1]}`,
  }
);

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
