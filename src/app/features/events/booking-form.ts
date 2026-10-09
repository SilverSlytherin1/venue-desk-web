import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { FieldError } from '../../core/api/api-problem';
import { BookingRequest } from '../../core/api/models';
import { FieldControl, FormField } from '../../shared/forms/form-field';
import { ValidatedForm } from '../../shared/forms/validated-form';
import { wholeNumber } from '../../shared/forms/validation-message';
import { MAX_SEATS_PER_BOOKING, seatCount } from './availability';

@Component({
  selector: 'app-booking-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FieldControl, FormField, ReactiveFormsModule, ValidatedForm],
  templateUrl: './booking-form.html',
  styles: `
    form {
      display: grid;
      gap: var(--space-4);
    }

    .seats {
      max-width: 8rem;
    }

    button {
      justify-self: start;
    }
  `,
})
export class BookingForm {
  /** The most seats one booking can take right now: the contract limit, capped by seats left. */
  readonly maxSeats = input(MAX_SEATS_PER_BOOKING);
  readonly submitting = input(false);
  readonly serverErrors = input<readonly FieldError[]>([]);
  readonly submitted = output<BookingRequest>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    seats: [
      1,
      [
        Validators.required,
        wholeNumber,
        Validators.min(1),
        // Read on every run: availability can drop while the form is open.
        (control: AbstractControl) => Validators.max(this.maxSeats())(control),
      ],
    ],
  });

  protected readonly seatsHint = computed(() =>
    this.maxSeats() < MAX_SEATS_PER_BOOKING
      ? `Only ${seatCount(this.maxSeats())} left.`
      : `Up to ${seatCount(MAX_SEATS_PER_BOOKING)} per booking.`,
  );

  private readonly validatedForm = viewChild.required(ValidatedForm);

  constructor() {
    // Reactive forms are imperative, so errors that arrive as an input are pushed onto the controls.
    effect(() => {
      const errors = this.serverErrors();
      if (errors.length > 0) {
        untracked(() => {
          this.validatedForm().showServerErrors(errors);
        });
      }
    });
  }

  protected submit(): void {
    this.submitted.emit(this.form.getRawValue());
  }
}
