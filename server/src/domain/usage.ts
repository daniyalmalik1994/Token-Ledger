import { InvalidUsageError } from './errors';
import { rateFor, type Provider } from './pricing';

export interface UsageEvent {
  id: string;
  userId: string;
  model: string;
  provider: Provider;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  /** ISO-8601, always UTC. */
  occurredAt: string;
}

export interface DraftUsageEvent {
  userId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  occurredAt?: string;
}

/** Rounded to the cent-fraction we actually invoice on. */
export function costOf(event: Pick<UsageEvent, 'model' | 'promptTokens' | 'completionTokens'>): number {
  const rate = rateFor(event.model);
  const raw =
    (event.promptTokens * rate.inputPerMillion + event.completionTokens * rate.outputPerMillion) / 1_000_000;
  return Math.round(raw * 1e6) / 1e6;
}

/**
 * Turns a draft into a valid event. Validation lives here so every entry point
 * — HTTP, a queue consumer, a backfill script — gets the same rules.
 */
export function createUsageEvent(draft: DraftUsageEvent, id: string): UsageEvent {
  if (!Number.isInteger(draft.promptTokens) || draft.promptTokens < 0) {
    throw new InvalidUsageError('promptTokens must be a non-negative integer');
  }
  if (!Number.isInteger(draft.completionTokens) || draft.completionTokens < 0) {
    throw new InvalidUsageError('completionTokens must be a non-negative integer');
  }
  if (draft.latencyMs < 0) {
    throw new InvalidUsageError('latencyMs must be non-negative');
  }
  const rate = rateFor(draft.model);
  return {
    id,
    userId: draft.userId,
    model: draft.model,
    provider: rate.provider,
    promptTokens: draft.promptTokens,
    completionTokens: draft.completionTokens,
    latencyMs: draft.latencyMs,
    occurredAt: draft.occurredAt ?? new Date().toISOString(),
  };
}

export interface ModelTotal {
  model: string;
  provider: Provider;
  calls: number;
  totalTokens: number;
  cost: number;
}

export interface LedgerSummary {
  calls: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  byModel: ModelTotal[];
}

export function summarise(events: UsageEvent[]): LedgerSummary {
  const totals = new Map<string, ModelTotal>();
  const summary: LedgerSummary = {
    calls: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    cost: 0,
    byModel: [],
  };

  for (const event of events) {
    const cost = costOf(event);
    summary.calls += 1;
    summary.promptTokens += event.promptTokens;
    summary.completionTokens += event.completionTokens;
    summary.cost += cost;

    const current = totals.get(event.model) ?? {
      model: event.model,
      provider: event.provider,
      calls: 0,
      totalTokens: 0,
      cost: 0,
    };
    current.calls += 1;
    current.totalTokens += event.promptTokens + event.completionTokens;
    current.cost += cost;
    totals.set(event.model, current);
  }

  summary.totalTokens = summary.promptTokens + summary.completionTokens;
  summary.cost = Math.round(summary.cost * 1e6) / 1e6;
  summary.byModel = [...totals.values()]
    .map((entry) => ({ ...entry, cost: Math.round(entry.cost * 1e6) / 1e6 }))
    .sort((a, b) => b.cost - a.cost);

  return summary;
}

export interface LedgerLine {
  event: UsageEvent;
  cost: number;
  /** Budget left after this line is posted. Negative once the budget is blown. */
  balance: number;
}

/**
 * Double-entry style view: every call is a debit against the month's budget and
 * carries the balance forward, so you can see the exact call that broke it.
 */
export function toLedgerLines(events: UsageEvent[], openingBudget: number): LedgerLine[] {
  const chronological = [...events].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  let balance = openingBudget;
  return chronological.map((event) => {
    const cost = costOf(event);
    balance = Math.round((balance - cost) * 1e6) / 1e6;
    return { event, cost, balance };
  });
}
