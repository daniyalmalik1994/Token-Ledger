import { summarise, toLedgerLines, type LedgerLine, type LedgerSummary } from '../domain/usage';
import { AuthError } from '../domain/errors';
import type { DailyTotal, UsageRepository, UserRepository } from './ports';

export interface LedgerView {
  summary: LedgerSummary;
  lines: LedgerLine[];
  daily: DailyTotal[];
  budget: { monthly: number; remaining: number; overBudget: boolean };
}

export function getLedger(
  deps: { usage: UsageRepository; users: UserRepository },
  input: { userId: string; from?: string; to?: string; days?: number },
): LedgerView {
  const user = deps.users.findById(input.userId);
  if (!user) throw new AuthError('Account no longer exists');

  const events = deps.usage.list({ userId: user.id, from: input.from, to: input.to });
  const lines = toLedgerLines(events, user.monthlyBudget);
  const remaining = lines.length ? lines[lines.length - 1]!.balance : user.monthlyBudget;

  return {
    summary: summarise(events),
    lines: [...lines].reverse(),
    daily: deps.usage.dailyTotals(user.id, input.days ?? 14),
    budget: { monthly: user.monthlyBudget, remaining, overBudget: remaining < 0 },
  };
}
