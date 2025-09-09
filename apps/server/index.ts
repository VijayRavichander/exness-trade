import express, { type Request, type Response } from "express";
import cors from "cors";
import { redisService } from "./lib/redis";
import { REDIS_EVENTS_TODO_STREAM, REDIS_EVENTS_DONE_STREAM } from "./lib/config";
import { v4 as uuidv4 } from "uuid";
import { Resend } from "resend";
import authRoutes from "./routes/auth";
export const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();

app.use(express.json());
app.use(cors());

// Use auth routes
app.use("/api/v1", authRoutes);

app.post("/trade/open", async (req: Request, res: Response) => {

  // [TODO: Add Auth]
  const { asset, qty } = req.body;

  const tripId = uuidv4();

  // [TODO: User Details,]
  const redis_payload = {
    asset,
    qty,
    type: "user",
  };

  const processedResult = await redisService.addToStream(REDIS_EVENTS_TODO_STREAM, redis_payload)

  res.json({
    status: "success",
    tripId: tripId,
    processedResult: processedResult,
  });
});

redisService.startProcessedEventsListener(REDIS_EVENTS_DONE_STREAM);

app.listen(3005, () => {
  console.log("Listening on PORT: 3005");
});
