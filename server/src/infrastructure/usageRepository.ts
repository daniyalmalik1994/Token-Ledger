import type { Db } from './db';
import type { DailyTotal, UsageRange, UsageRepository } from '../application/ports';
import type { Provider } from '../domain/pricing';
import type { UsageEvent } from '../domain/usage';

interface UsageRow {
  id: string;
  user_id: string;
  model: string;
  provider: string;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
  occurred_at: string;
}

const toEvent = (row: UsageRow): UsageEvent => ({
  id: row.id,
  userId: row.user_id,
  model: row.model,
  provider: row.provider as Provider,
  promptTokens: row.prompt_tokens,
  completionTokens: row.completion_tokens,
  latencyMs: row.latency_ms,
  occurredAt: row.occurred_at,
});

export class SqliteUsageRepository implements UsageRepository {
  constructor(private readonly db: Db) {}

  add(event: UsageEvent): void {
    this.db
      .prepare(
        `INSERT INTO usage_events
           (id, user_id, model, provider, prompt_tokens, completion_tokens, latency_ms, occurred_at)
         VALUES (@id, @userId, @model, @provider, @promptTokens, @completionTokens, @latencyMs, @occurredAt)`,
      )
      .run(event);
  }

  list({ userId, from, to, limit = 200 }: UsageRange): UsageEvent[] {
    // Bounds are optional but always parameterised — the index above covers
    // (user_id, occurred_at) so the range scan stays cheap as the table grows.
    const rows = this.db
      .prepare(
        `SELECT * FROM usage_events
          WHERE user_id = @userId
            AND (@from IS NULL OR occurred_at >= @from)
            AND (@to   IS NULL OR occurred_at <= @to)
          ORDER BY occurred_at DESC
          LIMIT @limit`,
      )
      .all({ userId, from: from ?? null, to: to ?? null, limit }) as UsageRow[];
    return rows.map(toEvent);
  }

  dailyTotals(userId: string, days: number): DailyTotal[] {
    return this.db
      .prepare(
        `SELECT substr(occurred_at, 1, 10)               AS day,
                COUNT(*)                                  AS calls,
                SUM(prompt_tokens + completion_tokens)    AS totalTokens
           FROM usage_events
          WHERE user_id = @userId
            AND occurred_at >= @since
          GROUP BY day
          ORDER BY day ASC`,
      )
      .all({
        userId,
        since: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
      }) as DailyTotal[];
  }
}
