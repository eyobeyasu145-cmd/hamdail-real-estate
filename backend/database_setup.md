# PostgreSQL backend setup

This backend uses PostgreSQL through the `pg` driver. It does not connect to MongoDB, and it starts with an empty database. The server applies the versioned SQL migration in `migrations/` on startup.

## 1. Create a PostgreSQL database

Create a database named `realestate_db` using pgAdmin or `psql`:

```sql
CREATE DATABASE realestate_db;
```

## 2. Configure the backend

Copy `.env.example` to `.env` in this directory and set:

- `DATABASE_URL`: PostgreSQL connection string for `realestate_db`.
- `JWT_SECRET`: a private random value of at least 32 characters. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: both are required to provision the first admin account. The admin is created or updated on each server start. Use a unique password of at least 8 characters.
- `FRONTEND_URL`: the frontend origin, usually `http://localhost:5173`.
- `UPLOAD_DIR` is optional; by default, uploaded images are stored in `backend/uploads`.

Do not commit `.env` or share its values. For hosted PostgreSQL that requires TLS, set `DATABASE_SSL=true`; set `DATABASE_SSL_REJECT_UNAUTHORIZED=false` only when the provider requires it and its CA cannot be verified.
The image directory must be on persistent storage in production; the backend serves uploaded image URLs from that directory.

## 3. Install and run

From the repository root:

```powershell
npm install --prefix backend
npm --prefix backend run dev
```

The backend applies the initial migration and provisions the admin before listening on port 5000. Confirm the database connection at `http://localhost:5000/health`.

Run the frontend with `npm --prefix frontend run dev`. Set `VITE_API_URL` in `frontend/.env` only if the backend is not at `http://localhost:5000`.

## API used by the frontend

- `POST /api/auth/register` creates buyer and seller accounts; admin accounts are only provisioned through environment variables.
- `POST /api/auth/login` returns the user and a bearer token.
- `GET /api/properties` lists public properties; authenticated sellers receive their own listings.
- `GET /api/properties/:id`, `POST /api/properties`, `PUT /api/properties/:id`, and `DELETE /api/properties/:id` provide listing detail and seller management. Property images are stored locally in `uploads/`.
- `GET /api/users/profile` and `PUT /api/users/profile` provide profile access and updates.
- `POST /api/contact` stores contact form messages in PostgreSQL.
- `GET /api/admin/stats` and `/api/admin/users` plus admin user status/delete routes require an admin token.

Password reset and chat messaging are not configured yet. A reset is not completed by the frontend until a secure email/token delivery flow is added.
