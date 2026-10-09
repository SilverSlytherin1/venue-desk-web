import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { screen, waitFor, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import { API, flushProblem, nextRequest, visit } from '../../../testing/app-testing';
import { makeUser, makeWorkOrder } from '../../../testing/builders';
import { WorkOrder } from '../../core/api/models';

describe('WorkOrderDetailPage', () => {
  const workOrderUrl = `${API}/work-orders/work-order-1`;
  const transitionsUrl = `${workOrderUrl}/transitions`;

  async function open(workOrder: Partial<WorkOrder> = {}) {
    await visit('/staff/work-orders/work-order-1', makeUser());
    (await nextRequest(workOrderUrl)).flush(makeWorkOrder(workOrder));
    await screen.findByRole('heading', { name: 'Next steps' });
  }

  const actions = () =>
    within(screen.getByRole('region', { name: 'Next steps' }))
      .queryAllByRole('button')
      .map((button) => button.textContent.trim());

  const expectNoTransition = () => {
    TestBed.inject(HttpTestingController).expectNone(transitionsUrl);
  };

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  describe('actions come from allowedTransitions', () => {
    it.each<{ allowed: WorkOrder['allowedTransitions']; buttons: string[] }>([
      { allowed: ['IN_PROGRESS'], buttons: ['Start work'] },
      { allowed: ['IN_PROGRESS', 'CANCELLED'], buttons: ['Start work', 'Cancel work order'] },
      {
        allowed: ['DONE', 'OPEN', 'CANCELLED'],
        buttons: ['Mark as done', 'Move back to open', 'Cancel work order'],
      },
    ])('offers exactly $buttons for $allowed, in that order', async ({ allowed, buttons }) => {
      await open({ allowedTransitions: allowed });

      expect(actions()).toEqual(buttons);
    });

    it('offers nothing and says why when an open work order is not the user’s to move', async () => {
      await open({ status: 'OPEN', allowedTransitions: [] });

      expect(actions()).toEqual([]);
      expect(
        screen.getByText('Only the assignee or an admin can move this work order.'),
      ).toBeVisible();
    });

    it('offers nothing on a closed work order', async () => {
      await open({ status: 'DONE', allowedTransitions: [] });

      expect(actions()).toEqual([]);
      expect(screen.getByText(/This work order is closed/)).toBeVisible();
    });
  });

  it('moves the work order and shows the state the API returns', async () => {
    await open({ status: 'OPEN', allowedTransitions: ['IN_PROGRESS'] });

    await userEvent.click(screen.getByRole('button', { name: 'Start work' }));
    const request = await nextRequest(transitionsUrl);
    expect(request.request.body).toEqual({ to: 'IN_PROGRESS' });
    request.flush(makeWorkOrder({ status: 'IN_PROGRESS', allowedTransitions: ['DONE', 'OPEN'] }));

    // Focus is what gets the outcome read out, so it must not also be a live region.
    const feedback = await screen.findByText('Status changed to In progress.');
    await waitFor(() => {
      expect(feedback).toHaveFocus();
    });
    expect(feedback).not.toHaveAttribute('role');
    expect(actions()).toEqual(['Mark as done', 'Move back to open']);
  });

  describe('when the route moves on to another work order', () => {
    async function openSecondWorkOrder() {
      await TestBed.inject(Router).navigateByUrl('/staff/work-orders/work-order-2');
      (await nextRequest(`${API}/work-orders/work-order-2`)).flush(
        makeWorkOrder({ id: 'work-order-2', title: 'Tune the piano' }),
      );
      await screen.findByRole('heading', { level: 1, name: 'Tune the piano' });
    }

    it('does not carry over what was said about the previous one', async () => {
      await open({ allowedTransitions: ['IN_PROGRESS'] });
      await userEvent.click(screen.getByRole('button', { name: 'Start work' }));
      (await nextRequest(transitionsUrl)).flush(makeWorkOrder({ status: 'IN_PROGRESS' }));
      await screen.findByText('Status changed to In progress.');

      await openSecondWorkOrder();

      expect(screen.queryByText('Status changed to In progress.')).not.toBeInTheDocument();
    });

    it('drops a transition answer that is still out', async () => {
      await open({ allowedTransitions: ['IN_PROGRESS'] });
      await userEvent.click(screen.getByRole('button', { name: 'Start work' }));
      const pending = await nextRequest(transitionsUrl);

      await openSecondWorkOrder();

      expect(pending.cancelled).toBe(true);
      expect(screen.getByRole('button', { name: 'Start work' })).toBeEnabled();
    });
  });

  describe('cancelling', () => {
    async function openCancelDialog() {
      await open({ number: 'WO-0007', allowedTransitions: ['IN_PROGRESS', 'CANCELLED'] });
      await userEvent.click(screen.getByRole('button', { name: 'Cancel work order' }));
      return screen.findByRole('dialog', { name: 'Cancel work order WO-0007?' });
    }

    it('asks first and sends nothing until confirmed', async () => {
      const dialog = await openCancelDialog();
      expectNoTransition();

      await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel work order' }));

      expect((await nextRequest(transitionsUrl)).request.body).toEqual({ to: 'CANCELLED' });
    });

    it('does nothing when the user keeps the work order', async () => {
      const dialog = await openCancelDialog();

      await userEvent.click(within(dialog).getByRole('button', { name: 'Keep work order' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expectNoTransition();
    });
  });

  describe('when the transition is refused', () => {
    async function refuseStart(code: 'INVALID_TRANSITION' | 'FORBIDDEN', status: number) {
      await open({ status: 'OPEN', allowedTransitions: ['IN_PROGRESS'] });
      await userEvent.click(screen.getByRole('button', { name: 'Start work' }));
      flushProblem(await nextRequest(transitionsUrl), status, code);
    }

    it('reloads after INVALID_TRANSITION and explains that the work order changed', async () => {
      await refuseStart('INVALID_TRANSITION', 409);

      expect(await screen.findByText(/Someone else changed this work order/)).toBeVisible();
      (await nextRequest(workOrderUrl)).flush(
        makeWorkOrder({ status: 'DONE', allowedTransitions: [] }),
      );
      await waitFor(() => {
        expect(actions()).toEqual([]);
      });
      expect(screen.getByText('Done')).toBeVisible();
    });

    it('reloads after FORBIDDEN and explains who may do it', async () => {
      await refuseStart('FORBIDDEN', 403);

      expect(await screen.findByText(/only the assignee or an admin can/)).toBeVisible();
      (await nextRequest(workOrderUrl)).flush(makeWorkOrder({ allowedTransitions: [] }));
      await waitFor(() => {
        expect(actions()).toEqual([]);
      });
    });

    it('keeps the buttons and reports any other failure', async () => {
      await open({ status: 'OPEN', allowedTransitions: ['IN_PROGRESS'] });
      await userEvent.click(screen.getByRole('button', { name: 'Start work' }));
      (await nextRequest(transitionsUrl)).error(new ProgressEvent('error'));

      expect(await screen.findByText(/The server could not be reached/)).toBeVisible();
      expect(screen.getByRole('button', { name: 'Start work' })).toBeEnabled();
    });
  });

  it.each([
    { status: 404, code: 'NOT_FOUND', case: 'an unknown id' },
    { status: 400, code: 'VALIDATION_FAILED', case: 'an id that is not a UUID' },
  ])('says the link is wrong for $case, without a pointless retry', async ({ status, code }) => {
    await visit('/staff/work-orders/work-order-1', makeUser());

    flushProblem(await nextRequest(workOrderUrl), status, code);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('This work order could not be loaded');
    expect(within(alert).queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });
});
