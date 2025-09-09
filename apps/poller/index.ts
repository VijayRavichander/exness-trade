import { getBackPackEvents } from "./lib/backpack";
import { lastestPrices } from "./lib/store";
import { SYMBOLS, DECIMALS_FOR_SYMBOLS } from "./lib/constants";
import { redis } from "./lib/redis";

const PRICES: Record<string, number> = {};

function startPriceStreaming() {
    setInterval(async () => {
        

    Object.entries(lastestPrices).forEach(([key, value]) => {
        key = key.split("_")[0]
        PRICES[key] = value;
    });

    if (Object.keys(PRICES).length > 0) {
        const redis_payload = {...PRICES, type: "priceUpdate"}
        console.log(JSON.stringify(redis_payload));
        await redis.xadd('events_stream', 'MAXLEN', '~', '10000', '*', 'data', JSON.stringify(redis_payload))
    }
    }, 1000);
}

getBackPackEvents([...SYMBOLS]);


startPriceStreaming();

