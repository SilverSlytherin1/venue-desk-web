import { PROBLEM_JSON } from '../support/api';

describe('Guest feedback', () => {
  const token = '5f0c2a9e-8d1b-4c3e-9a7f-2b6d4e8c1a35';
  const path = `/api/v1/feedback/${token}`;

  it('lets a guest rate the evening with the keyboard and leave a comment', () => {
    cy.intercept('GET', path, { fixture: 'feedback-invitation.json' });
    cy.intercept('POST', path, { statusCode: 201, fixture: 'feedback-receipt.json' }).as('send');

    cy.visit(`/feedback/${token}`);
    cy.findByRole('heading', { level: 1, name: 'How was Blues at the Bar?' }).should('be.visible');
    cy.findByText(/Hi Elsa, thanks for coming/).should('be.visible');

    // Nothing is sent without a rating, and focus goes to the star group.
    cy.findByRole('button', { name: 'Send feedback' }).click();
    cy.findByRole('radio', { name: '1 star' }).should('have.focus');
    cy.findByText('Choose a rating from 1 to 5 stars.').should('be.visible');

    cy.findByRole('radio', { name: '4 stars' }).check({ force: true });
    cy.findByText('Very good').should('be.visible');
    cy.findByRole('textbox', { name: /Comment/ }).type('Great band, a bit warm inside.');
    cy.findByText('30 of 1000 characters').should('be.visible');
    cy.findByRole('button', { name: 'Send feedback' }).click();

    cy.wait('@send')
      .its('request.body')
      .should('deep.equal', { rating: 4, comment: 'Great band, a bit warm inside.' });
    cy.findByRole('heading', { name: 'Thank you, Elsa' }).should('be.visible');
    cy.findByRole('img', { name: '4 out of 5' }).should('be.visible');
  });

  it('explains a link that is not open yet, with no form to fill in', () => {
    cy.intercept('GET', path, {
      statusCode: 409,
      headers: PROBLEM_JSON,
      fixture: 'problem-feedback-not-open.json',
    });

    cy.visit(`/feedback/${token}`);

    cy.findByRole('alert').should('contain.text', 'Feedback is not open yet');
    cy.findByRole('radio').should('not.exist');
  });
});
