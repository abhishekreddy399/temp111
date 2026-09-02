# Auth Service

## Purpose
Handles user registration, user login, password hashing, and JWT token issuance for citizens and administrators.

## Port
`5001`

## API Endpoints
- `POST /api/auth/register` — Register a new citizen or admin
- `POST /api/auth/login` — Login user & return JWT token
- `GET /api/auth/me` — Get current logged-in user profile (requires Bearer token)
- `GET /health` — Health check endpoint

## Environment Variables
- `PORT`: Service port (default `5001`)
- `NODE_ENV`: Application environment (`development` / `production`)
- `AUTH_MONGODB_URI`: MongoDB connection string for Auth database (`civicsense_auth`)
- `JWT_SECRET`: Secret key used for signing JWT tokens
- `JWT_EXPIRE`: Token expiration duration (default `7d`)
- `ADMIN_SECRET`: Secret required to register an admin account

## Dependencies
- `express`
- `mongoose`
- `jsonwebtoken`
- `bcryptjs`
- `cors`
- `helmet`
- `morgan`
- `dotenv`
