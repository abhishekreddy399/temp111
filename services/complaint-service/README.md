# Complaint Service

## Purpose
Manages civic issue reporting, geospatial duplicate detection, image uploads to Cloudinary, reverse geocoding via OpenStreetMap, status tracking, upvoting, escalation, and email notifications.

## Port
`5002`

## Endpoints
- `POST /api/complaints/report` — Report/create civic complaint with image
- `PUT /api/complaints/escalate/:id` — Escalate a complaint after 3 reports
- `GET /api/complaints/admin/escalated` — Get list of escalated complaints
- `GET /api/complaints/nearby` — Find complaints near latitude & longitude
- `GET /api/complaints/:complaintId` — Get complaint details by ID (e.g. `CIV-2026-1234`)
- `POST /api/complaints/:complaintId/upvote` — Upvote an existing complaint
- `GET /health` — Health check endpoint

### Internal Endpoints (for Admin & Analytics services)
- `GET /api/complaints/internal/admin/complaints`
- `PATCH /api/complaints/internal/admin/:id/status`
- `PATCH /api/complaints/internal/admin/:id/assign`
- `GET /api/complaints/internal/analytics/raw-data`

## Environment Variables
- `PORT`: Service port (default `5002`)
- `NODE_ENV`: Application environment (`development` / `production`)
- `COMPLAINT_MONGODB_URI`: MongoDB connection string for Complaints database (`civicsense_complaints`)
- `JWT_SECRET`: Secret key for JWT verification
- `CLOUDINARY_CLOUD_NAME`: Cloudinary name for image hosting
- `CLOUDINARY_API_KEY`: Cloudinary API Key
- `CLOUDINARY_API_SECRET`: Cloudinary API Secret
- `EMAIL_USER`: Gmail SMTP user email
- `EMAIL_PASS`: Gmail SMTP app password

## Dependencies
- `express`
- `mongoose`
- `cloudinary`
- `multer`
- `streamifier`
- `nodemailer`
- `cors`
- `helmet`
- `morgan`
- `dotenv`
