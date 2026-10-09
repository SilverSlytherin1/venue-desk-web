import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/** Reads a `page` query parameter: anything that is not a positive integer means the first page. */
export function toPageNumber(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

/** For a result that has at least one item in total. The requested page may still be past the end. */
@Component({
  selector: 'app-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (page() > pageCount()) {
      <p>There is no page {{ page() }}: the last page is {{ pageCount() }}.</p>
      <button type="button" class="button" (click)="pageChange.emit(pageCount())">
        Go to the last page
      </button>
    } @else {
      <p class="muted">{{ first() }} to {{ last() }} of {{ total() }}</p>
      @if (pageCount() > 1) {
        <nav aria-label="Pagination">
          <button
            type="button"
            class="button"
            [disabled]="page() <= 1"
            (click)="pageChange.emit(page() - 1)"
          >
            Previous
          </button>
          <span>Page {{ page() }} of {{ pageCount() }}</span>
          <button
            type="button"
            class="button"
            [disabled]="page() >= pageCount()"
            (click)="pageChange.emit(page() + 1)"
          >
            Next
          </button>
        </nav>
      }
    }
  `,
  styles: `
    :host,
    nav {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-3);
    }

    :host {
      justify-content: space-between;
    }
  `,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly total = input.required<number>();
  readonly pageChange = output<number>();

  protected readonly pageCount = computed(() => Math.ceil(this.total() / this.pageSize()));
  protected readonly first = computed(() => (this.page() - 1) * this.pageSize() + 1);
  protected readonly last = computed(() => Math.min(this.page() * this.pageSize(), this.total()));
}
