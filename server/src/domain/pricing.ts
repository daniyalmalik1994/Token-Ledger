import { UnknownModelError } from './errors';

export type Provider = 'azure-openai' | 'azure-mistral' | 'bedrock-claude';

export interface ModelRate {
  provider: Provider;
  /** Charge per one million prompt tokens, in EUR. */
  inputPerMillion: number;
  /** Charge per one million completion tokens, in EUR. */
  outputPerMillion: number;
}

/**
 * The price list. Kept in the domain because "what a call costs" is a business
 * rule, not a storage concern — swapping SQLite for SQL Server must not touch it.
 */
export const MODEL_RATES: Readonly<Record<string, ModelRate>> = {
  'gpt-4o-mini': { provider: 'azure-openai', inputPerMillion: 0.15, outputPerMillion: 0.6 },
  'gpt-4o': { provider: 'azure-openai', inputPerMillion: 2.5, outputPerMillion: 10 },
  'mistral-large': { provider: 'azure-mistral', inputPerMillion: 2, outputPerMillion: 6 },
  'claude-sonnet': { provider: 'bedrock-claude', inputPerMillion: 3, outputPerMillion: 15 },
  'claude-haiku': { provider: 'bedrock-claude', inputPerMillion: 0.8, outputPerMillion: 4 },
};

export function rateFor(model: string): ModelRate {
  const rate = MODEL_RATES[model];
  if (!rate) throw new UnknownModelError(model);
  return rate;
}

export function knownModels(): string[] {
  return Object.keys(MODEL_RATES);
}
