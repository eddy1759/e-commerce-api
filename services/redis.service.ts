import Redis, { Redis as RedisClient } from 'ioredis';
import { logger } from '../config/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const MAX_RETRIES = 10;
const RETRY_DELAY = 5000; // 5 seconds
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

class RedisService {
  private client: RedisClient;
  private isConnected: boolean = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > MAX_RETRIES) {
          logger.error(`Max Redis connection retries (${MAX_RETRIES}) exceeded`);
          return null; // Stop retrying
        }
        return Math.min(times * 100, RETRY_DELAY);
      },
      reconnectOnError: (err: Error) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true; // Reconnect for READONLY error
        }
        return false;
      },
    });

    this.setupEventListeners();
  }

  public async initialize(): Promise<void> {
    try {
      await this.client.ping();
      this.isConnected = true;
      logger.info('Redis connection initialized successfully');
      this.startHealthCheck();
    } catch (error) {
      logger.error('Failed to initialize Redis connection:');
      throw error;
    }
  }

  private setupEventListeners(): void {
    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Successfully connected to Redis');
    });

    this.client.on('error', (error: Error) => {
      logger.error('Redis connection error:', error);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn('Redis connection closed');
    });

    process.on('SIGINT', () => {
      this.gracefulShutdown();
    });

    process.on('SIGTERM', () => {
      this.gracefulShutdown();
    });
  }

  private async gracefulShutdown(): Promise<void> {
    logger.info('Gracefully shutting down Redis connection');
    this.stopHealthCheck();
    await this.client.quit();
    process.exit(0);
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.ping();
        logger.debug('Redis health check passed');
      } catch (error) {
        logger.error('Redis health check failed:');
        
      }
    }, HEALTH_CHECK_INTERVAL);
  }

  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  public async healthCheck(): Promise<{ status: string; details: string }> {
    try {
      await this.ping();
      return { status: 'healthy', details: 'Redis connection is healthy' };
    } catch (error) {
      return { status: 'unhealthy', details: `Redis connection is unhealthy` };
    }
  }

  public async get(key: string): Promise<string | null> {
    this.ensureConnection();
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error(`Error getting key ${key} from Redis`);
      throw error;
    }
  }

  public async set(key: string, value: string, expiryInSeconds?: number): Promise<void> {
    this.ensureConnection();
    try {
      if (expiryInSeconds) {
        await this.client.set(key, value, 'EX', expiryInSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error(`Error setting key ${key} in Redis`);
      throw error;
    }
  }

  public async del(key: string): Promise<void> {
    this.ensureConnection();
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error(`Error deleting key ${key} from Redis`);
      throw error;
    }
  }

  private ensureConnection(): void {
    if (!this.isConnected) {
      throw new Error('Redis connection is not established');
    }
  }

  public async ping(): Promise<void> {
    try {
      await this.client.ping();
    } catch (error) {
      logger.error('Redis ping failed');
      throw error;
    }
  }
}

const redisService = new RedisService();

export { redisService };