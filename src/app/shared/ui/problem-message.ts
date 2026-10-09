import { ApiProblem } from '../../core/api/api-problem';

/** Wording for a failure that the current screen has no specific handling for. */
export function problemMessage(problem: ApiProblem): string {
  switch (problem.code) {
    case 'NETWORK_ERROR':
      return 'The server could not be reached. Check your connection and try again.';
    case 'RATE_LIMITED':
      return 'Too many requests in a short time. Wait a moment and try again.';
    case 'FORBIDDEN':
      return 'Your account is not allowed to do this.';
    case 'UNAUTHENTICATED':
      return 'Your session has ended. Sign in again to continue.';
    case 'INTERNAL_ERROR':
      return 'Something went wrong on our side. Try again in a moment.';
    default:
      return problem.detail ?? problem.title;
  }
}
