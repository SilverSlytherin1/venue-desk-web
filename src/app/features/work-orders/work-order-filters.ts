import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { outputFromObservable } from '@angular/core/rxjs-interop';
import { EMPTY, map, Subject, switchMap, tap, timer } from 'rxjs';

import { WORK_ORDER_STATUSES, WorkOrderStatus } from '../../core/api/models';
import { STATUS } from './work-order-labels';

const SEARCH_DEBOUNCE_MS = 300;

/** Reads a status from a query parameter or a select value. Anything unknown means no filter. */
export function toStatus(value: string | undefined): WorkOrderStatus | null {
  return WORK_ORDER_STATUSES.find((status) => status === value) ?? null;
}

/**
 * Shows the filters it is given and reports what the user asks for. The filters themselves live
 * in the URL, owned by the page. The one thing kept here is the text in the search box while the
 * user is typing in it.
 */
@Component({
  selector: 'app-work-order-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form role="search" (submit)="$event.preventDefault()">
      <div class="field search">
        <label for="work-order-search">Search</label>
        <input
          #search
          id="work-order-search"
          type="search"
          autocomplete="off"
          (input)="typed.next(search.value)"
        />
      </div>

      <div class="field">
        <label for="work-order-status">Status</label>
        <select
          #statusSelect
          id="work-order-status"
          (change)="statusChange.emit(toStatus(statusSelect.value))"
        >
          <option value="" [selected]="status() === null">All statuses</option>
          @for (option of statuses; track option) {
            <option [value]="option" [selected]="option === status()">
              {{ labels[option].label }}
            </option>
          }
        </select>
      </div>

      @if (hasFilters()) {
        <button type="button" class="button button--quiet" (click)="clear()">Clear filters</button>
      }
    </form>
  `,
  styles: `
    form {
      display: flex;
      flex-wrap: wrap;
      align-items: end;
      gap: var(--space-4);
    }

    .field {
      display: grid;
      flex: 1 1 12rem;
      gap: var(--space-1);
    }

    .search {
      flex-grow: 3;
    }

    label {
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
    }
  `,
})
export class WorkOrderFilters {
  readonly status = input.required<WorkOrderStatus | null>();
  readonly query = input.required<string>();
  readonly statusChange = output<WorkOrderStatus | null>();
  readonly cleared = output();

  /** Text from the search box. `null` drops a search that is still waiting for the pause. */
  protected readonly typed = new Subject<string | null>();
  /**
   * Emits once typing pauses, so a search runs per intent and not per keystroke. The same text
   * can be emitted twice in a row: after the filters were cleared it must search again.
   */
  readonly queryChange = outputFromObservable(
    this.typed.pipe(
      switchMap((text) =>
        text === null ? EMPTY : timer(SEARCH_DEBOUNCE_MS).pipe(map(() => text.trim())),
      ),
      tap((query) => {
        this.searched = query;
      }),
    ),
  );

  protected readonly hasFilters = computed(() => this.status() !== null || this.query() !== '');
  protected readonly statuses = WORK_ORDER_STATUSES;
  protected readonly labels = STATUS;
  protected readonly toStatus = toStatus;

  private readonly searchBox = viewChild.required<ElementRef<HTMLInputElement>>('search');
  /** The query the search box stands for, to tell a search of its own coming back from the URL. */
  private searched: string | null = null;

  constructor() {
    // While the user types, the box is theirs. When the URL comes back with the search this box
    // just asked for, writing it into the box would erase whatever was typed since. Any other
    // query (first load, back button, cleared filters) is news and replaces the text.
    effect(() => {
      const query = this.query();
      if (query === this.searched) return;

      this.searched = query;
      this.typed.next(null);
      this.searchBox().nativeElement.value = query;
    });
  }

  protected clear(): void {
    // A search still waiting for the pause would bring the filter straight back.
    this.typed.next(null);
    this.searchBox().nativeElement.value = '';
    this.searched = '';
    this.cleared.emit();
  }
}
