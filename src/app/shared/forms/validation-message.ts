import { AbstractControl, ValidationErrors } from '@angular/forms';

import { FieldError } from '../../core/api/api-problem';

/** Error key that carries a message from the API's `errors` array. */
export const SERVER_ERROR = 'server';

/** `min` and `max` let 1.5 through. */
export function wholeNumber(control: AbstractControl): ValidationErrors | null {
  return Number.isInteger(control.value) ? null : { wholeNumber: true };
}

/**
 * The one place that words validation errors, so every form says the same thing the same way.
 *
 * `ValidationErrors` is an untyped bag: the casts below state the shapes that Angular's built-in
 * validators are documented to produce.
 */
export function validationMessage(errors: ValidationErrors, label: string): string {
  if (SERVER_ERROR in errors) return errors[SERVER_ERROR] as string;
  if ('required' in errors) return `${label} is required.`;
  if ('email' in errors) return 'Enter an email address like name@example.com.';
  if ('wholeNumber' in errors) return `${label} must be a whole number.`;
  if ('min' in errors) return `${label} must be ${(errors['min'] as { min: number }).min} or more.`;
  if ('max' in errors) return `${label} must be ${(errors['max'] as { max: number }).max} or less.`;

  return `${label} is not valid.`;
}

/**
 * Summary for a form the API rejected. An error for a field that is on screen is shown next to
 * that field; an error for anything else has nowhere to go, so it is spelled out here.
 */
export function rejectionSummary(errors: readonly FieldError[], fields: object): string {
  const elsewhere = errors.filter(({ field }) => !(field in fields));
  if (elsewhere.length > 0) return elsewhere.map(({ message }) => message).join(' ');

  return errors.length > 0
    ? 'Check the highlighted fields and try again.'
    : 'The server did not accept these details. Try again.';
}
