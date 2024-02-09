import type { ModelTotal } from '../types';

const eur = (value: number) =>
  value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });

export function ModelTotals({ totals }: { totals: ModelTotal[] }) {
  const highest = totals[0]?.cost ?? 0;

  return (
    <section className="sheet px-6 py-6 sm:px-8">
      <p className="eyebrow">Where the money went</p>
      <ul className="mt-4 space-y-3">
        {totals.map((total) => (
          <li key={total.model}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm font-medium">{total.model}</span>
              <span className="figure text-sm">{eur(total.cost)}</span>
            </div>
            <div className="mt-1 h-1 w-full bg-rule/50">
              <div
                className="h-full bg-credit"
                style={{ width: `${highest > 0 ? Math.max((total.cost / highest) * 100, 2) : 0}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              {total.calls} calls · {total.totalTokens.toLocaleString('de-DE')} tokens · {total.provider}
            </p>
          </li>
        ))}
        {totals.length === 0 && <li className="text-sm text-muted">Nothing posted in this window.</li>}
      </ul>
    </section>
  );
}
