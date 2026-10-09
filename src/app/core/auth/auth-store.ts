import { computed, inject, Injectable, signal } from '@angular/core';
import { map, Observable } from 'rxjs';

import { AuthApi } from '../api/auth-api';
import { LoginRequest, User } from '../api/models';

interface Session {
  accessToken: string;
  /** Epoch milliseconds. */
  expiresAt: number;
  user: User;
}

const STORAGE_KEY = 'venue-desk.session';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authApi = inject(AuthApi);
  private readonly session = signal<Session | null>(restoreSession());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.accessToken ?? null);
  readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');

  /** A method and not a signal because the answer depends on the clock, not only on state. */
  isAuthenticated(): boolean {
    const session = this.session();
    return session !== null && session.expiresAt > Date.now();
  }

  login(credentials: LoginRequest): Observable<User> {
    return this.authApi.login(credentials).pipe(
      map(({ accessToken, expiresIn, user }) => {
        this.setSession({ accessToken, user, expiresAt: Date.now() + expiresIn * 1000 });
        return user;
      }),
    );
  }

  logout(): void {
    this.setSession(null);
  }

  private setSession(session: Session | null): void {
    this.session.set(session);
    try {
      if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // The browser can block storage. The session then lives in memory until the next reload.
    }
  }
}

function restoreSession(): Session | null {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
    return isSession(stored) && stored.expiresAt > Date.now() ? stored : null;
  } catch {
    // Blocked storage or a value that is not JSON: either way there is nothing to restore.
    return null;
  }
}

// Storage is outside the type system: anything could be in there, so every field is checked.
function isSession(value: unknown): value is Session {
  if (!isRecord(value) || !isRecord(value['user'])) return false;
  const { accessToken, expiresAt, user } = value;

  return (
    typeof accessToken === 'string' &&
    typeof expiresAt === 'number' &&
    typeof user['id'] === 'string' &&
    typeof user['name'] === 'string' &&
    typeof user['email'] === 'string' &&
    (user['role'] === 'ADMIN' || user['role'] === 'STAFF')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
