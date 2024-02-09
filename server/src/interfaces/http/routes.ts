import { Router, type Request, type Response, type NextFunction } from 'express';
import { z, type ZodTypeAny } from 'zod';
import { InvalidUsageError } from '../../domain/errors';
import { MODEL_RATES } from '../../domain/pricing';
import { getLedger } from '../../application/getLedger';
import { recordUsage } from '../../application/recordUsage';
import { signIn } from '../../application/signIn';
import type { IdGenerator, TokenService, UsageRepository, UserRepository } from '../../application/ports';
import { requireAuth } from './middleware';

export interface RouterDeps {
  users: UserRepository;
  usage: UsageRepository;
  tokens: TokenService;
  ids: IdGenerator;
}

function parse<S extends ZodTypeAny>(schema: S, payload: unknown): z.infer<S> {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const first = result.error.issues[0];
    const where = first?.path.join('.') || 'body';
    throw new InvalidUsageError(`${where}: ${first?.message ?? 'is invalid'}`);
  }
  return result.data;
}

const credentialsSchema = z.object({
  email: z.string().email('must be a valid email address'),
  password: z.string().min(8, 'must be at least 8 characters'),
});

const usageSchema = z.object({
  model: z.string().min(1, 'is required'),
  promptTokens: z.number().int('must be a whole number').nonnegative(),
  completionTokens: z.number().int('must be a whole number').nonnegative(),
  latencyMs: z.number().int().nonnegative().default(0),
  occurredAt: z.string().datetime().optional(),
});

const ledgerSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  days: z.coerce.number().int().min(1).max(90).default(14),
});

/** Thin wrapper so a throwing handler still reaches the error middleware. */
const handle =
  (fn: (req: Request, res: Response) => void) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      fn(req, res);
    } catch (error) {
      next(error);
    }
  };

export function buildRouter(deps: RouterDeps): Router {
  const router = Router();
  const auth = requireAuth(deps.tokens);

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
  });

  router.get('/models', (_req, res) => {
    res.json({
      models: Object.entries(MODEL_RATES).map(([model, rate]) => ({ model, ...rate })),
    });
  });

  router.post(
    '/auth/login',
    handle((req, res) => {
      const credentials = parse(credentialsSchema, req.body);
      res.json(signIn({ users: deps.users, tokens: deps.tokens }, credentials));
    }),
  );

  router.post(
    '/usage',
    auth,
    handle((req, res) => {
      const draft = parse(usageSchema, req.body);
      const result = recordUsage(
        { usage: deps.usage, ids: deps.ids },
        { ...draft, userId: req.auth!.userId },
      );
      res.status(201).json(result);
    }),
  );

  router.get(
    '/usage/ledger',
    auth,
    handle((req, res) => {
      const query = parse(ledgerSchema, req.query);
      res.json(getLedger({ usage: deps.usage, users: deps.users }, { ...query, userId: req.auth!.userId }));
    }),
  );

  return router;
}
