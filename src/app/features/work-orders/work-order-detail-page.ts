import { DatePipe } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize, skip, takeUntil } from 'rxjs';

import { ApiProblem } from '../../core/api/api-problem';
import { loadable } from '../../core/api/loadable';
import { WorkOrderStatus } from '../../core/api/models';
import { WorkOrdersApi } from '../../core/api/work-orders-api';
import { Alert } from '../../shared/ui/alert';
import { Badge } from '../../shared/ui/badge';
import { ErrorState } from '../../shared/ui/error-state';
import { problemMessage } from '../../shared/ui/problem-message';
import { Skeleton } from '../../shared/ui/skeleton';
import { Tone } from '../../shared/ui/tone';
import { WorkOrderActions } from './work-order-actions';
import { PRIORITY, STATUS } from './work-order-labels';

interface Feedback {
  tone: Extract<Tone, 'success' | 'warning' | 'danger'>;
  message: string;
}

@Component({
  selector: 'app-work-order-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Badge, DatePipe, ErrorState, RouterLink, Skeleton, WorkOrderActions],
  templateUrl: './work-order-detail-page.html',
  styleUrl: './work-order-detail-page.scss',
})
export class WorkOrderDetailPage {
  readonly workOrderId = input.required<string>();

  private readonly workOrdersApi = inject(WorkOrdersApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly feedbackElement = viewChild('feedbackElement', { read: ElementRef });

  protected readonly workOrder = loadable(() => this.workOrdersApi.get(this.workOrderId()));
  protected readonly heading = computed(() => {
    const state = this.workOrder.state();
    return state.status === 'ready' ? state.value.title : 'Work order';
  });
  protected readonly statuses = STATUS;
  protected readonly priorities = PRIORITY;

  // The router keeps this component when only the id in the URL changes. What was said about one
  // work order must not carry over to the next, and neither may a response that is still out.
  protected readonly transitioning = linkedSignal({
    source: this.workOrderId,
    computation: () => false,
  });
  protected readonly feedback = linkedSignal<string, Feedback | null>({
    source: this.workOrderId,
    computation: () => null,
  });
  private readonly leftWorkOrder = toObservable(this.workOrderId).pipe(skip(1));

  protected transition(to: WorkOrderStatus): void {
    this.transitioning.set(true);
    this.workOrdersApi
      .transition(this.workOrderId(), to)
      .pipe(
        takeUntil(this.leftWorkOrder),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.transitioning.set(false);
        }),
      )
      .subscribe({
        next: (workOrder) => {
          this.workOrder.set(workOrder);
          this.show({
            tone: 'success',
            message: `Status changed to ${STATUS[workOrder.status].label}.`,
          });
        },
        error: (problem: ApiProblem) => {
          this.onTransitionProblem(problem);
        },
      });
  }

  private onTransitionProblem(problem: ApiProblem): void {
    switch (problem.code) {
      // Both mean the buttons on screen were out of date, so the page is refreshed to show the
      // steps that are really available now.
      case 'INVALID_TRANSITION':
        this.workOrder.reload();
        this.show({
          tone: 'warning',
          message:
            'Someone else changed this work order in the meantime, so that step is no longer possible. The page now shows its current state.',
        });
        break;
      case 'FORBIDDEN':
        this.workOrder.reload();
        this.show({
          tone: 'warning',
          message:
            'You are not allowed to make that change: only the assignee or an admin can. The page now shows the steps open to you.',
        });
        break;
      default:
        this.show({ tone: 'danger', message: problemMessage(problem) });
    }
  }

  private show(feedback: Feedback): void {
    this.feedback.set(feedback);
    // The button that was pressed may be gone after the change. Focus moves to the outcome, which
    // is how it gets read out, so keyboard users are not dropped at the top of the document.
    afterNextRender(
      () => {
        const element = this.feedbackElement()?.nativeElement as HTMLElement | undefined;
        element?.focus();
      },
      { injector: this.injector },
    );
  }
}
