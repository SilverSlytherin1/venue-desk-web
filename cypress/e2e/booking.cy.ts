import { PROBLEM_JSON } from '../support/api';

describe('Booking seats', () => {
  const eventPath = '/api/v1/events/0b1f7c1e-6f0a-4d58-9d7b-2f1c6a4e9a01';
  const bookingsPath = `${eventPath}/bookings`;
  const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  function fillInBooking(seats: number): void {
    cy.findByRole('textbox', { name: 'Full name' }).type('Ada Lovelace');
    cy.findByRole('textbox', { name: 'Email' }).type('ada@example.com');
    cy.findByRole('spinbutton', { name: 'Seats' }).type(`{selectall}${seats}`);
  }

  beforeEach(() => {
    cy.intercept({ method: 'GET', pathname: '/api/v1/events' }, { fixture: 'events.json' });
    cy.intercept('GET', eventPath, { fixture: 'event.json' });
  });

  it('books seats for an event and shows the booking the API returned', () => {
    cy.intercept('POST', bookingsPath, { statusCode: 201, fixture: 'booking.json' }).as('booking');

    cy.visit('/');
    cy.findByRole('link', { name: 'Jazz Night with the Blue Quartet' }).click();
    // Navigation moves focus to the new page's heading, which is what a screen reader announces.
    cy.findByRole('heading', { level: 1, name: 'Jazz Night with the Blue Quartet' }).should(
      'have.focus',
    );

    fillInBooking(2);
    cy.findByRole('button', { name: 'Book seats' }).click();

    cy.wait('@booking').then(({ request }) => {
      expect(request.body).to.deep.equal({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        seats: 2,
      });
      expect(request.headers['idempotency-key']).to.match(UUID_V4);
    });
    cy.location('pathname').should('match', /\/booked$/);
    cy.findByRole('heading', { level: 1, name: 'Booking confirmed' }).should('be.visible');
    cy.findByText('VD-7K2Q9X').should('be.visible');
    cy.findByText('2 seats booked for Ada Lovelace (ada@example.com).').should('be.visible');

    // The booking travels in the history entry, so it survives a reload. Typing the address
    // carries no booking, and the page does not pretend otherwise.
    cy.reload();
    cy.findByText('VD-7K2Q9X').should('be.visible');
    cy.visit('/events');
    cy.visit('/events/0b1f7c1e-6f0a-4d58-9d7b-2f1c6a4e9a01/booked');
    cy.location('pathname').should('not.include', '/booked');
    cy.findByRole('button', { name: 'Book seats' }).should('be.visible');
  });

  it('explains a sell-out and shows the seats that are really left', () => {
    cy.intercept('POST', bookingsPath, {
      statusCode: 409,
      headers: PROBLEM_JSON,
      fixture: 'problem-event-sold-out.json',
    }).as('booking');

    cy.visit('/events/0b1f7c1e-6f0a-4d58-9d7b-2f1c6a4e9a01');
    cy.findByText('82 seats left of 120').should('be.visible');
    fillInBooking(3);

    // Someone else books in the meantime: from now on the API reports a single seat.
    cy.fixture('event.json').then((event: Record<string, unknown>) => {
      cy.intercept('GET', eventPath, { ...event, seatsTaken: 119, seatsLeft: 1 }).as('refresh');
    });
    cy.findByRole('button', { name: 'Book seats' }).click();

    cy.wait(['@booking', '@refresh']);
    cy.findByRole('alert').should('contain.text', 'only 1 seat left');
    cy.findByText('1 seat left of 120').should('be.visible');
    cy.findByRole('textbox', { name: 'Full name' }).should('have.value', 'Ada Lovelace');
    cy.location('pathname').should('not.include', '/booked');
  });
});
