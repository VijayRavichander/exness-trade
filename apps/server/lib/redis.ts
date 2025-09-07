import { Redis } from "ioredis";

const REDIS_URL: string = "redis://localhost:6379";

export const redis_events_todo = new Redis(REDIS_URL);
export const redis_events_processed = new Redis(REDIS_URL);
