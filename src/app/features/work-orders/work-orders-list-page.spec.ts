import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { fireEvent, screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import { API, flushProblem, nextRequest, visit } from '../../../testing/app-testing';
import { makePage, makeUser, makeWorkOrder } from '../../../testing/builders';

describe('WorkOrdersListPage', () => {
  const staff = makeUser({ role: 'STAFF' });
  const admin = makeUser({ role: 'ADMIN' });
  const listUrl = `${API}/work-orders`;

  /** Answers the next list request and returns the query string it was made with. */
  async function answerList(workOrders = [makeWorkOrder()], total = workOrders.length) {
    const request = await nextRequest(listUrl);
    request.flush(makePage(workOrders, { total }));
    return request.request.params.toString();
  }

  const currentUrl = () => TestBed.inject(Router).url;
  const statusOption = (name: string) => screen.getByRole<HTMLOptionElement>('option', { name });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.inject(HttpTestingController).verify();
  });

  describe('filters and the URL', () => {
    it('loads what the URL asks for and shows it in the controls', async () => {
      await visit('/staff/work-orders?status=IN_PROGRESS&q=stage&page=2', staff);

      expect(await answerList()).toBe('page=2&pageSize=10&status=IN_PROGRESS&q=stage');
      expect(statusOption('In progress').selected).toBe(true);
      expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('stage');
    });

    it('ignores values in the URL that are not valid filters', async () => {
      await visit('/staff/work-orders?status=BOGUS&page=-3', staff);

      expect(await answerList()).toBe('page=1&pageSize=10');
      expect(statusOption('All statuses').selected).toBe(true);
    });

    it('writes a chosen status to the URL and goes back to the first page', async () => {
      await visit('/staff/work-orders?q=stage&page=2', staff);
      await answerList();

      await userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Status' }),
        statusOption('Done'),
      );

      expect(await answerList()).toBe('page=1&pageSize=10&status=DONE&q=stage');
      expect(currentUrl()).toBe('/staff/work-orders?q=stage&status=DONE');
    });

    it('writes a search to the URL once typing pauses', async () => {
      await visit('/staff/work-orders', staff);
      await answerList();
      vi.useFakeTimers();

      fireEvent.input(screen.getByRole('searchbox', { name: 'Search' }), {
        target: { value: 'lights' },
      });
      await vi.advanceTimersByTimeAsync(299);
      TestBed.inject(HttpTestingController).expectNone(listUrl);

      // The pause ends, and the navigation and the render it causes are allowed to finish.
      await vi.runAllTimersAsync();
      vi.useRealTimers();

      expect(await answerList()).toBe('page=1&pageSize=10&q=lights');
      expect(currentUrl()).toBe('/staff/work-orders?q=lights');
    });

    it('clears every filter in one step', async () => {
      await visit('/staff/work-orders?status=OPEN&q=stage', staff);
      await answerList();

      await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

      expect(await answerList()).toBe('page=1&pageSize=10');
      expect(currentUrl()).toBe('/staff/work-orders');
      expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('');
      expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
    });

    it('moves between pages through the URL and keeps the filters', async () => {
      await visit('/staff/work-orders?status=OPEN', staff);
      await answerList([makeWorkOrder()], 25);
      expect(await screen.findByText('1 to 10 of 25')).toBeVisible();

      await userEvent.click(screen.getByRole('button', { name: 'Next' }));

      expect(await answerList([makeWorkOrder()], 25)).toBe('page=2&pageSize=10&status=OPEN');
      expect(currentUrl()).toBe('/staff/work-orders?status=OPEN&page=2');
    });
  });

  it('offers the last page, not an empty list, for a page past the end', async () => {
    await visit('/staff/work-orders?status=OPEN&page=9', staff);
    (await nextRequest(listUrl)).flush(makePage([], { page: 9, total: 14 }));

    expect(await screen.findByText('There is no page 9: the last page is 2.')).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /No work orders/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Go to the last page' }));

    expect(await answerList()).toBe('page=2&pageSize=10&status=OPEN');
  });

  describe('states', () => {
    it('lists each work order with a link, status, priority and assignee', async () => {
      await visit('/staff/work-orders', staff);
      await answerList([
        makeWorkOrder({
          id: 'wo-7',
          number: 'WO-0007',
          title: 'Tune the piano',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          assignee: { id: 'user-1', name: 'Sam Staff' },
        }),
      ]);

      const row = await screen.findByRole('row', { name: /Tune the piano/ });
      expect(row).toHaveTextContent('WO-0007');
      expect(row).toHaveTextContent('In progress');
      expect(row).toHaveTextContent('High');
      expect(row).toHaveTextContent('Sam Staff');
      expect(screen.getByRole('link', { name: /Tune the piano/ })).toHaveAttribute(
        'href',
        '/staff/work-orders/wo-7',
      );
      expect(screen.getByRole('status')).toHaveTextContent('1 work order found');
    });

    it('says that the filters, not the data, are why nothing shows', async () => {
      await visit('/staff/work-orders?q=nothing', staff);
      await answerList([]);

      expect(
        await screen.findByRole('heading', { name: 'No work orders match these filters' }),
      ).toBeVisible();
    });

    it('has a different message when there are no work orders at all', async () => {
      await visit('/staff/work-orders', staff);
      await answerList([]);

      expect(await screen.findByRole('heading', { name: 'No work orders yet' })).toBeVisible();
    });

    it('offers a retry when loading fails', async () => {
      await visit('/staff/work-orders', staff);
      flushProblem(await nextRequest(listUrl), 500, 'INTERNAL_ERROR');

      await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));
      await answerList([makeWorkOrder({ title: 'Tune the piano' })]);

      expect(await screen.findByRole('link', { name: /Tune the piano/ })).toBeVisible();
    });
  });

  describe('creating a work order', () => {
    it('is offered to an admin', async () => {
      await visit('/staff/work-orders', admin);
      await answerList();

      expect(screen.getByRole('link', { name: 'New work order' })).toHaveAttribute(
        'href',
        '/staff/work-orders/new',
      );
    });

    it('is hidden from staff, who are turned away from its URL and told why', async () => {
      await visit('/staff/work-orders/new', staff);
      await answerList();

      expect(currentUrl()).toBe('/staff/work-orders');
      expect(screen.getByRole('alert')).toHaveTextContent('That page is for admins only');
      expect(screen.queryByRole('link', { name: 'New work order' })).not.toBeInTheDocument();
    });

    it('does not show that explanation on an ordinary visit', async () => {
      await visit('/staff/work-orders', staff);
      await answerList();

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
