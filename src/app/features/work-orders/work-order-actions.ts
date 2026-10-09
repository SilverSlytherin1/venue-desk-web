import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';

import { WorkOrder, WorkOrderStatus } from '../../core/api/models';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';

/** Wording for moving a work order to each status. Only a step forward is a primary action. */
const ACTIONS: Record<WorkOrderStatus, { label: string; primary: boolean }> = {
  IN_PROGRESS: { label: 'Start work', primary: true },
  DONE: { label: 'Mark as done', primary: true },
  OPEN: { label: 'Move back to open', primary: false },
  CANCELLED: { label: 'Cancel work order', primary: false },
};

/**
 * One button per transition the API allows for this user, in the order the API lists them. Who
 * may do what lives on the server (`allowedTransitions`), so the workflow rules are not duplicated
 * here and cannot drift.
 */
@Component({
  selector: 'app-work-order-actions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConfirmDialog],
  template: `
    @for (action of actions(); track action.target) {
      <button
        type="button"
        class="button"
        [class.button--primary]="action.primary"
        [disabled]="busy()"
        (click)="choose(action.target)"
      >
        {{ action.label }}
      </button>
    } @empty {
      <p class="muted">{{ noActionsReason() }}</p>
    }

    <app-confirm-dialog
      [heading]="'Cancel work order ' + workOrder().number + '?'"
      confirmLabel="Cancel work order"
      cancelLabel="Keep work order"
      (confirmed)="transition.emit('CANCELLED')"
    >
      <p>A cancelled work order is closed for good and cannot be reopened.</p>
    </app-confirm-dialog>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
    }
  `,
})
export class WorkOrderActions {
  readonly workOrder = input.required<WorkOrder>();
  /** True while a transition is in flight, so a second click cannot send another one. */
  readonly busy = input(false);
  readonly transition = output<WorkOrderStatus>();

  protected readonly actions = computed(() =>
    this.workOrder().allowedTransitions.map((target) => ({ target, ...ACTIONS[target] })),
  );
  protected readonly noActionsReason = computed(() => {
    const { status } = this.workOrder();
    return status === 'DONE' || status === 'CANCELLED'
      ? 'This work order is closed. There are no further steps.'
      : 'Only the assignee or an admin can move this work order.';
  });

  private readonly cancelDialog = viewChild.required(ConfirmDialog);

  protected choose(target: WorkOrderStatus): void {
    // Cancelling cannot be undone, so it is the one step that asks first.
    if (target === 'CANCELLED') this.cancelDialog().open();
    else this.transition.emit(target);
  }
}
