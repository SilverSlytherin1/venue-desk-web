import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { ApiProblem } from '../api/api-problem';
import { AuthStore } from './auth-store';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  const token = auth.token();

  // The token is attached to API calls only, so it can never leak to another origin.
  if (token === null || !request.url.startsWith(`${inject(API_BASE_URL)}/`)) {
    return next(request);
  }

  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((problem: ApiProblem) => {
      // Several calls can fail on the same dead token. Only the first one ends the session: by
      // the time the others arrive the page is the login form, and its URL as the return address
      // would send the user straight back to it after signing in.
      if (problem.code === 'UNAUTHENTICATED' && auth.token() === token) {
        auth.logout();
        void router.navigate(['/staff/login'], {
          queryParams: { returnUrl: router.url, reason: 'expired' },
        });
      }
      return throwError(() => problem);
    }),
  );
};
