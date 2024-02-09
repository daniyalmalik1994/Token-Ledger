import { createUsageEvent, costOf, type DraftUsageEvent, type UsageEvent } from '../domain/usage';
import type { IdGenerator, UsageRepository } from './ports';

export function recordUsage(
  deps: { usage: UsageRepository; ids: IdGenerator },
  draft: DraftUsageEvent,
): { event: UsageEvent; cost: number } {
  const event = createUsageEvent(draft, deps.ids.next());
  deps.usage.add(event);
  return { event, cost: costOf(event) };
}
