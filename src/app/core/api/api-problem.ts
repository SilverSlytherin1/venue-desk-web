import { HttpErrorResponse } from '@angular/common/http';

const SERVER_CODES = [
  'VALIDATION_FAILED',
  'INVALID_CREDENTIALS',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'EVENT_SOLD_OUT',
  'EVENT_CLOSED',
  'IDEMPOTENCY_KEY_REUSED',
  'INVALID_TRANSITION',
  'RATE_LIMITED',
  'FEEDBACK_NOT_FOUND',
  'FEEDBACK_NOT_OPEN',
  'FEEDBACK_ALREADY_SUBMITTED',
  'INTERNAL_ERROR',
] as const;

type ServerCode = (typeof SERVER_CODES)[number];

export interface FieldError {
  field: string;
  message: string;
}

interface ProblemBase {
  status: number;
  title: string;
  detail?: string;
}

/**
 * Every failed HTTP call surfaces as one of these. `code` is the contract's stable machine code,
 * plus `NETWORK_ERROR` for the case where no API response exists to carry one.
 */
export type ApiProblem =
  | (ProblemBase & { code: 'VALIDATION_FAILED'; errors: FieldError[] })
  | (ProblemBase & { code: 'EVENT_SOLD_OUT'; seatsLeft: number })
  | (ProblemBase & {
      code: Exclude<ServerCode, 'VALIDATION_FAILED' | 'EVENT_SOLD_OUT'> | 'NETWORK_ERROR';
    });

// Used only when the body is not a problem document, for example an error page from a proxy.
const CODE_BY_STATUS: Partial<Record<number, ServerCode>> = {
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  429: 'RATE_LIMITED',
};

const GATEWAY_STATUSES = [502, 503, 504];

export function toApiProblem({ status, error }: HttpErrorResponse): ApiProblem {
  // Status 0 means the browser got no response at all. A gateway error means the API was not reached.
  if (status === 0 || GATEWAY_STATUSES.includes(status)) {
    return { code: 'NETWORK_ERROR', status, title: 'The server could not be reached' };
  }

  const body = isRecord(error) ? error : {};
  const base: ProblemBase = {
    status,
    title: typeof body['title'] === 'string' ? body['title'] : 'Request failed',
    ...(typeof body['detail'] === 'string' && { detail: body['detail'] }),
  };
  const code = isServerCode(body['code'])
    ? body['code']
    : (CODE_BY_STATUS[status] ?? 'INTERNAL_ERROR');

  switch (code) {
    case 'VALIDATION_FAILED':
      return { ...base, code, errors: toFieldErrors(body['errors']) };
    case 'EVENT_SOLD_OUT':
      return {
        ...base,
        code,
        seatsLeft: typeof body['seatsLeft'] === 'number' ? body['seatsLeft'] : 0,
      };
    default:
      return { ...base, code };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isServerCode(value: unknown): value is ServerCode {
  return SERVER_CODES.some((code) => code === value);
}

function toFieldErrors(value: unknown): FieldError[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is FieldError =>
      isRecord(item) && typeof item['field'] === 'string' && typeof item['message'] === 'string',
  );
}
