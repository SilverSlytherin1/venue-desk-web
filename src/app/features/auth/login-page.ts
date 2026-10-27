import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiProblem } from '../../core/api/api-problem';
import { AuthStore } from '../../core/auth/auth-store';
import { FieldControl, FormField } from '../../shared/forms/form-field';
import { ValidatedForm } from '../../shared/forms/validated-form';
import { rejectionSummary } from '../../shared/forms/validation-message';
import { Alert } from '../../shared/ui/alert';
import { Icon } from '../../shared/ui/icon';
import { problemMessage } from '../../shared/ui/problem-message';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, FieldControl, FormField, Icon, ReactiveFormsModule, ValidatedForm],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  // Query parameters set by `authGuard` and by the auth interceptor when a session ends. They
  // arrive in a URL anyone can write, so the return address is only used when it is a path inside
  // the app, and not this page again.
  readonly returnUrl = input('/staff', {
    transform: (url: string | undefined) =>
      url?.startsWith('/') && !url.startsWith('//') && !url.startsWith('/staff/login')
        ? url
        : '/staff',
  });
  readonly reason = input<string>();

  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly validatedForm = viewChild.required(ValidatedForm);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly submitting = signal(false);
  protected readonly failure = signal<string | null>(null);

  protected signIn(): void {
    this.submitting.set(true);
    this.failure.set(null);

    this.auth
      .login(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigateByUrl(this.returnUrl()),
        error: (problem: ApiProblem) => {
          this.submitting.set(false);
          this.onProblem(problem);
        },
      });
  }

  private onProblem(problem: ApiProblem): void {
    switch (problem.code) {
      case 'INVALID_CREDENTIALS':
        this.failure.set('The email or password is not correct.');
        break;
      case 'RATE_LIMITED':
        this.failure.set('Too many sign-in attempts. Wait a minute, then try again.');
        break;
      case 'VALIDATION_FAILED':
        this.validatedForm().showServerErrors(problem.errors);
        this.failure.set(rejectionSummary(problem.errors, this.form.controls));
        break;
      default:
        this.failure.set(problemMessage(problem));
    }
  }
}
