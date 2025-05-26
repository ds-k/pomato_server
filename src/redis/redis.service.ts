import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createClient } from 'redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: ReturnType<typeof createClient>;

  constructor(private configService: ConfigService) {
    this.client = createClient({
      url: `redis://${configService.get('REDIS_HOST')}:${configService.get('REDIS_PORT')}`,
    });

    this.client.connect().catch(console.error);

    this.client.on('error', (err) => console.log('Redis Client Error', err));
    this.client.on('connect', () => console.log('Redis Client Connected'));
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async addToBlacklist(token: string, expiresIn: number) {
    await this.client.set(`blacklist:${token}`, 'true', {
      EX: expiresIn,
    });
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const result = await this.client.get(`blacklist:${token}`);
    return result === 'true';
  }

  async set(key: string, value: string, ttl?: number) {
    if (ttl) {
      await this.client.set(key, value, { EX: ttl });
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string) {
    return await this.client.get(key);
  }

  async del(key: string) {
    return await this.client.del(key);
  }
}
