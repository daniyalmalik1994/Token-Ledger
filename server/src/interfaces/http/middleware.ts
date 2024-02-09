import type { NextFunction, Request, Response } from 'express';
import { DomainError } from '../../domain/errors';
import type { TokenService } from '../../application/ports';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { userId: string; email: string };
    }
  }
}

export function requireAuth(tokens: TokenService) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.header('authorization') ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      res.status(401).json({ code: 'unauthorized', message: 'Add an Authorization: Bearer <token> header' });
      return;
    }
    try {
      const claims = tokens.verify(token);
      req.auth = { userId: claims.sub, email: claims.email };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ code: 'not_found', message: 'No route matches that path' });
}

// Express identifies error middleware by arity, so `next` has to stay.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof DomainError) {
    res.status(error.status).json({ code: error.code, message: error.message });
    return;
  }
  console.error('[token-ledger] unhandled error', error);
  res.status(500).json({ code: 'internal_error', message: 'Something broke on our side' });
}
