# Venue Desk Web

Venue Desk is a small booking desk for an events venue: guests reserve seats in under a minute,
the venue keeps them informed before and after the evening, and the team sees every booking,
message and rating in one place.

![A guest books two seats, gets the confirmation timeline and rates the evening, then the staff see it](docs/screenshots/journey.gif)

## The guest side

1. **Pick an evening.** The home page lists what is coming up, with the seats still free.
2. **Book seats.** Name, email and how many seats. No account, no payment.
3. **Know what happens next.** The confirmation shows the booking reference and when the reminder
   and the feedback request will arrive.
4. **Rate the evening.** The day after, one link opens a page with five stars and a comment box.

<p>
  <img src="docs/screenshots/home.png" alt="Home page with the hero, the three steps of how it works and the upcoming events" width="49%" />
  <img src="docs/screenshots/event-detail.png" alt="Event page with date, venue and seats left, and the booking form filled in" width="49%" />
</p>
<p>
  <img src="docs/screenshots/booking-confirmed.png" alt="Booking confirmed with the reference and a What happens next timeline" width="49%" />
  <img src="docs/screenshots/guest-feedback.png" alt="Feedback page with five stars selected and a short comment" width="49%" />
</p>
<p>
  <img src="docs/screenshots/guest-feedback-phone.png" alt="The feedback page on a phone" width="24%" />
  <img src="docs/screenshots/home-dark.png" alt="Home page in the dark theme" width="74%" />
</p>

## The staff side

Staff sign in to a desk with an overview of the week, the bookings of each event with the state of
every message, the exact text of each message, the ratings, and the work orders that prepare each
evening.

<p>
  <img src="docs/screenshots/staff-overview.png" alt="Staff overview with seats booked, messages sent, average rating, estimated staff time saved, upcoming events and latest feedback" width="49%" />
  <img src="docs/screenshots/event-bookings.png" alt="Bookings of one event with a chip per message showing whether it was sent or is scheduled" width="49%" />
</p>
<p>
  <img src="docs/screenshots/messages.png" alt="Messages page in demo mode with one confirmation expanded to show its exact text" width="49%" />
  <img src="docs/screenshots/feedback-summary.png" alt="Feedback page with the average rating, the distribution of stars and the comments" width="49%" />
</p>
<p>
  <img src="docs/screenshots/staff-overview-phone.png" alt="Staff overview on a phone, with the sidebar folded into a menu" width="24%" />
  <img src="docs/screenshots/work-orders.png" alt="Work orders list with status and priority badges, search, status filter and pagination" width="49%" />
  <img src="docs/screenshots/work-orders-phone.png" alt="The same list on a phone, where each table row becomes a card" width="24%" />
</p>

## Try it

1. Start the API with its demo data, from
   [venue-desk-api](https://github.com/SilverSlytherin1/venue-desk-api):
   `docker compose up --build` (it serves `http://localhost:3000`).
2. In this repository run `npm ci`, then `npm start`, and open `http://localhost:4200`.
3. Book a few seats as a guest, then sign in at `http://localhost:4200/staff/login`:

   | Role  | Email                  | Password       |
   | ----- | ---------------------- | -------------- |
   | Admin | `admin@venuedesk.test` | `demo-admin-1` |
   | Staff | `sam@venuedesk.test`   | `demo-staff-1` |
   | Staff | `robin@venuedesk.test` | `demo-staff-2` |

4. Rate a past evening as a guest through the fixed demo link
   `http://localhost:4200/feedback/5f0c2a9e-8d1b-4c3e-9a7f-2b6d4e8c1a35`. It works once; to use it
   again, reset the API data with `docker compose down -v` and `docker compose up --build`.

Messages are recorded in the desk, never sent, so the demo is safe to click through.

## About this repository

Angular frontend for Venue Desk, a small product for an events venue: guests book seats, get a
confirmation, a reminder the day before and a feedback request the day after, and rate the evening.
Staff see bookings, every message with its exact text, and the ratings, and prepare each event
through work orders that follow a status workflow with role-based rules.
It talks to [venue-desk-api](https://github.com/SilverSlytherin1/venue-desk-api) (NestJS, Prisma,
PostgreSQL) over a written contract, and its whole test suite runs without that API.

## Run it

Requires Node 22.12 or newer.

```bash
git clone https://github.com/SilverSlytherin1/venue-desk-web.git
cd venue-desk-web
npm ci
npm start          # http://localhost:4200
```

The dev server proxies `/api` to `http://localhost:3000` (`proxy.conf.json`), so there is no CORS
setup in development. Start the API from
[its own repository](https://github.com/SilverSlytherin1/venue-desk-api) with `docker compose up`.

The demo accounts are listed in [Try it](#try-it).

Dates and times are shown on the venue's clock, not the browser's, so a screen and the message a
guest receives always agree. The zone is one setting, `VENUE_TIME_ZONE` in
`src/app/core/venue-time-zone.ts` (default `Europe/Rome`), and it must match the API's
`VENUE_TIME_ZONE`. Every date goes through the `venueDate` pipe in `shared/format/venue-date.ts`,
which formats with `Intl` and an explicit `timeZone`.

### Without the API

```bash
npm run test:ci    # unit tests: Vitest, jsdom, no browser needed
npm run e2e        # starts the dev server, then runs Cypress headless with every API call stubbed
```

Other scripts: `npm run lint`, `npm run format:check`, `npm run build`.

## Where to look first

```
src/app
  core/              what the whole app depends on, no UI
    api/             typed models of the contract, one client per resource, the error model
    auth/            session store, token interceptor, route guards
    a11y/            focus management on navigation
  shared/
    ui/              presentational primitives: badge, alert, stars, icons, dialog, view states
    forms/           field wrapper, submit behaviour, validation wording
    format/          dates on the venue's clock
  features/          one folder per area, each lazy loaded
    layout/          the public header and footer around every guest page
    events/          home with the programme, detail with booking form, confirmation
    feedback/        the guest's rating page, and the staff feedback list with its summary
    staff/           the staff sidebar shell, its routes and the overview
    staff-events/    events by upcoming and past, and the bookings of one event
    messages/        every scheduled and sent message, with its exact text
    auth/            login
    work-orders/     list, detail, create
    not-found/       the catch-all page
src/styles           design tokens in two tiers, base elements, controls, shared layout patterns
```

Imports point one way: `features` use `shared` and `core`, and `shared` uses `core`. ESLint
rejects an import in the other direction. Components never touch `HttpClient`: route components
load data through the API clients and hand it to presentational components as inputs.

These files show most of how the app is put together:

1. `core/api/api-problem.ts` and `problem-interceptor.ts`: every HTTP failure becomes one typed
   `ApiProblem`.
2. `core/api/loadable.ts`: the loading, error and ready states of a view as one discriminated union.
3. `features/events/event-detail-page.ts`: the booking flow, with the idempotency key and each
   failure the contract defines.
4. `features/work-orders/work-orders-list-page.ts`: filters that live in the URL.
5. `shared/forms/validated-form.ts` and `form-field.ts`: how forms validate, label and report errors.
6. `features/feedback/feedback-page.ts`: a public page whose only credential is a token in the
   link, with a state for each answer the API can give.
7. `features/events/event-detail-page.spec.ts`: what the tests look like.

## Decisions and trade-offs

**State in signal services, no store library.** Almost all state here belongs to the server and to
one screen at a time. A page asks `loadable()` for its data and gets a signal of
`loading | error | ready`; the only cross-page state is the session, in `AuthStore`. The cost is
that nothing is cached between pages, so going back to a list fetches it again. That is the right
default for data other people change. Shared caching or optimistic updates would be the point to
introduce a query layer or a signal store.

**`loadable()` instead of `rxResource`.** Angular's resource API does the same job but is still
marked experimental in v21. The helper is small and every read goes through it: the signals a
request reads are its parameters, and a newer request cancels the one in flight. Writes (booking,
transition, create, sign in) are subscribed in the page that triggers them and end with that page
or with the record it is showing.

**One error model.** The API answers failures with `application/problem+json` and a stable `code`.
A single interceptor parses that into `ApiProblem`, and features switch on `code`, never on a
status or a message. One code is added on the client, `NETWORK_ERROR`, for the case where there is
no response to carry one. Error bodies and stored sessions are validated at runtime because they
decide control flow; successful responses are trusted to match the contract types. Generating
those types from the API's OpenAPI document would close that gap. A validation error for a field
that is on screen is shown on that field, and any other one is spelled out above the form.

**The server owns the rules.** Work order buttons are rendered from `allowedTransitions` and
nothing else, so the client has no copy of the workflow table. Seat limits are checked in the form
for speed, but a sell-out is handled as a normal outcome: the page says how many seats are left
and reloads the event.

**Safe retries, and only where they are safe.** A booking carries an `Idempotency-Key`. The key
belongs to the details that were submitted: sending the same details again replays the key, and
editing them makes a new one. The page offers "Try again" only when the outcome is unknown (no
response, or a server error). A sell-out, a closed event, a rate limit and a reused key each get
their own message and next step.

**A confirmation is not a URL.** The confirmation page renders the booking the API returned,
handed over in the router's navigation state. That state lives in the browser's history entry, so
a reload keeps it, while a typed or shared address has no booking and goes to the event page.

**Token in `sessionStorage`.** The contract authenticates with a bearer token and has no refresh
token, so the token has to be readable by script. `sessionStorage` keeps it for a page reload and
drops it with the tab, and the auth interceptor only attaches it to the API base URL. The weakness
is cross-site scripting: an injected script could read it. An `httpOnly` cookie would remove that
risk and add the need for CSRF protection, and it needs server support that the contract does not
have. Here the exposure is limited by a one hour token, Angular's default escaping and no
third-party scripts. If the browser blocks storage the app still works, and the session ends with
the page.

**Two layouts, chosen by the router.** Guest pages sit inside a public layout with a header and
footer; the staff area sits inside a sidebar shell that collapses into a menu on a phone. Both are
route components, so a page never knows which frame it is in. Focus management lives on the root
component, so moving from one layout to the other still announces the new page. One consequence:
a staff page is created after its navigation has ended, once the shell has rendered, so anything a
page needs from the navigation (such as the role a guard found missing) is handed over by a route
resolver instead of being read in the page.

**The server owns the guest journey too.** The confirmation page builds "What happens next" from
the messages the API scheduled for the booking, so a reminder only appears when the API made one.
The messages screen shows the exact subject and body the API stored; in this demo nothing is
emailed, and the screen says so. Message bodies are plain text: links in them are found with a
small pure function and rendered as anchors that open in a new tab, and nothing is ever inserted
as HTML. The overview's "staff time saved" is an estimate of two minutes per message sent, and is
labelled as one.

**A designed theme, not an inverted one.** The look is "evening at the venue": ink navy, a brass
accent and warm paper, a serif display face over the system sans, all from system font stacks so
nothing is downloaded. The dark theme is its own set of semantic tokens (a night navy with brass
actions) rather than computed. Pages use semantic tokens only, and `tokens.spec.ts` also checks
the pairs added for the dark hero and sidebar, the brass text, the rating stars and the meters.

**Hand-written primitives.** The app needs a badge, an alert, a field wrapper, pagination and a
confirm dialog. Those are small, and the dialog is a native `<dialog>`, so Escape and the return
of focus are the browser's work. A component library would be the right call as soon as something
like a combobox or a date picker is needed: those are too intricate to write by hand.

**Tests exercise behaviour through the DOM.** Unit tests start the real routes, guards and
interceptors and replace only the HTTP backend, then find elements by role and accessible name.
An inaccessible control therefore fails a test. Cypress covers the main journeys in a real browser
with fixtures shaped like the contract, and fails any call that was not stubbed.

**Accessibility is part of the structure.** Focus moves to the page heading on navigation and to
the first invalid field on a failed submit. Errors are tied to their field with `aria-describedby`,
async results are announced through live regions, and the work orders table reflows into cards on
a narrow container without losing its table semantics. The star rating is a native radio group, so
the arrow keys and screen readers work without extra code. Colours are design tokens in two tiers
(`src/styles/_tokens.scss`), and `src/styles/tokens.spec.ts` fails the test run if a text and
background pair drops below AA contrast in either theme.

## Deliberately out of scope

- Internationalisation: copy is inline English and dates use one format, in the venue's time zone.
- Server-side rendering and hydration.
- Refresh tokens and silent renewal: when the token expires the user signs in again and returns
  to the page they were on.
- Offline support and optimistic updates.
- A manual theme switch: the theme follows the operating system.
- Contract endpoints with no screen yet: editing a work order and creating events.
- Filtering messages by event: the API supports it, the screen filters by kind and status only.

## Notes

- Unit tests use Vitest through the Angular CLI. End to end tests use Cypress.
- `overrides` in `package.json` keeps Vitest on the Vite major that the Angular builder ships.
  Without it, npm 10 fails to resolve Vitest 4.1's optional peer dependencies.

---

Emanuel Pinto, riverdevstudio.it. MIT licensed.
