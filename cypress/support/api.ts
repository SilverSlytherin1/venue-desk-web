/** Response headers of every error the API returns. */
export const PROBLEM_JSON = { 'content-type': 'application/problem+json' };

const ACCOUNTS = {
  admin: { fixture: 'login-admin.json', email: 'admin@venuedesk.test', password: 'demo-admin-1' },
  staff: { fixture: 'login-staff.json', email: 'sam@venuedesk.test', password: 'demo-staff-1' },
};

/** Signs in through the login form as a user of the seed data and lands on the work orders. */
export function signInAs(role: keyof typeof ACCOUNTS): void {
  const { fixture, email, password } = ACCOUNTS[role];
  cy.intercept('POST', '/api/v1/auth/login', { fixture }).as('login');
  cy.intercept({ method: 'GET', pathname: '/api/v1/work-orders' }, { fixture: 'work-orders.json' });

  cy.visit('/staff/work-orders');
  cy.findByRole('textbox', { name: 'Email' }).type(email);
  cy.findByLabelText('Password').type(password);
  cy.findByRole('button', { name: 'Sign in' }).click();

  cy.wait('@login').its('request.body').should('deep.equal', { email, password });
  cy.findByRole('heading', { level: 1, name: 'Work orders' }).should('be.visible');
}

/**
 * Signs in on the login form and lands on the staff overview, the default staff page. Stub any
 * other call the test makes before calling this, or after it for pages visited later.
 */
export function signInToOverview(role: keyof typeof ACCOUNTS = 'staff'): void {
  const { fixture, email, password } = ACCOUNTS[role];
  cy.intercept('POST', '/api/v1/auth/login', { fixture }).as('login');
  cy.intercept('GET', '/api/v1/dashboard', { fixture: 'dashboard.json' }).as('dashboard');

  cy.visit('/staff/login');
  cy.findByRole('textbox', { name: 'Email' }).type(email);
  cy.findByLabelText('Password').type(password);
  cy.findByRole('button', { name: 'Sign in' }).click();

  cy.wait(['@login', '@dashboard']);
  cy.findByRole('heading', { level: 1, name: 'Overview' }).should('be.visible');
}
