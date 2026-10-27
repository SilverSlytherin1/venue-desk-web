import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

let nextId = 0;

/**
 * A native modal `<dialog>`. Closing on Escape and handing focus back to the button that opened
 * it are the browser's work, not code in this file: `cypress/e2e/work-orders.cy.ts` checks both.
 */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialog [attr.aria-labelledby]="headingId" (close)="onClose(dialog.returnValue)">
      <h2 [id]="headingId">{{ heading() }}</h2>
      <ng-content />
      <div class="actions">
        <button type="button" class="button" (click)="dialog.close()">
          {{ cancelLabel() }}
        </button>
        <button type="button" class="button button--danger" (click)="dialog.close('confirm')">
          {{ confirmLabel() }}
        </button>
      </div>
    </dialog>
  `,
  styles: `
    dialog {
      width: min(28rem, calc(100vw - var(--space-8)));
      padding: var(--space-6);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-lg);
      color: var(--color-text);
    }

    dialog[open] {
      display: grid;
      gap: var(--space-4);
    }

    dialog::backdrop {
      background: color-mix(in srgb, var(--color-stage) 60%, transparent);
      backdrop-filter: blur(2px);
    }

    h2 {
      font-size: var(--text-xl);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--space-3);
      margin-block-start: var(--space-2);
    }
  `,
})
export class ConfirmDialog {
  readonly heading = input.required<string>();
  readonly confirmLabel = input.required<string>();
  readonly cancelLabel = input('Cancel');
  readonly confirmed = output();

  protected readonly headingId = `confirm-dialog-${nextId++}`;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open(): void {
    const dialog = this.dialog().nativeElement;
    // Escape closes without setting a value, so the answer from a previous use must not linger.
    dialog.returnValue = '';
    dialog.showModal();
  }

  protected onClose(returnValue: string): void {
    if (returnValue === 'confirm') this.confirmed.emit();
  }
}
