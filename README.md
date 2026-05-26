# HelpDesk Ticketing System

Backend foundation for a HelpDesk Ticketing System using Django, Django REST Framework, and PostgreSQL.

## Implemented

- Custom `User` model with roles: `CLIENT`, `AGENT`, `ADMIN`
- Core ticketing models:
  - `TicketCategory`
  - `Ticket`
  - `TicketComment`
  - `TicketAttachment`
- REST API with DRF viewsets and role-aware queryset restrictions
- Role-based behavior:
  - Clients can create tickets and only view their own data
  - Agents can view assigned tickets and update ticket status only
  - Admins can manage everything
- Django admin configuration
- OpenAPI schema and Swagger/ReDoc endpoints
- Seed command for categories and demo users

## Project Structure

```text
backend/
  apps/
    accounts/
    tickets/
  config/
  manage.py
requirements.txt
```

## Setup

1. Create and activate a virtual environment.

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

2. Install dependencies.

```powershell
pip install -r requirements.txt
```

3. Create PostgreSQL database and user, then copy environment values.

```powershell
Copy-Item .env.example .env
```

Set the values in `.env` or export them in your shell:

```powershell
$env:DJANGO_SECRET_KEY="replace-this"
$env:DJANGO_DEBUG="True"
$env:DJANGO_ALLOWED_HOSTS="127.0.0.1,localhost"
$env:POSTGRES_DB="helpdesk_db"
$env:POSTGRES_USER="helpdesk_user"
$env:POSTGRES_PASSWORD="helpdesk_password"
$env:POSTGRES_HOST="localhost"
$env:POSTGRES_PORT="5432"
```

4. Run migrations.

```powershell
cd backend
python manage.py migrate
```

5. Create an admin account if needed.

```powershell
python manage.py createsuperuser
```

6. Seed demo data.

```powershell
python manage.py seed_demo_data
```

7. Start the development server.

```powershell
python manage.py runserver
```

## API Endpoints

- API root: `http://127.0.0.1:8000/api/`
- Swagger UI: `http://127.0.0.1:8000/api/docs/swagger/`
- ReDoc: `http://127.0.0.1:8000/api/docs/redoc/`
- OpenAPI schema: `http://127.0.0.1:8000/api/schema/`
- Django admin: `http://127.0.0.1:8000/admin/`

## Demo Users

All seeded users use password `DemoPass123!`.

- `client_demo` (`CLIENT`)
- `agent_demo` (`AGENT`)
- `admin_demo` (`ADMIN`)

## Notes

- Authentication uses JWT for API access and Django sessions for admin login.
- Attachments are stored locally in `backend/media/`.

## JWT Authentication

Public auth endpoints:

- `POST /api/auth/token/`
- `POST /api/auth/token/refresh/`
- `POST /api/auth/token/verify/`
- `GET /api/auth/me/` requires a valid JWT access token

Swagger is configured for bearer tokens. Use:

```text
Bearer <access_token>
```

## Testing Steps

1. Install dependencies.

```powershell
pip install -r requirements.txt
```

2. Run migrations.

```powershell
cd backend
python manage.py migrate
```

3. Seed demo data.

```powershell
python manage.py seed_demo_data
```

4. Start the server.

```powershell
python manage.py runserver
```

5. Get a JWT token for the demo admin user.

Request:

```http
POST http://127.0.0.1:8000/api/auth/token/
Content-Type: application/json

{
  "username": "admin_demo",
  "password": "DemoPass123!"
}
```

Response:

```json
{
  "refresh": "<refresh_token>",
  "access": "<access_token>"
}
```

6. Open Swagger at `http://127.0.0.1:8000/api/docs/swagger/`.

7. Click `Authorize` and enter:

```text
Bearer <access_token>
```

8. Test:

- `GET /api/auth/me/`
- `GET /api/tickets/`
- `GET /api/categories/`
- `POST /api/tickets/` as `client_demo`
- `GET /api/tickets/` as `agent_demo` to confirm only assigned tickets are visible

## Frontend Phase 1

The frontend lives in `frontend/` and uses:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios

### Frontend Setup

1. Make sure the Django backend is running at `http://127.0.0.1:8000/`.
2. Install frontend dependencies.

```powershell
cd frontend
npm install
```

3. Start the Vite dev server.

```powershell
npm run dev
```

4. Open the frontend at `http://127.0.0.1:5173/`.

### Frontend Login Test

Use the seeded admin credentials:

```text
Username: admin_demo
Password: DemoPass123!
```

Expected behavior:

- Login sends credentials to `POST /api/auth/token/`
- Access and refresh tokens are stored in `localStorage`
- Protected routes redirect unauthenticated users to `/login`
- Dashboard loads current user data from `GET /api/auth/me/`
- Logout clears the stored tokens and returns to the login page
