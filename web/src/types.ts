export type Provider = 'azure-openai' | 'azure-mistral' | 'bedrock-claude';

export interface UsageEvent {
  id: string;
  userId: string;
  model: string;
  provider: Provider;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  occurredAt: string;
}

export interface LedgerLine {
  event: UsageEvent;
  cost: number;
  balance: number;
}

export interface ModelTotal {
  model: string;
  provider: Provider;
  calls: number;
  totalTokens: number;
  cost: number;
}

export interface LedgerView {
  summary: {
    calls: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    byModel: ModelTotal[];
  };
  lines: LedgerLine[];
  daily: { day: string; calls: number; totalTokens: number }[];
  budget: { monthly: number; remaining: number; overBudget: boolean };
}

export interface SignedInUser {
  id: string;
  email: string;
  displayName: string;
  monthlyBudget: number;
}

export interface ModelRate {
  model: string;
  provider: Provider;
  inputPerMillion: number;
  outputPerMillion: number;
}
