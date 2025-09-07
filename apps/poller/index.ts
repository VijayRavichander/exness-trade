import { getBackPackEvents } from "./lib/backpack";
import { lastestPrices } from "./lib/store";
import { SYMBOLS, DECIMALS_FOR_SYMBOLS } from "./lib/constants";
import { redis } from "./lib/redis";


function startPriceStreaming() {
    setInterval(async () => {
        
        const payload = Object.entries(lastestPrices).map(([symbol, price]) => ({
            asset: symbol.split("_")[0],
            price: price, 
            decimal: DECIMALS_FOR_SYMBOLS[symbol as keyof typeof DECIMALS_FOR_SYMBOLS]
        }))

        if (payload.length > 0) {
            const redis_payload = {payload: payload}
            console.log(redis_payload)
            await redis.xadd('events_stream', 'MAXLEN', '~', '10000', '*', 'data', JSON.stringify(redis_payload))
        }
    }, 1000);
}

getBackPackEvents([...SYMBOLS]);


startPriceStreaming();

