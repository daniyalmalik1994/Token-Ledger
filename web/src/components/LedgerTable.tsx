import type { LedgerLine } from '../types';

const eur = (value: number) =>
  value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 4 });

const stamp = (iso: string) =>
  new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export function LedgerTable({ lines }: { lines: LedgerLine[] }) {
  if (lines.length === 0) {
    return (
      <section className="sheet px-6 py-16 text-center sm:px-8">
        <p className="font-display text-lg">No entries yet</p>
        <p className="mt-2 text-sm text-muted">Post a call below and it will appear here as the first line.</p>
      </section>
    );
  }

  return (
    <section className="sheet overflow-x-auto">
      <table className="w-full min-w-[42rem] border-collapse text-sm">
        <caption className="px-6 pt-6 text-left sm:px-8">
          <span className="eyebrow">Entries · newest first</span>
        </caption>
        <thead>
          <tr className="double-rule text-left">
            {['Posted', 'Model', 'Prompt', 'Completion', 'Latency', 'Debit', 'Balance'].map((heading, index) => (
              <th
                key={heading}
                scope="col"
                className={`px-3 py-3 font-display text-[11px] uppercase tracking-[0.14em] text-muted ${
                  index >= 2 ? 'text-right' : ''
                } ${index === 0 ? 'pl-6 sm:pl-8' : ''} ${index === 6 ? 'pr-6 sm:pr-8' : ''}`}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map(({ event, cost, balance }) => (
            <tr key={event.id} className="border-b border-rule/70 last:border-0 hover:bg-paper/70">
              <td className="figure whitespace-nowrap px-3 py-2.5 pl-6 text-muted sm:pl-8">{stamp(event.occurredAt)}</td>
              <td className="px-3 py-2.5">
                <span className="font-medium">{event.model}</span>
                <span className="ml-2 text-xs text-muted">{event.provider}</span>
              </td>
              <td className="figure px-3 py-2.5 text-right">{event.promptTokens.toLocaleString('de-DE')}</td>
              <td className="figure px-3 py-2.5 text-right">{event.completionTokens.toLocaleString('de-DE')}</td>
              <td className="figure px-3 py-2.5 text-right text-muted">{event.latencyMs} ms</td>
              <td className="figure px-3 py-2.5 text-right">{eur(cost)}</td>
              <td
                className={`figure px-3 py-2.5 pr-6 text-right sm:pr-8 ${balance < 0 ? 'text-debit' : 'text-ink'}`}
              >
                {eur(balance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
