# CivicSense Frontend Application

## Overview
A modern, responsive Vite + React single-page application for CivicSense — Smart City Issue Reporting & Management Platform.

## Features
- Citizen Issue Reporting & Map-based Visualization (Leaflet)
- Automatic Geocoding & Duplicate Detection
- Complaint Tracking Timeline
- Administrative Management Dashboard
- Analytics & Hotspot Visualization (Recharts)

## Environment Setup
Set `VITE_API_URL` to point to the API Gateway:
```env
VITE_API_URL=http://localhost:5000
```

## Running Locally
```bash
npm install
npm run dev
```

## Docker Build
```bash
docker build -t civicsense-frontend .
docker run -p 80:80 civicsense-frontend
```
