import jwt, { type SignOptions } from 'jsonwebtoken';
import type { TokenService } from '../application/ports';
import { AuthError } from '../domain/errors';

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly ttl: SignOptions['expiresIn'] = '8h',
  ) {}

  sign(payload: { sub: string; email: string }): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.ttl });
  }

  verify(token: string): { sub: string; email: string } {
    try {
      const decoded = jwt.verify(token, this.secret) as jwt.JwtPayload;
      if (typeof decoded.sub !== 'string' || typeof decoded.email !== 'string') {
        throw new AuthError('Token is missing required claims');
      }
      return { sub: decoded.sub, email: decoded.email };
    } catch {
      throw new AuthError('Session expired — sign in again');
    }
  }
}
