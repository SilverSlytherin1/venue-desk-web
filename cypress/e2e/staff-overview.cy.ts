import { signInToOverview } from '../support/api';

describe('Staff overview', () => {
  it('opens on the key figures, with the time saved labelled as an estimate', () => {
    signInToOverview('staff');

    cy.contains('dt', 'Seats booked, last 7 days').next().should('have.text', '27');
    cy.contains('dt', 'Messages sent, last 30 days').next().should('have.text', '84');
    cy.contains('dt', 'Staff time saved').next().should('have.text', '2 h 48 min');
    cy.findByText(/Estimate: 2 minutes for each message/).should('be.visible');
    cy.findByRole('img', { name: '4.6 out of 5' }).should('be.visible');

    cy.findByRole('list', { name: 'Coming up' })
      .findByRole('link', { name: 'Jazz Night with the Blue Quartet' })
      .should('have.attr', 'href', '/staff/events/0b1f7c1e-6f0a-4d58-9d7b-2f1c6a4e9a01');
    cy.findByRole('list', { name: 'Latest feedback' })
      .findByText('Wonderful evening, the sound was perfect.')
      .should('be.visible');
  });

  it('collapses the sidebar into a menu on a phone', () => {
    cy.viewport(390, 844);
    signInToOverview('admin');

    cy.findByRole('navigation', { name: 'Staff', hidden: true }).should('not.be.visible');
    cy.findByRole('button', { name: 'Menu' }).should('have.attr', 'aria-expanded', 'false').click();
    cy.findByRole('navigation', { name: 'Staff' }).should('be.visible');

    cy.intercept(
      { method: 'GET', pathname: '/api/v1/work-orders' },
      { fixture: 'work-orders.json' },
    );
    cy.findByRole('navigation', { name: 'Staff' })
      .findByRole('link', { name: 'Work orders' })
      .click();
    cy.findByRole('heading', { level: 1, name: 'Work orders' }).should('be.visible');
    cy.findByRole('button', { name: 'Menu' }).should('have.attr', 'aria-expanded', 'false');
    cy.document().its('documentElement.scrollWidth').should('be.lte', 390);
  });
});
