import { Redis } from "ioredis";

const REDIS_URL: string = "redis://localhost:6379";

export const redis = new Redis(REDIS_URL);
