# Place Scout

Local-first web app for finding businesses by **what** you need and **where** you are. The frontend submits a search, the NestJS backend geocodes the location, runs a Google Maps scrape via Docker, stores results in MongoDB, and returns them to the UI (list + map).

## Architecture

```text
frontend (React + Vite)  →  backend (NestJS :4000)
                                ├─ Nominatim geocoding
                                ├─ gosom/google-maps-scraper (:8080)
                                └─ MongoDB (:27017)
```

1. User submits `{ what, where }` from the UI.
2. Backend geocodes `where` (Nominatim / OpenStreetMap).
3. Backend creates a scraper job, polls until `Status` is `ok` (or fails/times out).
4. Backend downloads CSV results, maps rows to businesses, saves them with `searchId` = scraper job id.
5. Frontend shows the returned businesses and optional Leaflet map markers.

## Prerequisites

- Node.js 20+
- Docker (for MongoDB and the Google Maps scraper)
- npm

## Environment configuration

Do **not** commit real `.env` files. Copy the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Backend (`backend/.env`)

| Variable | Purpose | Example |
|---|---|---|
| `PORT` | API port | `4000` |
| `MONGODB_URI` | Mongo connection string | `mongodb://127.0.0.1:27017/place-scout` |
| `SCRAPER_BASE_URL` | Scraper API base | `http://localhost:8080` |
| `SCRAPER_POLL_INTERVAL_MS` | Poll delay | `2000` |
| `SCRAPER_POLL_TIMEOUT_MS` | Max wait for job | `120000` |
| `HTTP_REQUEST_TIMEOUT_MS` | Node HTTP server timeout | `300000` |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated | `http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variable | Purpose | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:4000` |

The Vite dev server also proxies `/scraping` and `/businesses` to `http://localhost:4000` as a convenience.

## Start MongoDB

From the project root:

```bash
docker compose up -d
```

This starts MongoDB 8 on port `27017` with the `place-scout` database name and a named volume (`mongodb_data`).

Verify:

```bash
docker ps | grep place-scout-db
```

## Start the Google Maps scraper

```bash
cd scraper/google-maps-scraper-kit
docker compose up -d
```

Verify:

```bash
docker ps | grep gmaps-scraper
curl -s http://localhost:8080/api/v1/jobs
```

- Web UI: http://localhost:8080
- OpenAPI docs: http://localhost:8080/api/docs

The scraper binds to `127.0.0.1:8080` only (no auth). Do not expose it publicly.

## Run the backend

```bash
cd backend
npm install
npm run start:dev
```

API listens on http://localhost:4000 by default.

Build:

```bash
cd backend
npm run build
```

Unit tests:

```bash
cd backend
npm test
```

> Note: On Node 20.19, the Nest CLI (`nest build` / `nest start`) can fail with an `ora` ESM cycle (`ERR_REQUIRE_CYCLE_MODULE`). This project’s `npm run build`, `npm start`, and `npm run start:dev` scripts use `tsc` + Node instead. Prefer Node 22+ if you want the Nest CLI itself.

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

Production build:

```bash
cd frontend
npm run build
npm run preview
```

## Main API endpoints

### Start a search (waits for scrape + save)

```http
POST /scraping
Content-Type: application/json
```

```json
{
  "what": "pizza",
  "where": "Tunis, Tunisia"
}
```

**Response contract:**

```json
{
  "searchId": "<scraper-job-id>",
  "count": 12,
  "businesses": [
    {
      "_id": "...",
      "name": "Example Pizza",
      "category": "Pizza restaurant",
      "address": "...",
      "phone": "...",
      "website": "...",
      "rating": 4.5,
      "reviewCount": 120,
      "latitude": 36.8,
      "longitude": 10.1,
      "googleMapsUrl": "...",
      "searchId": "<scraper-job-id>"
    }
  ]
}
```

Use a specific location like `Tunis, Tunisia` rather than an ambiguous city name alone.

### Other routes (preserved)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/scraping/test` | Create a scraper job only (no wait/save) |
| `GET` | `/scraping/:jobId` | Job status from the scraper |
| `GET` | `/scraping/:jobId/results` | Raw CSV-parsed rows |
| `POST` | `/scraping/:jobId/save` | Download CSV, save businesses (idempotent per `searchId`) |
| `GET` | `/businesses` | All businesses |
| `GET` | `/businesses?searchId=<job-id>` | Businesses for one search |

### Duplicate-save strategy

`POST /scraping/:jobId/save` (and the final step of `POST /scraping`) checks whether businesses already exist for that `searchId`. If they do, those records are returned instead of inserting again. Trade-off: retries will not re-import a changed CSV for the same job (scraper jobs are immutable once `ok`). A new `POST /scraping` always creates a new job; the UI disables submit while a search is in progress.

## Map dependency

The frontend uses **Leaflet** (`leaflet`) with OpenStreetMap tiles. No map API key is required. Markers appear for businesses with valid `latitude` and `longitude`; list items without coordinates remain visible.

## Troubleshooting

### Scraper will not start

- Confirm Docker is running: `docker ps`
- Start from `scraper/google-maps-scraper-kit` with `docker compose up -d`
- On Apple Silicon, uncomment `platform: linux/amd64` in that compose file if the container fails to start
- First pull of `gosom/google-maps-scraper:v1.15.0` can take a few minutes

### Scraper timeouts / empty results

- Increase `SCRAPER_POLL_TIMEOUT_MS` if jobs need longer than the default 120s
- Check job status: `GET http://localhost:4000/scraping/<jobId>` or the scraper UI
- Google may temporarily rate-limit aggressive scraping; back off and avoid parallel heavy jobs
- Prefer `fast_mode` / modest `depth` for local development (backend already uses conservative job settings)

### Geocoding failures

- Use a qualified place string (`City, Country`)
- Nominatim requires a clear `User-Agent` (backend sends `PlaceScout/1.0`)
- Avoid hammering Nominatim; respect their usage policy

### CORS errors in the browser

- Ensure `CORS_ORIGIN` includes your frontend origin (default `http://localhost:5173`)
- Or rely on the Vite proxy and call relative `/scraping` paths by setting `VITE_API_BASE_URL` empty only if you change the client to use relative URLs (default client uses the absolute API URL)

### MongoDB connection problems

- Confirm `docker compose up -d` from the project root
- Match `MONGODB_URI` to the running container (`mongodb://127.0.0.1:27017/place-scout`)
- Check logs: `docker logs place-scout-db`
- If port `27017` is already in use, another MongoDB instance is likely running locally; either stop it or point `MONGODB_URI` at the instance you intend to use

### Long-running search requests

- Scraping is synchronous from the client’s point of view: `POST /scraping` waits until results are saved
- Backend HTTP timeout defaults to 5 minutes (`HTTP_REQUEST_TIMEOUT_MS`)
- Keep the Search button disabled while a request is in flight (UI does this)

## Optional follow-ups

- Search history model / UI (Phase 5 in the project guide) is not implemented; results are associated via `searchId` on each business and returned by `POST /scraping`
