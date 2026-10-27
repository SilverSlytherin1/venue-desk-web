import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  linkedSignal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { map, startWith } from 'rxjs';

import { ApiProblem } from '../../core/api/api-problem';
import { FeedbackApi } from '../../core/api/feedback-api';
import { loadable } from '../../core/api/loadable';
import { FeedbackRequest } from '../../core/api/models';
import { VenueDatePipe } from '../../shared/format/venue-date';
import { FieldControl, FormField } from '../../shared/forms/form-field';
import { ValidatedForm } from '../../shared/forms/validated-form';
import { rejectionSummary, SERVER_ERROR } from '../../shared/forms/validation-message';
import { Alert } from '../../shared/ui/alert';
import { ErrorState } from '../../shared/ui/error-state';
import { problemMessage } from '../../shared/ui/problem-message';
import { Skeleton } from '../../shared/ui/skeleton';
import { Stars } from '../../shared/ui/stars';
import { RATING_WORDS } from './rating-words';

export const MAX_COMMENT_LENGTH = 1000;

type Submission =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'failed'; message: string }
  /** Saved now, or found saved already: either way the guest has nothing left to do. */
  | { status: 'done'; rating: number; already: boolean };

/** Codes that mean the link itself is wrong, so trying again cannot help. */
const BROKEN_LINK = ['FEEDBACK_NOT_FOUND', 'NOT_FOUND', 'VALIDATION_FAILED'];

/**
 * The page a guest opens from the link in the email the day after the event. The token in the URL
 * is the only credential, so the page shows no more than the API returns for it.
 */
@Component({
  selector: 'app-feedback-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Alert,
    ErrorState,
    FieldControl,
    FormField,
    ReactiveFormsModule,
    RouterLink,
    Skeleton,
    Stars,
    ValidatedForm,
    VenueDatePipe,
  ],
  templateUrl: './feedback-page.html',
  styleUrl: './feedback-page.scss',
})
export class FeedbackPage {
  readonly token = input.required<string>();

  private readonly feedbackApi = inject(FeedbackApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly validatedForm = viewChild(ValidatedForm);

  protected readonly invitation = loadable(() => this.feedbackApi.invitation(this.token()));
  protected readonly ratings = [1, 2, 3, 4, 5] as const;
  protected readonly words = RATING_WORDS;
  protected readonly maxLength = MAX_COMMENT_LENGTH;

  protected readonly form = inject(NonNullableFormBuilder).group({
    rating: [0, Validators.min(1)],
    comment: ['', Validators.maxLength(MAX_COMMENT_LENGTH)],
  });

  protected readonly submission = linkedSignal<string, Submission>({
    source: this.token,
    computation: () => ({ status: 'idle' }),
  });

  private readonly ratingControl = this.form.controls.rating;
  protected readonly rating = toSignal(this.ratingControl.valueChanges, {
    initialValue: this.ratingControl.value,
  });
  protected readonly commentLength = toSignal(
    this.form.controls.comment.valueChanges.pipe(map((value) => value.length)),
    { initialValue: 0 },
  );
  /** Shown once the guest tried to send without choosing, like the field errors of `FormField`. */
  protected readonly ratingError = toSignal(
    this.ratingControl.events.pipe(
      startWith(null),
      map(() => {
        const { touched, errors } = this.ratingControl;
        if (!touched || !errors) return null;
        return SERVER_ERROR in errors
          ? (errors[SERVER_ERROR] as string)
          : 'Choose a rating from 1 to 5 stars.';
      }),
    ),
    { initialValue: null },
  );

  protected readonly heading = computed(() => {
    const state = this.invitation.state();
    return state.status === 'ready' ? `How was ${state.value.eventTitle}?` : 'Your feedback';
  });

  /** What the page shows instead of the form, if anything. */
  protected readonly outcome = computed(() => {
    const submission = this.submission();
    if (submission.status === 'done') return submission;
    const state = this.invitation.state();
    if (state.status === 'ready' && state.value.submitted) {
      return { status: 'done' as const, rating: state.value.rating ?? 0, already: true };
    }
    return null;
  });

  protected isBrokenLink(problem: ApiProblem): boolean {
    return BROKEN_LINK.includes(problem.code);
  }

  protected send(): void {
    const { rating, comment } = this.form.getRawValue();
    const trimmed = comment.trim();
    const request: FeedbackRequest = trimmed ? { rating, comment: trimmed } : { rating };

    this.submission.set({ status: 'submitting' });
    this.feedbackApi
      .submit(this.token(), request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (receipt) => {
          this.submission.set({ status: 'done', rating: receipt.rating, already: false });
        },
        error: (problem: ApiProblem) => {
          this.onProblem(problem);
        },
      });
  }

  private onProblem(problem: ApiProblem): void {
    switch (problem.code) {
      case 'FEEDBACK_ALREADY_SUBMITTED':
        // Sent from another tab, or an answer that got lost on the way back: the API has it.
        this.submission.set({ status: 'idle' });
        this.invitation.reload();
        break;
      case 'FEEDBACK_NOT_OPEN':
        this.fail('Feedback is not open for this booking any more.');
        break;
      case 'FEEDBACK_NOT_FOUND':
        this.fail('This feedback link no longer works.');
        break;
      case 'VALIDATION_FAILED':
        this.validatedForm()?.showServerErrors(problem.errors);
        this.fail(rejectionSummary(problem.errors, this.form.controls));
        break;
      default:
        // A second send is harmless: the API keeps one answer per booking and says so.
        this.fail(problemMessage(problem));
    }
  }

  private fail(message: string): void {
    this.submission.set({ status: 'failed', message });
  }
}
