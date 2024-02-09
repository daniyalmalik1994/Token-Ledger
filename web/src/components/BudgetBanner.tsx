import type { LedgerView } from '../types';

const eur = (value: number) =>
  value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });

export function BudgetBanner({ view }: { view: LedgerView }) {
  const { budget, summary } = view;
  const spent = budget.monthly - budget.remaining;
  const used = budget.monthly > 0 ? Math.min(spent / budget.monthly, 1) : 0;

  return (
    <section className="sheet px-6 py-6 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Balance carried forward</p>
          <p
            className={`figure mt-1 text-4xl font-medium ${budget.overBudget ? 'text-debit' : 'text-ink'}`}
          >
            {eur(budget.remaining)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {eur(spent)} posted against a {eur(budget.monthly)} budget
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-x-8 gap-y-1 text-right">
          {[
            ['Calls', summary.calls.toLocaleString('de-DE')],
            ['Tokens', summary.totalTokens.toLocaleString('de-DE')],
            ['Cost', eur(summary.cost)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="eyebrow">{label}</dt>
              <dd className="figure text-lg">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-6 h-1.5 w-full bg-rule/60">
        <div
          className={`h-full transition-[width] duration-500 ${budget.overBudget ? 'bg-debit' : 'bg-credit'}`}
          style={{ width: `${Math.round(used * 100)}%` }}
          role="progressbar"
          aria-valuenow={Math.round(used * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Share of the monthly budget spent"
        />
      </div>

      {budget.overBudget && (
        <p className="mt-3 text-sm text-debit">
          The budget is spent. New calls keep posting — they just run the balance further into the red.
        </p>
      )}
    </section>
  );
}
