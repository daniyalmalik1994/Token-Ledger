import type { UsageEvent } from '../domain/usage';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  monthlyBudget: number;
}

export interface UserRepository {
  findByEmail(email: string): UserRecord | null;
  findById(id: string): UserRecord | null;
}

export interface UsageRange {
  userId: string;
  from?: string;
  to?: string;
  limit?: number;
}

export interface DailyTotal {
  day: string;
  calls: number;
  totalTokens: number;
}

export interface UsageRepository {
  add(event: UsageEvent): void;
  list(range: UsageRange): UsageEvent[];
  dailyTotals(userId: string, days: number): DailyTotal[];
}

export interface TokenService {
  sign(payload: { sub: string; email: string }): string;
  verify(token: string): { sub: string; email: string };
}

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}
