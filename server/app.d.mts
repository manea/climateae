import type { Server } from 'node:http';
import type { DatabaseSync } from 'node:sqlite';

export interface ClimateDbOptions {
  dbPath?: string;
  dataDir?: string;
}

export interface ClimateServerOptions {
  dbPath?: string;
  dataDir?: string;
  basePath?: string;
  staticDir?: string;
  maxBodyBytes?: number;
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
  host?: string;
  port?: number;
}

export interface ClimateServerInstance {
  server: Server;
  db: DatabaseSync;
  basePath: string;
  listen: (port?: number, host?: string) => Promise<{ port: number; host: string; url: string }>;
  close: () => Promise<void>;
}

export function createDb(options?: ClimateDbOptions): DatabaseSync;
export function closeDb(db: DatabaseSync): void;
export function createApp(options?: ClimateServerOptions): ClimateServerInstance;
