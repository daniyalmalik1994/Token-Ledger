import bcrypt from 'bcryptjs';
import { AuthError } from '../domain/errors';
import type { TokenService, UserRepository } from './ports';

export interface SignInResult {
  token: string;
  user: { id: string; email: string; displayName: string; monthlyBudget: number };
}

export function signIn(
  deps: { users: UserRepository; tokens: TokenService },
  input: { email: string; password: string },
): SignInResult {
  const user = deps.users.findByEmail(input.email.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(input.password, user.passwordHash)) {
    throw new AuthError();
  }
  return {
    token: deps.tokens.sign({ sub: user.id, email: user.email }),
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      monthlyBudget: user.monthlyBudget,
    },
  };
}
