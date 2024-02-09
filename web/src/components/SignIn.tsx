import { useState } from 'react';
import { api } from '../api/client';
import type { SignedInUser } from '../types';

interface Props {
  onSignedIn: (token: string, user: SignedInUser) => void;
}

export function SignIn({ onSignedIn }: Props) {
  const [email, setEmail] = useState('demo@token-ledger.dev');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const { token, user } = await api.login(email, password);
      onSignedIn(token, user);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="sheet px-8 py-10">
        <p className="eyebrow">Token Ledger</p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight">Open the books</h1>
        <p className="mt-2 text-sm text-muted">
          Every model call is a line item. Sign in to see what this month has cost.
        </p>

        <div className="mt-8 space-y-4">
          <label className="block">
            <span className="eyebrow">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full border-b border-rule bg-transparent py-2 font-ledger text-sm focus:border-credit"
            />
          </label>

          <label className="block">
            <span className="eyebrow">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && void submit()}
              className="mt-1 w-full border-b border-rule bg-transparent py-2 font-ledger text-sm focus:border-credit"
            />
          </label>
        </div>

        {error && <p className="mt-4 text-sm text-debit">{error}</p>}

        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy}
          className="mt-8 w-full bg-ink py-3 font-display text-sm uppercase tracking-[0.18em] text-paper transition hover:bg-credit disabled:opacity-50"
        >
          {busy ? 'Checking…' : 'Sign in'}
        </button>

        <p className="mt-6 text-xs text-muted">
          Seeded account: demo@token-ledger.dev / demo1234
        </p>
      </div>
    </main>
  );
}
