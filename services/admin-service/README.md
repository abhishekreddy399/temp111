# Admin Service

## Purpose
Handles administrative dashboard features, including fetching all complaints, updating complaint resolution status, and assigning municipal departments to complaints. Operates without direct database access by communicating with the Complaint Service via REST APIs.

## Port
`5003`

## API Endpoints
- `GET /api/admin/complaints` — Retrieve complaints with filters, search, and pagination
- `PATCH /api/admin/complaints/:id/status` — Update complaint status (Submitted → Assigned → In Progress → Resolved)
- `PATCH /api/admin/complaints/:id/assign` — Assign municipal department
- `GET /health` — Health check endpoint

## Environment Variables
- `PORT`: Service port (default `5003`)
- `NODE_ENV`: Application environment (`development` / `production`)
- `COMPLAINT_SERVICE_URL`: URL of Complaint Microservice (`http://complaint-service:5002`)
- `AUTH_SERVICE_URL`: URL of Auth Microservice (`http://auth-service:5001`)
- `JWT_SECRET`: Secret key for JWT admin token verification

## Dependencies
- `express`
- `axios`
- `jsonwebtoken`
- `cors`
- `helmet`
- `morgan`
- `dotenv`
