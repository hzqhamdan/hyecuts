import { useState } from 'react';

/**
 * Where a guard sends someone who has no token.
 *
 * A visitor who opens a guarded page without signing in goes to /login.
 * Someone who signs out on the page goes home instead: the guard is still
 * mounted when the token clears, and a redirect to /login would replace the
 * sign-out's own navigation to /.
 *
 * Routes are keyed by location, so every navigation mounts a fresh guard, and
 * opening a guarded page again after signing out goes to /login.
 */
export function useNoTokenRedirect(token: string | null): '/' | '/login' {
  const [signedInOnMount] = useState(() => Boolean(token));
  return signedInOnMount ? '/' : '/login';
}
