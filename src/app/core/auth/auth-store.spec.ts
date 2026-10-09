import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { flushProblem, provideApiTesting, signInAs } from '../../../testing/app-testing';
import { makeUser } from '../../../testing/builders';
import { ApiProblem } from '../api/api-problem';
import { AuthStore } from './auth-store';

describe('AuthStore', () => {
  const admin = makeUser({ name: 'Alex Admin', role: 'ADMIN' });

  /** A fresh injector, which is what a page reload gives the store. */
  function reload(): AuthStore {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideApiTesting()] });
    return TestBed.inject(AuthStore);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideApiTesting()] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts anonymous', () => {
    const store = TestBed.inject(AuthStore);

    expect(store.isAuthenticated()).toBe(false);
    expect(store.user()).toBeNull();
    expect(store.token()).toBeNull();
  });

  it('holds the user and token after a successful login', () => {
    const store = TestBed.inject(AuthStore);

    signInAs(admin);

    expect(store.user()).toEqual(admin);
    expect(store.token()).toBe('test-token');
    expect(store.isAdmin()).toBe(true);
  });

  it('stays anonymous when the API rejects the credentials', () => {
    const store = TestBed.inject(AuthStore);
    let problem: ApiProblem | undefined;

    store.login({ email: admin.email, password: 'wrong' }).subscribe({
      error: (received: ApiProblem) => (problem = received),
    });
    flushProblem(
      TestBed.inject(HttpTestingController).expectOne('/api/v1/auth/login'),
      401,
      'INVALID_CREDENTIALS',
    );

    expect(problem?.code).toBe('INVALID_CREDENTIALS');
    expect(store.isAuthenticated()).toBe(false);
  });

  it('restores the session after a page reload', () => {
    signInAs(admin);

    const store = reload();

    expect(store.user()).toEqual(admin);
    expect(store.token()).toBe('test-token');
  });

  it('does not restore a session whose token has expired', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    signInAs(admin);

    vi.advanceTimersByTime(901_000);

    expect(reload().isAuthenticated()).toBe(false);
  });

  it('stops counting as signed in once the token expires, without a reload', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const store = TestBed.inject(AuthStore);
    signInAs(admin);

    vi.advanceTimersByTime(899_000);
    expect(store.isAuthenticated()).toBe(true);

    vi.advanceTimersByTime(2_000);
    expect(store.isAuthenticated()).toBe(false);
  });

  it('works for the life of the page when the browser blocks storage', () => {
    const blocked = () => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked);

    const store = TestBed.inject(AuthStore);
    expect(store.isAuthenticated()).toBe(false);

    signInAs(admin);
    expect(store.user()).toEqual(admin);

    store.logout();
    expect(store.isAuthenticated()).toBe(false);
  });

  it('does not restore a stored session that is not in the expected shape', () => {
    signInAs(admin);
    const key = sessionStorage.key(0) ?? '';
    sessionStorage.setItem(key, JSON.stringify({ accessToken: 42, user: 'Alex' }));

    expect(reload().isAuthenticated()).toBe(false);
  });

  it('forgets the session on logout, also across a reload', () => {
    const store = TestBed.inject(AuthStore);
    signInAs(admin);

    store.logout();

    expect(store.isAuthenticated()).toBe(false);
    expect(reload().isAuthenticated()).toBe(false);
  });
});
