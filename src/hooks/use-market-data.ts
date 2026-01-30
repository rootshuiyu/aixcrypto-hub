import { arenaMarkets, featuredMarkets } from "../lib/data";

export function useMarketData() {
  return {
    featuredMarkets,
    arenaMarkets
  };
}

