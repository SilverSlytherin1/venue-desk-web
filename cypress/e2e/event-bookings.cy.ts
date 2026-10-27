import { signInToOverview } from '../support/api';

describe('Event bookings', () => {
  const eventId = '0b1f7c1e-6f0a-4d58-9d7b-2f1c6a4e9a01';
  const bookingId = '3f6a1d2c-8b4e-4c7a-9f10-2a3b4c5d6e04';

  it('shows each booking with its messages, and cancels one after asking', () => {
    cy.intercept({ method: 'GET', pathname: '/api/v1/events' }, (request) => {
      request.reply({
        fixture: request.query['when'] === 'past' ? 'events-past.json' : 'events.json',
      });
    }).as('events');
    cy.intercept('GET', `/api/v1/events/${eventId}`, { fixture: 'event.json' });
    cy.intercept(
      { method: 'GET', pathname: `/api/v1/events/${eventId}/bookings` },
      { fixture: 'event-bookings.json' },
    );
    cy.intercept('POST', `/api/v1/bookings/${bookingId}/cancel`, {
      fixture: 'booking-cancelled.json',
    }).as('cancel');

    signInToOverview();
    cy.findByRole('navigation', { name: 'Staff' }).findByRole('link', { name: 'Events' }).click();
    cy.wait('@events').its('request.query').should('include', { when: 'upcoming' });
    cy.findByRole('link', { name: 'Past' }).click();
    cy.wait('@events').its('request.query').should('include', { when: 'past' });
    cy.findByRole('link', { name: 'Blues at the Bar' }).should('be.visible');
    cy.findByRole('link', { name: 'Upcoming' }).click();
    cy.findByRole('link', { name: 'Jazz Night with the Blue Quartet' }).click();

    cy.findByRole('heading', { level: 1, name: 'Jazz Night with the Blue Quartet' }).should(
      'be.visible',
    );
    cy.findByRole('row', { name: /VD-7K2Q9X/ }).within(() => {
      cy.findByText('Confirmed').should('be.visible');
      cy.findByRole('list', { name: 'Messages' }).should('contain.text', 'Reminder: scheduled');
    });

    cy.findByRole('button', { name: 'Cancel booking VD-7K2Q9X' }).click();
    cy.findByRole('dialog', { name: 'Cancel booking VD-7K2Q9X?' })
      .should('contain.text', 'The 2 seats go back on sale')
      .findByRole('button', { name: 'Cancel booking' })
      .click();

    cy.wait('@cancel');
    cy.findByText(/Booking VD-7K2Q9X cancelled/).should('be.visible');
    cy.findByRole('row', { name: /VD-7K2Q9X/ }).within(() => {
      cy.findByText('Cancelled').should('be.visible');
      cy.findByRole('list', { name: 'Messages' }).should('contain.text', 'Reminder: cancelled');
      cy.findByRole('button').should('not.exist');
    });
  });
});
