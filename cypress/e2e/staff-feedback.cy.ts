import { signInToOverview } from '../support/api';

describe('Staff feedback', () => {
  it('summarises the ratings and filters the comments by rating', () => {
    cy.intercept({ method: 'GET', pathname: '/api/v1/events' }, { fixture: 'events-past.json' });
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/feedback-summary' },
      { fixture: 'feedback-summary.json' },
    );
    cy.intercept({ method: 'GET', pathname: '/api/v1/feedback' }, (request) => {
      request.reply({
        fixture: request.query['rating'] === '5' ? 'feedback-five-stars.json' : 'feedback.json',
      });
    }).as('feedback');

    signInToOverview();
    cy.findByRole('navigation', { name: 'Staff' }).findByRole('link', { name: 'Feedback' }).click();
    cy.wait('@feedback');

    cy.findByText('4.5').should('be.visible');
    cy.findByText('from 2 ratings').should('be.visible');
    cy.findByRole('list', { name: 'Comments' }).findAllByRole('listitem').should('have.length', 2);

    cy.findByRole('combobox', { name: 'Rating' }).select('5 stars');
    cy.wait('@feedback').its('request.query').should('include', { rating: '5' });
    cy.location('search').should('eq', '?rating=5');
    cy.findByRole('list', { name: 'Comments' }).findAllByRole('listitem').should('have.length', 1);
  });
});
