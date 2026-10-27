import { LowerCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { loadable } from '../../core/api/loadable';
import { MessagesApi } from '../../core/api/messages-api';
import {
  Message,
  MESSAGE_KINDS,
  MESSAGE_STATUSES,
  MessageKind,
  MessageStatus,
} from '../../core/api/models';
import { VenueDatePipe } from '../../shared/format/venue-date';
import { Badge } from '../../shared/ui/badge';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { Icon } from '../../shared/ui/icon';
import { MESSAGE_KIND, MESSAGE_STATUS } from '../../shared/ui/message-labels';
import { Pagination, toPageNumber } from '../../shared/ui/pagination';
import { Skeleton } from '../../shared/ui/skeleton';
import { BodyPart, linkify } from './linkify';

const PAGE_SIZE = 20;

export function toKind(value: string | undefined): MessageKind | null {
  return MESSAGE_KINDS.find((kind) => kind === value) ?? null;
}

export function toMessageStatus(value: string | undefined): MessageStatus | null {
  return MESSAGE_STATUSES.find((status) => status === value) ?? null;
}

/**
 * Every message the venue has scheduled or sent, with the exact text. Filters live in the URL,
 * like the work orders list, so a filtered view can be shared and reached with the back button.
 */
@Component({
  selector: 'app-messages-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Badge,
    EmptyState,
    ErrorState,
    Icon,
    LowerCasePipe,
    Pagination,
    Skeleton,
    VenueDatePipe,
  ],
  templateUrl: './messages-page.html',
  styleUrl: './messages-page.scss',
})
export class MessagesPage {
  readonly kind = input(null, { transform: toKind });
  readonly status = input(null, { transform: toMessageStatus });
  readonly page = input(1, { transform: toPageNumber });

  private readonly messagesApi = inject(MessagesApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly kinds = MESSAGE_KINDS;
  protected readonly statuses = MESSAGE_STATUSES;
  protected readonly kindLabels = MESSAGE_KIND;
  protected readonly statusLabels = MESSAGE_STATUS;
  protected readonly pageSize = PAGE_SIZE;

  protected readonly messages = loadable(() =>
    this.messagesApi.list({
      kind: this.kind(),
      status: this.status(),
      page: this.page(),
      pageSize: PAGE_SIZE,
    }),
  );
  protected readonly isFiltered = computed(() => this.kind() !== null || this.status() !== null);
  protected readonly announcement = computed(() => {
    const state = this.messages.state();
    if (state.status !== 'ready') return '';
    return state.value.total === 1 ? '1 message found' : `${state.value.total} messages found`;
  });

  /** Ids of the messages whose text is open. */
  protected readonly expanded = signal<ReadonlySet<string>>(new Set());

  protected toggle(id: string): void {
    this.expanded.update((open) => {
      const next = new Set(open);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  protected parts(message: Message): BodyPart[] {
    return linkify(message.body);
  }

  protected isLink(part: BodyPart): part is { url: string } {
    return 'url' in part;
  }

  protected filterByKind(value: string): void {
    this.updateQuery({ kind: toKind(value), page: null });
  }

  protected filterByStatus(value: string): void {
    this.updateQuery({ status: toMessageStatus(value), page: null });
  }

  protected clearFilters(): void {
    this.updateQuery({ kind: null, status: null, page: null });
  }

  protected goToPage(page: number): void {
    this.updateQuery({ page });
  }

  private updateQuery(queryParams: Params): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}
