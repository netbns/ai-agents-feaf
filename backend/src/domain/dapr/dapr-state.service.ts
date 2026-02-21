import { Injectable, Logger } from '@nestjs/common';
import { DaprClientService } from './dapr-client.service';

@Injectable()
export class DaprStateService {
  private readonly logger = new Logger(DaprStateService.name);
  private readonly stateStore = 'statestore';

  constructor(private readonly daprClientService: DaprClientService) {}

  async get<T = any>(key: string): Promise<T | null> {
    try {
      if (!this.daprClientService.isConnected()) {
        this.logger.warn(`Dapr not connected, cannot get key: ${key}`);
        return null;
      }

      const client = this.daprClientService.getClient();
      const state = await client.state.get(this.stateStore, key);

      if (!state) return null;
      // v3 SDK may return parsed object or string
      return typeof state === 'string' ? JSON.parse(state) : (state as T);
    } catch (error) {
      this.logger.error(`Failed to get state for key ${key}: ${error.message}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: string): Promise<boolean> {
    try {
      if (!this.daprClientService.isConnected()) {
        this.logger.warn(`Dapr not connected, cannot set key: ${key}`);
        return false;
      }

      const client = this.daprClientService.getClient();
      const metadata = ttl ? { 'ttlInSeconds': this.parseTtl(ttl) } : {};

      await client.state.save(
        this.stateStore,
        [
          {
            key,
            value: JSON.stringify(value),
            metadata,
          },
        ],
      );

      return true;
    } catch (error) {
      this.logger.error(`Failed to set state for key ${key}: ${error.message}`);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      if (!this.daprClientService.isConnected()) {
        this.logger.warn(`Dapr not connected, cannot delete key: ${key}`);
        return false;
      }

      const client = this.daprClientService.getClient();
      await client.state.delete(this.stateStore, key);

      return true;
    } catch (error) {
      this.logger.error(`Failed to delete state for key ${key}: ${error.message}`);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  // Aliases used by domain services
  async setState<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    const ttl = ttlSeconds ? `${ttlSeconds}` : undefined;
    return this.set(key, value, ttl);
  }

  async getState<T = any>(key: string): Promise<T | null> {
    return this.get<T>(key);
  }

  async deleteState(key: string): Promise<boolean> {
    return this.delete(key);
  }

  private parseTtl(ttl: string): string {
    // Parse formats like "1h", "30m", "3600s"
    return ttl;
  }
}
