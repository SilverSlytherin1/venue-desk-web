import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ApiProblem } from '../../core/api/api-problem';
import { EventsApi } from '../../core/api/events-api';
import { loadable } from '../../core/api/loadable';
import { WORK_ORDER_PRIORITIES, WorkOrderPriority } from '../../core/api/models';
import { UsersApi } from '../../core/api/users-api';
import { WorkOrdersApi } from '../../core/api/work-orders-api';
import { FieldControl, FormField } from '../../shared/forms/form-field';
import { ValidatedForm } from '../../shared/forms/validated-form';
import { rejectionSummary } from '../../shared/forms/validation-message';
import { Alert } from '../../shared/ui/alert';
import { problemMessage } from '../../shared/ui/problem-message';
import { PRIORITY } from './work-order-labels';

/** The most the contract returns in one page. */
const EVENT_OPTIONS_LIMIT = 100;

@Component({
  selector: 'app-work-order-create-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Alert,
    DatePipe,
    FieldControl,
    FormField,
    ReactiveFormsModule,
    RouterLink,
    ValidatedForm,
  ],
  templateUrl: './work-order-create-page.html',
  styleUrl: './work-order-create-page.scss',
})
export class WorkOrderCreatePage {
  private readonly workOrdersApi = inject(WorkOrdersApi);
  private readonly eventsApi = inject(EventsApi);
  private readonly usersApi = inject(UsersApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly validatedForm = viewChild.required(ValidatedForm);

  // Both lists only feed optional fields, so they load on their own and the form never waits for
  // them: a work order can be created while one is loading, or after one failed.
  protected readonly events = loadable(() => this.eventsApi.list(1, EVENT_OPTIONS_LIMIT));
  protected readonly users = loadable(() => this.usersApi.list());
  protected readonly eventsHint = computed(() => {
    const state = this.events.state();
    if (state.status === 'loading') return 'Loading events…';
    if (state.status === 'error') return undefined;

    const { items, total } = state.value;
    return total > items.length
      ? `Only the next ${items.length} of ${total} events are listed.`
      : undefined;
  });

  protected readonly form = this.formBuilder.group({
    title: ['', Validators.required],
    // The API accepts a work order with no description, so the form does too.
    description: '',
    priority: this.formBuilder.control<WorkOrderPriority>('MEDIUM', Validators.required),
    // An empty string is the "none" option of the select.
    eventId: '',
    assigneeId: '',
  });
  protected readonly priorities = WORK_ORDER_PRIORITIES;
  protected readonly priorityLabels = PRIORITY;
  protected readonly submitting = signal(false);
  protected readonly failure = signal<string | null>(null);

  protected create(): void {
    const { eventId, assigneeId, ...required } = this.form.getRawValue();

    this.submitting.set(true);
    this.failure.set(null);
    this.workOrdersApi
      .create({ ...required, ...(eventId && { eventId }), ...(assigneeId && { assigneeId }) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (workOrder) =>
          void this.router.navigate(['..', workOrder.id], { relativeTo: this.route }),
        error: (problem: ApiProblem) => {
          this.submitting.set(false);
          if (problem.code === 'VALIDATION_FAILED') {
            this.validatedForm().showServerErrors(problem.errors);
            this.failure.set(rejectionSummary(problem.errors, this.form.controls));
          } else {
            this.failure.set(problemMessage(problem));
          }
        },
      });
  }
}
