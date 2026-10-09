import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { toApiProblem } from './api-problem';

/**
 * The only place that knows about HTTP failures. Everything downstream receives an `ApiProblem`
 * and switches on its `code`.
 */
export const problemInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((response: HttpErrorResponse) => throwError(() => toApiProblem(response))),
  );
