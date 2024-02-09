import { useState } from 'react';
import { SignIn } from './components/SignIn';
import { BudgetBanner } from './components/BudgetBanner';
import { LedgerTable } from './components/LedgerTable';
import { ModelTotals } from './components/ModelTotals';
import { RecordCall } from './components/RecordCall';
import { useLedger } from './hooks/useLedger';
import type { SignedInUser } from './types';

const WINDOWS = [7, 14, 30];

export default function App() {
  // Kept in memory on purpose: a reload signs you out rather than leaving a
  // long-lived token sitting in storage.
  const [session, setSession] = useState<{ token: string; user: SignedInUser } | null>(null);
  const [days, setDays] = useState(14);
  const { data, error, loading, reload } = useLedger(session?.token ?? null, days);

  if (!session) {
    return <SignIn onSignedIn={(token, user) => setSession({ token, user })} />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Token Ledger</p>
          <h1 className="font-display text-2xl font-bold">{session.user.displayName}</h1>
        </div>

        <div className="flex items-center gap-2">
          {WINDOWS.map((window) => (
            <button
              key={window}
              type="button"
              onClick={() => setDays(window)}
              aria-pressed={days === window}
              className={`border px-3 py-1.5 font-ledger text-xs transition ${
                days === window ? 'border-ink bg-ink text-paper' : 'border-rule text-muted hover:border-ink'
              }`}
            >
              {window}d
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSession(null)}
            className="ml-2 font-display text-xs uppercase tracking-[0.14em] text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Sign out
          </button>
        </div>
      </header>

      {error && (
        <p className="sheet mb-6 px-6 py-4 text-sm text-debit">
          {error} — check that the API is running on port 4000.
        </p>
      )}

      {loading && !data && <p className="text-sm text-muted">Loading the ledger…</p>}

      {data && (
        <div className="space-y-6">
          <BudgetBanner view={data} />
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <LedgerTable lines={data.lines} />
            <ModelTotals totals={data.summary.byModel} />
          </div>
          <RecordCall token={session.token} onRecorded={() => void reload()} />
        </div>
      )}
    </div>
  );
}
