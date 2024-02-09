import type { Db } from './db';
import type { UserRecord, UserRepository } from '../application/ports';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  monthly_budget: number;
}

const toRecord = (row: UserRow): UserRecord => ({
  id: row.id,
  email: row.email,
  passwordHash: row.password_hash,
  displayName: row.display_name,
  monthlyBudget: row.monthly_budget,
});

export class SqliteUserRepository implements UserRepository {
  constructor(private readonly db: Db) {}

  findByEmail(email: string): UserRecord | null {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
    return row ? toRecord(row) : null;
  }

  findById(id: string): UserRecord | null {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
    return row ? toRecord(row) : null;
  }
}
