import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { ModelRate } from '../types';

interface Props {
  token: string;
  onRecorded: () => void;
}

export function RecordCall({ token, onRecorded }: Props) {
  const [models, setModels] = useState<ModelRate[]>([]);
  const [model, setModel] = useState('gpt-4o-mini');
  const [promptTokens, setPromptTokens] = useState(1400);
  const [completionTokens, setCompletionTokens] = useState(320);
  const [latencyMs, setLatencyMs] = useState(850);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .models()
      .then((response) => setModels(response.models))
      .catch(() => setModels([]));
  }, []);

  const post = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const { cost } = await api.recordCall(token, { model, promptTokens, completionTokens, latencyMs });
      setMessage(`Posted — ${cost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 4 })}`);
      onRecorded();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const field = (label: string, value: number, set: (next: number) => void) => (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(event) => set(Number(event.target.value))}
        className="mt-1 w-full border-b border-rule bg-transparent py-2 font-ledger text-sm tabular-nums focus:border-credit"
      />
    </label>
  );

  return (
    <section className="sheet px-6 py-6 sm:px-8">
      <p className="eyebrow">Post an entry</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <label className="block">
          <span className="eyebrow">Model</span>
          <select
            value={model}
            onChange={(event) => setModel(event.target.value)}
            className="mt-1 w-full border-b border-rule bg-transparent py-2 font-ledger text-sm focus:border-credit"
          >
            {models.map((rate) => (
              <option key={rate.model} value={rate.model}>
                {rate.model}
              </option>
            ))}
          </select>
        </label>
        {field('Prompt tokens', promptTokens, setPromptTokens)}
        {field('Completion tokens', completionTokens, setCompletionTokens)}
        {field('Latency (ms)', latencyMs, setLatencyMs)}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => void post()}
          disabled={busy}
          className="bg-ink px-6 py-2.5 font-display text-xs uppercase tracking-[0.18em] text-paper transition hover:bg-credit disabled:opacity-50"
        >
          {busy ? 'Posting…' : 'Post entry'}
        </button>
        {message && <span className="figure text-sm text-credit">{message}</span>}
        {error && <span className="text-sm text-debit">{error}</span>}
      </div>
    </section>
  );
}
