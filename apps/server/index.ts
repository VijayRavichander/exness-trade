import express from "express";
import cors from "cors";
import { redis_events_todo } from "./lib/redis";
import { REDIS_EVENTS_TODO_STREAM } from "./lib/config";
import { v4 as uuidv4 } from "uuid";
import { ingestFromProcessedEventsStream, pendingRequests } from "./lib/utils";

const app = express();

app.use(express.json());

app.post("/trade/open", async (req, res) => {
  // [TODO: Add Auth]

  const { asset, qty } = req.body;

  const tripId = uuidv4();

  // [TODO: User Details, ]
  const redis_payload = {
    asset,
    qty,
    tripId,
    type: "user"
  };

  
  const processedPromise = new Promise(async (resolve, reject) => {
    pendingRequests.set(tripId, {
      resolve,
      reject,
      timestamp: Date.now(),
    });

    setTimeout(() => {
      if (pendingRequests.has(tripId)) {
        pendingRequests.delete(tripId);
        reject(new Error("Processing Timeout"));
      }
    }, 1000 * 5);
  });

  await redis_events_todo.xadd(
    REDIS_EVENTS_TODO_STREAM,
    "*",
    "data",
    JSON.stringify(redis_payload)
  );

  const processedResult = await processedPromise;

  res.json({
    status: "success",
    tripId: tripId,
    processedResult: processedResult,
  });
});

app.use(cors());

ingestFromProcessedEventsStream();

app.listen(3005, () => {
  console.log("Listening on PORT: 3005");
});
