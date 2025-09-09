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

          for (const [messageId, fields] of messages) {
            try {
              const userData = JSON.parse(fields[1]);
              const { tripId } = userData;

              if (this.pendingRequests.has(tripId)) {
                const { resolve } = this.pendingRequests.get(tripId)!;
                this.pendingRequests.delete(tripId);
                resolve(userData);
              }

              this.processedRedisOffset = messageId;
            } catch (parseError) {
              console.error("Error parsing processed message:", parseError);
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


