# Skyline Student Organisation System (Integrated)

This project combines the existing Skyline admin dashboard with the CampusHub member portal and one role-based sign-in/sign-up page.

## Project structure

- `frontend/react-app` — React + Vite frontend.
- `backend` — Express API, PostgreSQL integration, authentication, and member portal event/goodie demo data.
- `backend/data.json` — local JSON store for member-portal events, goods, and demo orders. Keep this file when backing up the project.
- `backend/.env.example` — safe template for local configuration. Never commit your real `.env`.

## 1. Configure the backend

1. Install Node.js (LTS) and PostgreSQL.
2. In `backend`, copy `.env.example` to `.env`.
3. Edit `backend/.env` with your actual PostgreSQL username, database name, password, and port.
4. Set a unique, strong `ADMIN_PASSWORD` and a long random `JWT_SECRET` before running.
5. Make sure the PostgreSQL database named by `DB_NAME` exists and the existing tables used by the admin dashboard (`members`, etc.) have been created.

The backend creates the `app_users` authentication table on startup. It seeds/updates the admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`. The admin password is hashed in the database. Public sign-up always creates the `member` role; a user cannot choose the admin role from the form.

If the admin password is changed in `.env`, restart the backend; the configured admin password hash will be updated on startup.

Run in a terminal:

```powershell
cd backend
npm install
npm run dev
```

The API runs at `http://localhost:5000`.

## 2. Run the frontend

Open a second terminal:

```powershell
cd frontend/react-app
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

The frontend defaults to `http://localhost:5000/api`. To override it, create `frontend/react-app/.env` containing:

```env
VITE_API_URL=http://localhost:5000/api
```

Restart Vite after changing frontend environment variables.

## 3. Login behavior

- Admin: sign in using the `ADMIN_EMAIL` and `ADMIN_PASSWORD` configured in `backend/.env`. The admin dashboard opens.
- Member: sign up with a name, email, and strong password, then sign in. The member portal opens.
- Admin-only API routes require a valid JWT with the `admin` role. The browser interface alone does not grant admin permissions.
- Sessions expire after 8 hours; sign in again when asked.
- Member event/goodie checkout is a demo only; it does not charge real money.

## Important deployment notes

- Do not deploy with the sample admin password or development JWT secret.
- Configure environment variables in the backend host and configure the frontend `VITE_API_URL` to the deployed API URL.
- Update CORS to allow only your deployed frontend origin.
- `data.json` is suitable for a local/demo project, not concurrent multi-user production orders. For production, migrate the member portal event/goodie/order data to PostgreSQL.
