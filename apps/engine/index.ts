import { redis } from "./lib/redis";
import { engine } from "./lib/engine";

async function parseMessage(
  messages: [id: string, fields: string[]][]
): Promise<any> {
  const data = await JSON.parse(messages[0][1][1]);
  return data;
}

async function ingestFromEventsStream() {
  // Starts from the latest
  // [TODO: Add a LastID from store/snapshot/file to handle server shutdown]
  let lastId = "$";

  console.log("[ENGINE RUNNING...");

  while (true) {
    try {
      const results = await redis.xread(
        "COUNT",
        1,
        "BLOCK",
        0,
        "STREAMS",
        "events_stream",
        lastId
      );

      if (results && results.length > 0) {
        const [streamName, messages] = results[0];

        const payload = await engine.router(messages);

        if (payload) {
          await redis.xadd(
            "events_processed",
            "*",
            "data",
            JSON.stringify(payload)
          );
        }
      }
    } catch (error) {
      console.log("Error while Ingesting from Stream", error);
    }
  }
}

ingestFromEventsStream().catch(console.error);
