import { describe, expect, it } from 'vitest';
import { costOf, createUsageEvent, summarise, toLedgerLines, type UsageEvent } from '../src/domain/usage';
import { UnknownModelError, InvalidUsageError } from '../src/domain/errors';

const event = (over: Partial<UsageEvent> = {}): UsageEvent => ({
  id: 'e1',
  userId: 'u1',
  model: 'gpt-4o-mini',
  provider: 'azure-openai',
  promptTokens: 1_000_000,
  completionTokens: 1_000_000,
  latencyMs: 500,
  occurredAt: '2026-05-01T10:00:00.000Z',
  ...over,
});

describe('costOf', () => {
  it('charges prompt and completion tokens at their own rates', () => {
    expect(costOf(event())).toBeCloseTo(0.75, 6);
  });

  it('is zero for a call that used no tokens', () => {
    expect(costOf(event({ promptTokens: 0, completionTokens: 0 }))).toBe(0);
  });

  it('refuses models that are not on the price list', () => {
    expect(() => costOf(event({ model: 'gpt-9-ultra' }))).toThrow(UnknownModelError);
  });
});

describe('createUsageEvent', () => {
  it('derives the provider from the model', () => {
    const created = createUsageEvent(
      { userId: 'u1', model: 'claude-sonnet', promptTokens: 10, completionTokens: 5, latencyMs: 1 },
      'e2',
    );
    expect(created.provider).toBe('bedrock-claude');
  });

  it('rejects fractional token counts', () => {
    expect(() =>
      createUsageEvent(
        { userId: 'u1', model: 'gpt-4o', promptTokens: 1.5, completionTokens: 0, latencyMs: 0 },
        'e3',
      ),
    ).toThrow(InvalidUsageError);
  });
});

describe('summarise', () => {
  it('groups by model and orders the most expensive first', () => {
    const summary = summarise([
      event({ id: 'a', model: 'gpt-4o-mini' }),
      event({ id: 'b', model: 'claude-sonnet', provider: 'bedrock-claude' }),
      event({ id: 'c', model: 'gpt-4o-mini' }),
    ]);

    expect(summary.calls).toBe(3);
    expect(summary.totalTokens).toBe(6_000_000);
    expect(summary.byModel[0]?.model).toBe('claude-sonnet');
    expect(summary.byModel[1]?.calls).toBe(2);
  });

  it('returns an empty shape rather than throwing on no data', () => {
    expect(summarise([])).toMatchObject({ calls: 0, cost: 0, byModel: [] });
  });
});

describe('toLedgerLines', () => {
  it('carries the balance forward oldest call first', () => {
    const lines = toLedgerLines(
      [
        event({ id: 'later', occurredAt: '2026-05-02T10:00:00.000Z' }),
        event({ id: 'earlier', occurredAt: '2026-05-01T10:00:00.000Z' }),
      ],
      2,
    );

    expect(lines.map((line) => line.event.id)).toEqual(['earlier', 'later']);
    expect(lines[0]?.balance).toBeCloseTo(1.25, 6);
    expect(lines[1]?.balance).toBeCloseTo(0.5, 6);
  });

  it('goes negative once the budget is spent', () => {
    const lines = toLedgerLines([event()], 0.5);
    expect(lines[0]?.balance).toBeLessThan(0);
  });
});
