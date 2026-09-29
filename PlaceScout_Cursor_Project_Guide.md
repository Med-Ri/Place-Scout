# Place Scout --- Project Guide for Cursor

## Purpose

Place Scout is a local-first web app that lets a user search for
businesses by entering:

-   **What** they are looking for (for example, `pizza`,
    `Italian restaurants`, or `dentists`)
-   **Where** they want to search (for example, `Tunis, Tunisia`)

The backend geocodes the location, starts a Google Maps scraping job
through the existing `gosom/google-maps-scraper` Docker service, waits
for the job to finish, downloads and parses its CSV output, stores the
businesses in MongoDB, and returns the saved results to the frontend.

**Goal:** complete the end-to-end flow from search form to displayed
results while keeping the current working backend behavior intact.

------------------------------------------------------------------------

## Important instructions for Cursor

1.  **Inspect the existing repository before editing anything.** Do not
    recreate the app or replace the current architecture.
2.  Work with the current folder structure and installed dependencies.
    Prefer small, focused changes.
3.  Preserve working behavior. The backend scraping-to-MongoDB flow has
    already been tested successfully.
4.  Do not guess filenames, framework versions, routes, environment
    variables, or package scripts. Inspect the actual files first.
5.  Implement in phases. After each phase, run the relevant
    build/lint/tests and fix issues before continuing.
6.  Do not remove existing code or data models unless there is a clear
    reason and the change is explained.
7.  Keep secrets and local configuration out of source control. Use
    `.env.example` for documented placeholders, never real credentials.
8.  Do not commit, push, deploy, or run destructive database operations
    unless explicitly asked.
9.  If a decision depends on missing information, explain the choice and
    use the simplest reversible implementation.
10. Follow the existing code style, TypeScript conventions, and module
    structure.

------------------------------------------------------------------------

## Current repository layout

The project root is:

``` text
PlaceScout/
├── backend/
├── frontend/
├── scraper/
├── docker-compose.yml
└── README.md
```

Inspect the actual contents of each directory before making assumptions.

## Current working backend

The backend is a NestJS application using MongoDB/Mongoose. Existing
modules include:

-   `scraping`
-   `businesses`
-   `geocoding`

The scraper runs in Docker using:

``` text
gosom/google-maps-scraper:v1.15.0
```

The scraper API is available locally at:

``` text
http://localhost:8080
```

Relevant scraper endpoints:

-   `POST /api/v1/jobs` --- create a job
-   `GET /api/v1/jobs` --- list jobs
-   `GET /api/v1/jobs/{id}` --- get job status
-   `GET /api/v1/jobs/{id}/download` --- download the CSV result

The backend API normally runs at:

``` text
http://localhost:4000
```

Verify these values in the current configuration before changing them.

### Existing search flow

The backend accepts a request such as:

``` http
POST /scraping
Content-Type: application/json
```

``` json
{
  "what": "pizza",
  "where": "Tunis, Tunisia"
}
```

The current flow is:

1.  Validate `what` and `where`.
2.  Geocode `where` using Nominatim/OpenStreetMap.
3.  Create a scraper job.
4.  Poll the scraper job status every two seconds until its status is
    `ok`.
5.  Download and parse the CSV.
6.  Map scraper rows into business records.
7.  Save records to MongoDB with the scraper job ID in `searchId`.
8.  Return the saved business records.

This combined endpoint has been tested successfully and returned saved
businesses. Do not regress it.

### Current backend data

The existing Business model includes fields such as:

-   `name`
-   `category`
-   `address`
-   `city`
-   `country`
-   `phone`
-   `website`
-   `rating`
-   `reviewCount`
-   `latitude`
-   `longitude`
-   `googleMapsUrl`
-   `searchId`
-   timestamps

Use the real schema and mapper as the source of truth. Do not assume
every scraper row contains every field.

The businesses endpoint supports:

``` http
GET /businesses
GET /businesses?searchId=<job-id>
```

The scraper CSV parser must treat the first row as column names and skip
empty rows. The existing working parser uses `columns: true` and
`skip_empty_lines: true`.

### Geocoding note

Use a location with enough context, such as `Tunis, Tunisia`, rather
than an ambiguous city name alone. The current geocoder uses Nominatim
and a `PlaceScout/1.0` User-Agent. Respect the provider's usage policy,
avoid excessive requests, and do not add API keys unless the project
requirements change.

------------------------------------------------------------------------

## End-to-end product requirements

### Phase 1 --- Inspect and stabilize the backend

Before frontend work:

1.  Inspect backend routes, DTOs, services, schemas, configuration,
    package scripts, and Docker Compose.
2.  Confirm the current build succeeds.
3.  Review the scraper polling loop:
    -   Handle scraper statuses other than `ok`.
    -   Avoid polling forever; implement a configurable maximum wait or
        deadline.
    -   If the job fails or times out, return a useful HTTP error.
    -   Avoid downloading the CSV before it is ready.
    -   Use an appropriate delay between polls.
4.  Ensure HTTP errors from the scraper are handled and logged without
    leaking secrets.
5.  Review how an empty CSV or zero results is handled.
6.  Prevent accidental duplicate inserts caused by client retries where
    practical. Propose a safe, minimal strategy and explain its
    trade-offs before making schema-changing assumptions.
7.  Keep `POST /scraping` request validation for non-empty string
    fields.
8.  Confirm the response shape and document it.
9.  Add or update tests if the existing project has a test setup.
10. Run the backend build and relevant tests.

Do not make the scraper endpoint return success before the scrape has
finished and records have been saved.

### Phase 2 --- Inspect and complete the frontend

Determine the frontend framework and existing setup by inspecting
`frontend/`. Reuse the project's existing framework, components, styling
system, and dependencies.

Build a polished, responsive Place Scout interface with:

#### Search form

-   App name/brand: **Place Scout**
-   A text field labelled **What are you looking for?**
-   A text field labelled **Where?**
-   A **Search** button
-   Basic required-field validation
-   Submit with `POST /scraping` and JSON
    `{ "what": "...", "where": "..." }`
-   Prevent accidental repeated submission while a search is in progress

#### Loading and error states

Scraping may take some time. Show a clear loading state, disable the
Search button while submitting, and explain that results are being
collected. Do not fake progress percentages or claim specific scraper
stages unless the backend actually provides them.

Display understandable errors for network failures, invalid input,
backend errors, scraper failures, and timeouts. Let the user retry
without refreshing the entire application.

#### Results list

When the endpoint returns, show the businesses returned by that search.
Each result card should display available fields:

-   Business name
-   Category, when available
-   Rating, when available and valid
-   Review count, when available
-   Address
-   Phone number, when available
-   Website link, when available
-   Map/location link, when available

Do not display missing values as misleading values. In particular,
distinguish a missing rating from a genuine rating of zero if the
API/schema permits that distinction. Validate external links and use
safe link attributes when opening new tabs.

Add a result count. Include a useful empty state when no businesses are
returned.

#### Responsive layout and accessibility

-   Work on mobile, tablet, and desktop.
-   Use semantic form elements, labels, keyboard-accessible controls,
    visible focus states, and readable contrast.
-   Include loading and error messages in an accessible way.
-   Keep the UI simple and focused on the search-to-results workflow.
-   Avoid adding a UI library unless the project already uses one or
    there is a clear need.

### Phase 3 --- Results and search association

Use the `searchId` returned with saved businesses to associate results
with the search that produced them.

-   Prefer the response from `POST /scraping` for the immediate result
    list.
-   If the frontend needs to reload results later, use the existing
    `GET /businesses?searchId=...` endpoint.
-   Do not use `GET /businesses` to display all historical businesses as
    if they belonged to the latest search.
-   If the current POST response does not expose the search ID
    separately, inspect the existing data and choose a
    backward-compatible response contract. Document any API response
    change.

### Phase 4 --- Map view

After the search form and results list work end to end, add a map only
if the current frontend setup supports it cleanly.

Requirements:

-   Use business latitude and longitude when both are valid.
-   Show markers for businesses with coordinates.
-   Selecting a result should make its corresponding marker easy to
    locate, and selecting a marker should identify its result.
-   Businesses without valid coordinates must remain visible in the
    list.
-   Choose a mapping library only after inspecting existing dependencies
    and documenting any new dependency.
-   Do not expose private keys in frontend source. If a provider
    requires a key, document the configuration and provide an
    `.env.example` placeholder.

### Phase 5 --- Search history (optional after core flow)

Only after the primary flow works:

-   Inspect whether a Search/Job model already exists.
-   If not, propose a minimal search-history model with query text,
    location, scraper job ID, status, result count, and timestamps.
-   Do not introduce a new model merely to duplicate information that is
    already reliably available.
-   Provide a way to revisit a previous search and load only its
    associated businesses.
-   Handle failed and timed-out searches clearly.

### Phase 6 --- Documentation and verification

Update the project's main README with:

-   Project overview and architecture
-   Prerequisites
-   How to configure environment variables
-   How to start MongoDB and the scraper
-   How to run backend and frontend in development
-   The main API endpoints and example request
-   Troubleshooting for scraper startup, timeouts, geocoding, CORS, and
    MongoDB connection problems

Verify the actual commands from package scripts and Docker Compose
rather than inventing commands.

------------------------------------------------------------------------

## API contract to preserve

### Start a search

``` http
POST /scraping
Content-Type: application/json
```

Request:

``` json
{
  "what": "pizza",
  "where": "Tunis, Tunisia"
}
```

The request waits for scraping and saving to complete, then returns the
saved business results. Confirm the exact response contract in the
implementation and document it.

### Get a scraper job's status

``` http
GET /scraping/:jobId
```

### Get a job's scraper results

``` http
GET /scraping/:jobId/results
```

This route may return scraper CSV-derived rows; confirm its actual
behavior before using it in the frontend.

### Save an existing job's results

``` http
POST /scraping/:jobId/save
```

### List businesses

``` http
GET /businesses
GET /businesses?searchId=<job-id>
```

Keep the existing routes working unless a change is necessary and
documented.

------------------------------------------------------------------------

## Configuration and security requirements

-   Read service URLs, ports, MongoDB URI, CORS settings, and timeouts
    from environment/configuration where appropriate.
-   Add safe placeholder values to `.env.example` only when needed;
    never overwrite the user's `.env`.
-   Do not hardcode secrets or API keys.
-   Validate user input and handle errors consistently.
-   Set reasonable request and polling timeouts.
-   Do not add authentication unless it is already part of the
    application or explicitly requested.
-   Do not scrape more aggressively than the scraper/provider permits.
-   Do not store unrelated personal data.
-   Avoid destructive database changes or commands that erase user data.

------------------------------------------------------------------------

## Acceptance checklist

The implementation is complete when:

-   [ ] The backend builds successfully.
-   [ ] The frontend builds successfully.
-   [ ] Docker/MongoDB/scraper setup is documented using verified
    commands.
-   [ ] A user can enter a search term and location in the UI.
-   [ ] Submitting the form calls `POST /scraping` with the expected
    payload.
-   [ ] The UI shows loading feedback while scraping runs.
-   [ ] The backend waits for scraper completion, handles
    failure/timeout, downloads CSV, and saves results.
-   [ ] Results from that search appear in the UI.
-   [ ] Result cards show available fields without inventing missing
    data.
-   [ ] Empty results and errors are handled clearly.
-   [ ] The user can run another search without reloading the app.
-   [ ] Results are associated with the correct `searchId`.
-   [ ] Existing API routes remain functional or any changes are
    documented.
-   [ ] README setup instructions are accurate.
-   [ ] No secrets are added to source control.
-   [ ] Relevant builds and tests pass.

------------------------------------------------------------------------

## How Cursor should execute this task

Start by summarizing the actual frontend/backend structure and
identifying what is already implemented. Then work in this order:

1.  Audit current code and run existing checks.
2.  Fix only backend reliability gaps that are genuinely present.
3.  Implement the frontend search form, loading/error states, and
    results list.
4.  Connect the frontend to the actual backend URL using the project's
    existing configuration approach.
5.  Run frontend/backend builds and tests, fix regressions, and report
    any checks that could not be run.
6.  Add the map only after the core search flow works.
7.  Update documentation last, using verified commands.

Make changes directly in the repository in small, coherent batches. At
the end, report:

-   Files created or changed
-   Features completed
-   Commands run and their actual results
-   Any manual setup still required
-   Any known limitations or follow-up work

**Do not stop after producing a plan. Implement the end-to-end flow in
the existing repository, verify it, and clearly report anything that
remains unfinished.**
