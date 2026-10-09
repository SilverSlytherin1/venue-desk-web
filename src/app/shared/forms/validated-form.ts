import { afterNextRender, Directive, ElementRef, inject, Injector, output } from '@angular/core';
import { FormGroupDirective } from '@angular/forms';

import { FieldError } from '../../core/api/api-problem';
import { SERVER_ERROR } from './validation-message';

/**
 * Submit behaviour shared by every form: validate everything, emit only when valid, otherwise
 * take the user to the first field that needs attention. The submit button is never disabled for
 * an invalid form, because a disabled button cannot explain what is wrong.
 */
@Directive({
  selector: 'form[formGroup][appValidatedForm]',
  host: { '(submit)': 'onSubmit()' },
})
export class ValidatedForm {
  readonly validSubmit = output();

  private readonly formGroup = inject(FormGroupDirective);
  private readonly element = inject<ElementRef<HTMLFormElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);

  /** Puts the API's field errors on the matching controls, where the next edit clears them. */
  showServerErrors(errors: readonly FieldError[]): void {
    for (const { field, message } of errors) {
      const control = this.formGroup.form.get(field);
      control?.setErrors({ [SERVER_ERROR]: message });
      control?.markAsTouched();
    }
    this.focusFirstInvalid();
  }

  protected onSubmit(): void {
    const { form } = this.formGroup;
    // Validators can depend on state outside the form, such as the seats still available, so
    // they all run again instead of trusting the result of the last keystroke.
    for (const control of Object.values(form.controls)) control.updateValueAndValidity();
    form.markAllAsTouched();

    if (form.valid) this.validSubmit.emit();
    else this.focusFirstInvalid();
  }

  private focusFirstInvalid(): void {
    // The invalid state reaches the DOM on the next render, not synchronously.
    afterNextRender(
      () => this.element.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      { injector: this.injector },
    );
  }
}
