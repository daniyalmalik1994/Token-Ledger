import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { LedgerView } from '../types';

interface State {
  data: LedgerView | null;
  error: string | null;
  loading: boolean;
}

/** Loads the ledger and exposes a reload so a new entry shows up immediately. */
export function useLedger(token: string | null, days: number) {
  const [state, setState] = useState<State>({ data: null, error: null, loading: Boolean(token) });

  const reload = useCallback(async () => {
    if (!token) return;
    setState((previous) => ({ ...previous, loading: true }));
    try {
      const data = await api.ledger(token, days);
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState({ data: null, error: (error as Error).message, loading: false });
    }
  }, [token, days]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ...state, reload };
}
