import { signInToOverview } from '../support/api';

describe('Messages', () => {
  it('filters in the URL and shows the exact text, with the feedback link in a new tab', () => {
    cy.intercept({ method: 'GET', pathname: '/api/v1/messages' }, (request) => {
      request.reply({
        fixture:
          request.query['kind'] === 'REMINDER'
            ? 'messages-reminders-scheduled.json'
            : 'messages.json',
      });
    }).as('messages');

    signInToOverview();
    cy.findByRole('navigation', { name: 'Staff' }).findByRole('link', { name: 'Messages' }).click();
    cy.wait('@messages');
    cy.findByText(/messages are recorded here, not sent/).should('be.visible');

    cy.findByRole('button', { name: 'Show feedback request to Lena Varga' }).click();
    cy.findByText('How was Blues at the Bar?').should('be.visible');
    cy.findByRole('link', { name: /feedback\/5f0c2a9e.* \(opens in a new tab\)$/ })
      .should('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer');

    cy.findByRole('combobox', { name: 'Kind' }).select('Reminder');
    cy.wait('@messages').its('request.query').should('include', { kind: 'REMINDER' });
    cy.location('search').should('eq', '?kind=REMINDER');
    cy.findByText('Ruth Calder').should('be.visible');
    cy.findByText('Lena Varga').should('not.exist');

    // The filter is part of the address, so a reload keeps it.
    cy.reload();
    cy.findByRole('combobox', { name: 'Kind' }).should('have.value', 'REMINDER');
  });
});
