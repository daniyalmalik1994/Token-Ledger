import { randomUUID } from 'node:crypto';
import { openDatabase, seed, type Db } from './infrastructure/db';
import { SqliteUsageRepository } from './infrastructure/usageRepository';
import { SqliteUserRepository } from './infrastructure/userRepository';
import { JwtTokenService } from './infrastructure/tokenService';
import type { RouterDeps } from './interfaces/http/routes';

export interface Container extends RouterDeps {
  db: Db;
}

/**
 * The only place that knows which concrete adapters are in play. Swap SQLite for
 * SQL Server here and nothing in domain/ or application/ has to change.
 */
export function buildContainer(options: { file?: string; secret?: string; withSeed?: boolean } = {}): Container {
  const db = openDatabase(options.file);
  if (options.withSeed ?? true) seed(db);

  return {
    db,
    users: new SqliteUserRepository(db),
    usage: new SqliteUsageRepository(db),
    tokens: new JwtTokenService(options.secret ?? process.env.JWT_SECRET ?? 'dev-secret-change-me'),
    ids: { next: () => `e_${randomUUID()}` },
  };
}
