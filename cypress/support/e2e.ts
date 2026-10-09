import '@testing-library/cypress/add-commands';

beforeEach(() => {
  // The suite must pass with no backend running. Routes registered later take precedence, so
  // this one only sees calls that a test forgot to stub, and fails the test instead of letting
  // the call reach the dev proxy.
  cy.intercept('/api/**', (request) => {
    throw new Error(`No stub for ${request.method} ${request.url}`);
  });
});
