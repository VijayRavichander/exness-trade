import { redis } from "./lib/redis";


async function getRedisPriceStream() {

    setInterval(async () => {
        const stream = await redis.xrevrange('price_stream', '+', '-', 'COUNT', 1)
        console.log(stream)
    }, 100);
}



getRedisPriceStream();