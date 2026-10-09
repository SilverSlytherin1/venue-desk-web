import { PROBLEM_JSON, signInAs } from '../support/api';

/**
 * Cypress key events are synthetic and never reach the browser's own handling of a modal dialog.
 * Sending the key through the DevTools protocol is a real key press.
 */
function pressEscape(): void {
  const key = { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 };
  for (const type of ['keyDown', 'keyUp']) {
    cy.wrap(null).then(() =>
      Cypress.automation('remote:debugger:protocol', {
        command: 'Input.dispatchKeyEvent',
        params: { type, ...key },
      }),
    );
  }
}

describe('Work orders', () => {
  const workOrderPath = '/api/v1/work-orders/c4d5e6f7-a8b9-4c0d-9e1f-2a3b4c5d6e07';

  it('lets the assignee sign in and start a work order', () => {
    cy.intercept('GET', workOrderPath, { fixture: 'work-order-open.json' });
    cy.intercept('POST', `${workOrderPath}/transitions`, {
      fixture: 'work-order-in-progress.json',
    }).as('transition');

    signInAs('staff');
    cy.findByRole('link', { name: /Order microphones for Open Mic/ }).click();
    cy.findByRole('button', { name: 'Start work' }).click();

    cy.wait('@transition').then(({ request }) => {
      expect(request.body).to.deep.equal({ to: 'IN_PROGRESS' });
      expect(request.headers['authorization']).to.equal('Bearer e2e-staff-token');
    });
    cy.findByText('Status changed to In progress.').should('have.focus');
    cy.findByRole('button', { name: 'Mark as done' }).should('be.visible');
    cy.findByRole('button', { name: 'Start work' }).should('not.exist');
  });

  it('lets an admin create a work order, and asks before cancelling it', () => {
    const createdPath = '/api/v1/work-orders/e6f7a8b9-c0d1-4e2f-8a3b-4c5d6e7f8a09';
    cy.intercept({ method: 'GET', pathname: '/api/v1/events' }, { fixture: 'events.json' });
    cy.intercept('GET', '/api/v1/users', { fixture: 'users.json' });
    cy.intercept('POST', '/api/v1/work-orders', {
      statusCode: 201,
      fixture: 'work-order-created.json',
    }).as('create');
    cy.intercept('GET', createdPath, { fixture: 'work-order-created.json' });

    signInAs('admin');
    cy.findByRole('link', { name: 'New work order' }).click();
    cy.findByRole('textbox', { name: 'Title' }).type('Tune the grand piano');
    cy.findByRole('textbox', { name: /Description/ }).type('Book the tuner for the morning.');
    cy.findByRole('combobox', { name: 'Priority' }).select('High');
    cy.findByRole('combobox', { name: /Event/ }).select(1);
    cy.findByRole('combobox', { name: /Assignee/ }).select('Robin Staff');
    cy.findByRole('button', { name: 'Create work order' }).click();

    cy.wait('@create').its('request.body').should('deep.equal', {
      title: 'Tune the grand piano',
      description: 'Book the tuner for the morning.',
      priority: 'HIGH',
      eventId: '0b1f7c1e-6f0a-4d58-9d7b-2f1c6a4e9a01',
      assigneeId: '8b7c6d5e-4f3a-4b2c-9d1e-0f1a2b3c4d0a',
    });
    cy.findByRole('heading', { level: 1, name: 'Tune the grand piano' }).should('be.visible');

    // The native dialog is modal: Escape closes it and focus returns to the button that opened it.
    cy.fixture('work-order-created.json').then((workOrder: Record<string, unknown>) => {
      cy.intercept('POST', `${createdPath}/transitions`, {
        ...workOrder,
        status: 'CANCELLED',
        allowedTransitions: [],
      }).as('cancel');
    });
    cy.findByRole('button', { name: 'Cancel work order' }).click();
    cy.findByRole('dialog', { name: 'Cancel work order WO-0015?' }).should('be.visible');
    pressEscape();
    cy.findByRole('dialog').should('not.exist');
    cy.findByRole('button', { name: 'Cancel work order' }).should('have.focus').click();
    cy.findByRole('dialog').findByRole('button', { name: 'Cancel work order' }).click();

    cy.wait('@cancel').its('request.body').should('deep.equal', { to: 'CANCELLED' });
    cy.findByText('Status changed to Cancelled.').should('be.visible');
    cy.findByText('This work order is closed. There are no further steps.').should('be.visible');
  });

  it('keeps a staff member away from creating work orders and says why', () => {
    signInAs('staff');
    cy.findByRole('link', { name: 'New work order' }).should('not.exist');

    cy.visit('/staff/work-orders/new');

    cy.location('pathname').should('eq', '/staff/work-orders');
    cy.findByRole('alert').should('contain.text', 'That page is for admins only');
  });

  it('explains a failed sign in and stays on the form', () => {
    cy.intercept('POST', '/api/v1/auth/login', {
      statusCode: 401,
      headers: PROBLEM_JSON,
      fixture: 'problem-invalid-credentials.json',
    }).as('login');

    cy.visit('/staff/work-orders');
    cy.location('pathname').should('eq', '/staff/login');
    cy.location('search').should('eq', '?returnUrl=%2Fstaff%2Fwork-orders');
    cy.findByRole('textbox', { name: 'Email' }).type('sam@venuedesk.test');
    cy.findByLabelText('Password').type('not-the-password');
    cy.findByRole('button', { name: 'Sign in' }).click();

    cy.wait('@login');
    cy.findByRole('alert').should('contain.text', 'The email or password is not correct.');
    cy.findByRole('textbox', { name: 'Email' }).should('have.value', 'sam@venuedesk.test');
    cy.location('pathname').should('eq', '/staff/login');
  });
});
