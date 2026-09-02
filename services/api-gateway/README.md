# API Gateway Service

## Purpose
The API Gateway serves as the single entry point for frontend client applications. It handles routing, CORS, logging, and forwards incoming requests to the appropriate downstream microservice.

## Port
`5000`

## Routing Rules
- `/api/auth/*` → `AUTH_SERVICE_URL` (Port 5001)
- `/api/complaints/*` → `COMPLAINT_SERVICE_URL` (Port 5002)
- `/api/admin/*` → `ADMIN_SERVICE_URL` (Port 5003)
- `/api/analytics/*` → `ANALYTICS_SERVICE_URL` (Port 5004)
- `GET /health` → Gateway health check

## Environment Variables
- `PORT`: Server listening port (default `5000`)
- `NODE_ENV`: Application environment (`development` / `production`)
- `AUTH_SERVICE_URL`: URL of the Auth Service
- `COMPLAINT_SERVICE_URL`: URL of the Complaint Service
- `ADMIN_SERVICE_URL`: URL of the Admin Service
- `ANALYTICS_SERVICE_URL`: URL of the Analytics Service

## Dependencies
- `express`
- `http-proxy-middleware`
- `cors`
- `helmet`
- `morgan`
- `dotenv`
