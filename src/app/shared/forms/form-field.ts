import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  inject,
  input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, Validators } from '@angular/forms';
import { map, startWith, switchMap } from 'rxjs';

import { validationMessage } from './validation-message';

let nextId = 0;

/**
 * Label, hint and error message for one control. The control itself is projected and carries
 * `appFieldControl`, which ties it to these texts.
 */
@Component({
  selector: 'app-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label [for]="controlId">
      {{ label() }}
      @if (!required()) {
        <span class="muted">(optional)</span>
      }
    </label>
    @if (hint(); as hint) {
      <p class="muted" [id]="hintId">{{ hint }}</p>
    }
    <ng-content />
    @if (error(); as error) {
      <p class="error" [id]="errorId">{{ error }}</p>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--space-1);
    }

    label {
      font-weight: var(--weight-medium);
    }

    p {
      font-size: var(--text-sm);
    }

    .muted {
      font-weight: var(--weight-regular);
    }

    .error {
      color: var(--color-danger);
      font-weight: var(--weight-medium);
    }
  `,
})
export class FormField {
  readonly label = input.required<string>();
  readonly control = input.required<AbstractControl>();
  readonly hint = input<string>();

  readonly controlId = `field-${nextId++}`;
  protected readonly hintId = `${this.controlId}-hint`;
  protected readonly errorId = `${this.controlId}-error`;

  readonly required = computed(() => this.control().hasValidator(Validators.required));

  /**
   * Stays empty until the user has left the field or tried to submit, so nobody is told that a
   * half-typed email is invalid. After that it follows every change and clears as soon as the
   * value is fixed.
   */
  readonly error = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) =>
        control.events.pipe(
          startWith(null),
          map(() =>
            control.touched && control.errors
              ? validationMessage(control.errors, this.label())
              : null,
          ),
        ),
      ),
    ),
    { initialValue: null },
  );

  readonly describedBy = computed(() => {
    const ids = [this.hint() && this.hintId, this.error() && this.errorId].filter(Boolean);
    return ids.length > 0 ? ids.join(' ') : null;
  });
}

@Directive({
  selector: '[appFieldControl]',
  host: {
    '[id]': 'field.controlId',
    '[attr.aria-describedby]': 'field.describedBy()',
    '[attr.aria-invalid]': 'field.error() !== null',
    '[attr.aria-required]': 'field.required()',
  },
})
export class FieldControl {
  protected readonly field = inject(FormField);
}
