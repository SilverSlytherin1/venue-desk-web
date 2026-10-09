import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { screen, waitFor, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import { API, flushProblem, nextRequest, visit } from '../../../testing/app-testing';
import { makeEvent, makePage, makeUser, makeWorkOrder } from '../../../testing/builders';

describe('WorkOrderCreatePage', () => {
  const createUrl = `${API}/work-orders`;
  const eventsUrl = `${API}/events`;
  const usersUrl = `${API}/users`;

  /** Opens the page as an admin. The two option lists are left for the test to answer. */
  async function open() {
    await visit('/staff/work-orders/new', makeUser({ role: 'ADMIN' }));
    return {
      title: await screen.findByRole('textbox', { name: 'Title' }),
      description: screen.getByRole('textbox', { name: /Description/ }),
      event: screen.getByRole('combobox', { name: /Event/ }),
      assignee: screen.getByRole('combobox', { name: /Assignee/ }),
    };
  }

  async function answerOptions() {
    (await nextRequest(eventsUrl)).flush(makePage([makeEvent({ id: 'event-1' })]));
    (await nextRequest(usersUrl)).flush([{ id: 'user-1', name: 'Sam Staff' }]);
    await screen.findByRole('option', { name: 'Sam Staff' });
  }

  async function fillRequiredFields(form: Awaited<ReturnType<typeof open>>) {
    await userEvent.type(form.title, 'Tune the piano');
    await userEvent.type(form.description, 'Before doors.');
  }

  const submit = () => userEvent.click(screen.getByRole('button', { name: 'Create work order' }));

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('leaves the optional links out of the request when they are not chosen', async () => {
    const form = await open();
    await answerOptions();
    await fillRequiredFields(form);

    await submit();

    expect((await nextRequest(createUrl)).request.body).toEqual({
      title: 'Tune the piano',
      description: 'Before doors.',
      priority: 'MEDIUM',
    });
  });

  it('creates the work order with the chosen event and assignee, then opens it', async () => {
    const form = await open();
    await answerOptions();
    await fillRequiredFields(form);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Priority' }), 'HIGH');
    await userEvent.selectOptions(form.event, 'event-1');
    await userEvent.selectOptions(form.assignee, 'user-1');

    await submit();
    const request = await nextRequest(createUrl);
    expect(request.request.body).toEqual({
      title: 'Tune the piano',
      description: 'Before doors.',
      priority: 'HIGH',
      eventId: 'event-1',
      assigneeId: 'user-1',
    });
    request.flush(makeWorkOrder({ id: 'created' }), { status: 201, statusText: 'Created' });

    (await nextRequest(`${API}/work-orders/created`)).flush(makeWorkOrder({ id: 'created' }));
    expect(TestBed.inject(Router).url).toBe('/staff/work-orders/created');
  });

  it('marks only the fields that can be left empty as optional', async () => {
    const form = await open();
    await answerOptions();

    expect(form.title).toBeRequired();
    expect(screen.getByRole('textbox', { name: 'Description (optional)' })).not.toBeRequired();
    expect(screen.getByRole('combobox', { name: 'Event (optional)' })).not.toBeRequired();
    expect(screen.getByRole('combobox', { name: 'Assignee (optional)' })).not.toBeRequired();
  });

  describe('when a list of options cannot be loaded', () => {
    it('still creates the work order, since the fields it feeds are optional', async () => {
      const form = await open();
      flushProblem(await nextRequest(eventsUrl), 500, 'INTERNAL_ERROR');
      flushProblem(await nextRequest(usersUrl), 500, 'INTERNAL_ERROR');
      await screen.findByText(/The events could not be loaded/);
      await fillRequiredFields(form);

      await submit();

      expect((await nextRequest(createUrl)).request.body).toEqual({
        title: 'Tune the piano',
        description: 'Before doors.',
        priority: 'MEDIUM',
      });
    });

    it('says which list is missing and loads it again on request', async () => {
      const form = await open();
      (await nextRequest(eventsUrl)).flush(makePage([makeEvent({ id: 'event-1' })]));
      flushProblem(await nextRequest(usersUrl), 500, 'INTERNAL_ERROR');

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('The list of people could not be loaded');
      expect(within(form.event).getAllByRole('option')).toHaveLength(2);
      await userEvent.click(within(alert).getByRole('button', { name: 'Load people again' }));
      (await nextRequest(usersUrl)).flush([{ id: 'user-1', name: 'Sam Staff' }]);

      expect(await screen.findByRole('option', { name: 'Sam Staff' })).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('says so when there are more events than one page of options can hold', async () => {
    const form = await open();
    (await nextRequest(eventsUrl)).flush(makePage([makeEvent()], { pageSize: 100, total: 240 }));
    (await nextRequest(usersUrl)).flush([]);

    await waitFor(() => {
      expect(form.event).toHaveAccessibleDescription('Only the next 1 of 240 events are listed.');
    });
  });

  it('shows field errors from the API on the fields and keeps what was typed', async () => {
    const form = await open();
    await answerOptions();
    await fillRequiredFields(form);
    await userEvent.selectOptions(form.event, 'event-1');
    await submit();

    flushProblem(await nextRequest(createUrl), 400, 'VALIDATION_FAILED', {
      errors: [{ field: 'eventId', message: 'This event does not exist.' }],
    });

    await waitFor(() => {
      expect(form.event).toHaveAccessibleDescription('This event does not exist.');
    });
    expect(form.event).toHaveFocus();
    expect(form.title).toHaveValue('Tune the piano');
    expect(screen.getByRole('alert')).toHaveTextContent('Check the highlighted fields');
  });
});
