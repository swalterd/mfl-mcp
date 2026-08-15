import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

type CacheEnvelope<T> = {
  expiresAt: number;
  value: T;
};

export class DiskCache {
  constructor(private readonly rootDir: string) {}

  private cachePath(key: string): string {
    return join(this.rootDir, `${key}.json`);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const body = await readFile(this.cachePath(key), "utf8");
      const parsed = JSON.parse(body) as CacheEnvelope<T>;
      if (parsed.expiresAt < Date.now()) return null;
      return parsed.value;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    const path = this.cachePath(key);
    await mkdir(dirname(path), { recursive: true });
    const envelope: CacheEnvelope<T> = {
      expiresAt: Date.now() + ttlMs,
      value,
    };
    await writeFile(path, JSON.stringify(envelope), "utf8");
  }
}
