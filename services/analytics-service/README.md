# Analytics Service

## Purpose
Provides statistical analytics, issue category breakdowns, monthly resolution trends, hotspot mapping by area, and summary metrics for the municipal dashboard. Obtains complaint data by querying the Complaint Microservice via REST APIs.

## Port
`5004`

## API Endpoints
- `GET /api/analytics/issues-by-type` — Counts & color-coded breakdown by issue category
- `GET /api/analytics/status-breakdown` — Status counts (Submitted, Assigned, In Progress, Resolved)
- `GET /api/analytics/hotspots` — Top 10 areas by complaint density
- `GET /api/analytics/monthly` — 6-month historical submission vs resolution trends
- `GET /api/analytics/summary` — Overview metrics (resolution rate, average days, areas covered)
- `GET /health` — Health check endpoint

## Environment Variables
- `PORT`: Service port (default `5004`)
- `NODE_ENV`: Application environment (`development` / `production`)
- `COMPLAINT_SERVICE_URL`: URL of Complaint Microservice (`http://complaint-service:5002`)

## Dependencies
- `express`
- `axios`
- `cors`
- `helmet`
- `morgan`
- `dotenv`
