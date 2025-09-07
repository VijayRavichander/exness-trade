const API : string = "wss://ws.backpack.exchange/";
const SUBSCRIPTIONS : string[] = ["bookTicker", "depth.200ms", "trade"];
const SYMBOLS = ["SOL_USDC", "BTC_USDC", "ETH_USDC"] as const;


const DECIMALS_FOR_SYMBOLS: Record<typeof SYMBOLS[number], number> = {
    SOL_USDC: 4, 
    BTC_USDC: 6, 
    ETH_USDC: 4     
}


export { API, SUBSCRIPTIONS, SYMBOLS, DECIMALS_FOR_SYMBOLS };

export type Symbol = typeof SYMBOLS[number];