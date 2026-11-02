# Neon PostgreSQL and Prisma setup

The backend uses Prisma 7 with Neon PostgreSQL. Keep the pooled Neon connection string in `DATABASE_URL` for application queries and the direct (unpooled) Neon connection string in `DIRECT_URL` for Prisma migrations. The runtime PostgreSQL adapter uses `DATABASE_URL`; Prisma CLI reads `DIRECT_URL` from `prisma.config.ts`. Get both URLs from the Neon dashboard; never commit either value.

## Configure the backend

1. In Neon, create or select a PostgreSQL project and database.
2. Copy `.env.example` to `.env` in this directory.
3. Copy the pooled connection string into `DATABASE_URL` and the direct connection string into `DIRECT_URL` in `backend/.env`.
4. Set a private `JWT_SECRET` of at least 32 characters. Configure `ADMIN_NAME`, `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_PHONE` for the administrator; `OWNER_NAME`, `OWNER_USERNAME`, `OWNER_EMAIL`, `OWNER_PASSWORD`, and `OWNER_PHONE` for the single seller/owner; and `AGENT_NAME`, `AGENT_USERNAME`, `AGENT_EMAIL`, `AGENT_PASSWORD`, and `AGENT_PHONE` for the staff agent. Use a different email, username, and unique password for each account. Usernames are 3–40 letters, numbers, dots, underscores, or hyphens. Passwords must be at least 8 characters, include uppercase and lowercase letters, a number, and a symbol, and fit within bcrypt's 72-byte limit. Longer passwords are strongly recommended. Do not commit `.env` or send passwords in chat. If a password has been shared, replace it with a new one.
5. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `EMAIL_FROM` with your email provider's SMTP settings. Port 587 with `SMTP_SECURE=false` uses required STARTTLS; port 465 normally uses `SMTP_SECURE=true`.

The connection URLs must include `sslmode=require`. If a connection string was exposed, rotate its password in Neon and use the replacement. Prisma 7 no longer accepts connection URL properties in `schema.prisma`; keep database URLs in environment variables and `prisma.config.ts`.

## Create the schema and run the backend

From the repository root:

```powershell
npm install --prefix backend
npm --prefix backend run db:generate
npm --prefix backend run dev
```

The development command automatically applies pending committed migrations before starting the server. To apply them manually, run `npm --prefix backend run db:deploy`. For production, apply committed migrations as a deployment step before starting the server. When changing the schema locally, use `npm --prefix backend run db:migrate` to create and apply a migration. The schema source is `prisma/schema.prisma`.

Registration now requires a unique username and email verification before sign-in. Users can sign in with either their username or email. Existing accounts receive a generated username during the username migration. Verification and password-reset codes are six digits, expire after 10 minutes, are stored as keyed hashes, are single-use, and allow at most five attempts. Code resends are cooled down and authentication/email endpoints are rate-limited. Password reset invalidates existing JWT sessions. The built-in IP rate limiter uses in-memory counters; configure a shared rate-limit store before running multiple backend instances. Configure and test SMTP delivery before enabling public registration.

The configured administrator, owner, and agent accounts are provisioned as active and email-verified at server startup. Their configured profile and password are applied on every startup, so changing one requires changing the matching secret in `.env` or your deployment secret manager before restart. Keep these values private. Public registration is buyer-only; seller/owner, agent, and admin accounts are provisioned from private environment configuration.

Check the database connection at `http://localhost:5000/health`. Run the frontend with `npm --prefix frontend run dev`. Set `VITE_API_URL` in `frontend/.env` only if the backend is not at `http://localhost:5000`.

Uploaded images are stored locally in `uploads/`; use persistent storage in production.

## API used by the frontend

- `POST /api/auth/register` creates buyer accounts only; owner, agent, and admin accounts are provisioned through environment variables.
- `POST /api/auth/verify-email` verifies a six-digit emailed code; `POST /api/auth/resend-verification` requests another code.
- `POST /api/auth/login` returns the user and a bearer token only after email verification.
- `POST /api/auth/forgot-password` requests a reset code; `POST /api/auth/reset-password` consumes the code and changes the password.
- `GET /api/properties` lists public properties; authenticated sellers receive their own listings.
- `GET /api/properties/:id`, `POST /api/properties`, `PUT /api/properties/:id`, and `DELETE /api/properties/:id` provide listing detail and seller management.
- `GET /api/users/profile` and `PUT /api/users/profile` provide profile access and updates.
- `POST /api/contact` stores contact messages in PostgreSQL.
- `GET /api/admin/stats` and `/api/admin/users` plus admin user status/delete routes require an admin token.

Password reset and chat messaging are not configured yet. A password reset requires a secure email/token delivery flow.
