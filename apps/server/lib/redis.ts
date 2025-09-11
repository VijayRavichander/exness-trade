import { Redis } from "ioredis";
import { v4 as uuidv4 } from "uuid";

export interface PendingRequest {
  resolve: (value: any) => void;
  reject: (value: any) => void;
  timestamp: number;
}

export interface StreamMessage {
  [key: string]: any;
}

export class RedisService {
  private todoRedis: Redis;
  private processedRedis: Redis;
  private pendingRequests: Map<string, PendingRequest>;
  private defaultTimeout: number;
  private processedRedisOffset: string;

  constructor(
    redisUrl: string = "redis://localhost:6379",
    timeout: number = 5 * 1000 * 100
  ) {
    this.todoRedis = new Redis(redisUrl);
    this.processedRedis = new Redis(redisUrl);
    this.pendingRequests = new Map();
    this.defaultTimeout = timeout;
    // Need to read from the ENGINE SNAPSHOT
    this.processedRedisOffset = '$'
  }

  // What is T=any
  async addToStream<T = any>(
    streamName: string,
    data: StreamMessage
  ): Promise<T> {
    const tripId = uuidv4();
    const timeout = this.defaultTimeout;

    const payload = { ...data, tripId };

    const addedToStreamPromise = new Promise<T>((resolve, reject) => {
      this.pendingRequests.set(tripId, {
        resolve,
        reject,
        timestamp: Date.now(),
      });

      setTimeout(() => {
        if (this.pendingRequests.has(tripId)) {
          this.pendingRequests.delete(tripId);
          reject(new Error("Processing Timeout. Order didn't complete"));
        }
      }, timeout);
    });

    try {
      await this.todoRedis.xadd(
        streamName,
        "*",
        "data",
        JSON.stringify(payload)
      );
    } catch (error) {
      this.pendingRequests.delete(tripId);
      throw new Error(`Failed to add message to stream: ${error}`);
    }

    return addedToStreamPromise;
  }

  async startProcessedEventsListener(
    processedStreamName: string
  ): Promise<void> {
    this.processedRedisOffset = "$"

    while (true) {
      try {
        const results = await this.processedRedis.xread(
          "COUNT",
          1,
          "BLOCK",
          0,
          "STREAMS",
          processedStreamName,
          this.processedRedisOffset
        );

        if (results && results.length > 0) {
          const [streamName, messages] = results[0];

          console.log("messages", messages);
          
          // Check if message data exists and is not empty
          if (messages && messages.length > 0 && messages[0] && messages[0][1] && messages[0][1][1]) {
            try {
              const fieldEntries = messages[0][1] as any[];
              const fieldMap: Record<string, any> = {};
              for (let i = 0; i < fieldEntries.length; i += 2) {
                fieldMap[String(fieldEntries[i])] = fieldEntries[i + 1];
              }

              const rawData = fieldMap["data"];
              if (typeof rawData !== "string") {
                console.warn("Processed message missing 'data' string; skipping");
                this.processedRedisOffset = messages[0][0];
                continue;
              }

              const trimmed = rawData.trim();
              if (trimmed.length === 0) {
                console.log("Skipping empty message");
                this.processedRedisOffset = messages[0][0];
                continue;
              }

              const userData = JSON.parse(trimmed);
              const { tripId } = userData ?? {};

              if (!tripId) {
                console.warn("Processed message missing 'tripId'; skipping");
                this.processedRedisOffset = messages[0][0];
                continue;
              }

              if (this.pendingRequests.has(tripId)) {
                const { resolve } = this.pendingRequests.get(tripId)!;
                this.pendingRequests.delete(tripId);
                resolve(userData);
              }

              this.processedRedisOffset = messages[0][0];
            } catch (parseError) {
              console.error("Error parsing processed message:", parseError);
              continue;
            }
          }
        }
      } catch (error) {
        console.error("Error while reading from processed stream:", error);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
}

// Create singleton instance
export const redisService = new RedisService();


