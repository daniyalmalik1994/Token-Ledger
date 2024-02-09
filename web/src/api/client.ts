import type { LedgerView, ModelRate, SignedInUser } from '../types';

const BASE = '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function send<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, headers, ...rest } = init;
  const response = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError((payload as { message?: string }).message ?? 'The request failed', response.status);
  }
  return payload as T;
}

export const api = {
  login: (email: string, password: string) =>
    send<{ token: string; user: SignedInUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  ledger: (token: string, days: number) => send<LedgerView>(`/usage/ledger?days=${days}`, { token }),

  models: () => send<{ models: ModelRate[] }>('/models'),

  recordCall: (
    token: string,
    body: { model: string; promptTokens: number; completionTokens: number; latencyMs: number },
  ) => send<{ cost: number }>('/usage', { method: 'POST', token, body: JSON.stringify(body) }),
};
