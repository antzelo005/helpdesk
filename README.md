# HelpDesk App

HelpDesk App is a full-stack ticketing system built with Django REST Framework on the backend and React + TypeScript on the frontend. It supports role-based access for clients, agents, and admins, JWT authentication for the app, and a clean dashboard-driven UI for managing tickets, comments, attachments, and account settings.

## Overview

This project includes:

- A Django API with role-aware permissions
- A React frontend with protected routes and a token-based auth flow
- Ticket creation, filtering, detail views, comments, attachments, and workflow updates
- Profile settings and password change
- Registration for new client users
- A light/dark theme system with semantic tokens

## Screenshots

Login page  
`screenshot of context`

Dashboard  
`screenshot of context`

Tickets page  
`screenshot of context`

Ticket detail page  
`screenshot of context`

Settings page  
`screenshot of context`

## Core Features

### Authentication and accounts

- JWT login using access and refresh tokens
- Protected frontend routes
- Current user profile endpoint
- Profile update for `first_name`, `last_name`, and `email`
- Password change flow
- Client self-registration

### Roles

- `Client`
  - Can register
  - Can create tickets
  - Can see only their own tickets, comments, and attachments
- `Agent`
  - Can see assigned tickets only
  - Can update ticket status on assigned tickets
- `Admin`
  - Can access all tickets and users
  - Can manage categories
  - Can delete tickets

### Tickets

- Ticket list with search, filters, sorting, and URL-persisted state
- Ticket detail page with comments and attachments
- Attachment upload and preview/download section
- Optimistic comment posting
- Workflow status updates with loading states
- Admin-only delete ticket action with confirmation

### Frontend UX

- Dashboard with metric cards and recent work
- Reusable UI primitives for cards, buttons, fields, badges, headers, skeletons, and dialogs
- Responsive app shell with sidebar and desktop utility panel
- Theme toggle support
- Improved dark mode based on semantic theme tokens

## Tech Stack

### Backend

- Python
- Django
- Django REST Framework
- PostgreSQL
- Simple JWT
- drf-spectacular
- django-filter

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- Axios
- Tailwind CSS

## Project Structure

```text
HelpDeskApp/
|-- backend/
|   |-- apps/
|   |   |-- accounts/
|   |   `-- tickets/
|   |-- config/
|   `-- manage.py
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- components/
|   |   |-- context/
|   |   |-- lib/
|   |   |-- pages/
|   |   `-- router.tsx
|   `-- package.json
|-- requirements.txt
`-- README.md
```

## Backend Setup

1. Create and activate a virtual environment.

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

2. Install backend dependencies.

```powershell
pip install -r requirements.txt
```

3. Create a `.env` file in the project root.

Example:

```env
DJANGO_SECRET_KEY=unsafe-dev-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
POSTGRES_DB=helpdesk_db
POSTGRES_USER=helpdesk_user
POSTGRES_PASSWORD=helpdesk_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

4. Run migrations.

```powershell
cd backend
python manage.py migrate
```

5. Seed demo data.

```powershell
python manage.py seed_demo_data
```

6. Start the Django server.

```powershell
python manage.py runserver
```

Backend base URL:

```text
http://127.0.0.1:8000/
```

## Frontend Setup

1. Open a second terminal.
2. Install frontend dependencies.

```powershell
cd frontend
npm install
```

3. Start the Vite development server.

```powershell
npm run dev
```

Frontend base URL:

```text
http://127.0.0.1:5173/
```

## Demo Accounts

Seeded demo users all use this password:

```text
DemoPass123!
```

Accounts:

- `admin_demo` -> `Admin`
- `agent_demo` -> `Agent`
- `client_demo` -> `Client`

## Frontend Routes

- `/login`
- `/register`
- `/dashboard`
- `/tickets`
- `/tickets/:ticketId`
- `/settings`

## API Endpoints

### Auth

- `POST /api/auth/token/`
- `POST /api/auth/token/refresh/`
- `POST /api/auth/token/verify/`
- `POST /api/auth/register/`
- `GET /api/auth/me/`
- `PATCH /api/auth/me/`
- `POST /api/auth/change-password/`

### Main resources

- `GET /api/users/`  
  Admin only
- `GET /api/categories/`
- `GET /api/tickets/`
- `POST /api/tickets/`
- `GET /api/tickets/{id}/`
- `PATCH /api/tickets/{id}/`
- `DELETE /api/tickets/{id}/`  
  Admin only
- `GET /api/comments/`
- `POST /api/comments/`
- `GET /api/attachments/`
- `POST /api/attachments/`

### Documentation

- Swagger UI: `http://127.0.0.1:8000/api/docs/swagger/`
- ReDoc: `http://127.0.0.1:8000/api/docs/redoc/`
- OpenAPI schema: `http://127.0.0.1:8000/api/schema/`
- Django admin: `http://127.0.0.1:8000/admin/`

## Auth Flow

1. The user signs in from the React app.
2. The frontend calls `POST /api/auth/token/`.
3. Access and refresh tokens are stored in local storage.
4. Protected routes load only when the user is authenticated.
5. The frontend fetches the current user from `GET /api/auth/me/`.
6. Logout clears stored tokens and returns the user to `/login`.

## Registration Flow

- The registration page is available at `/register`.
- A new user can submit:
  - `username`
  - `email`
  - `first_name`
  - `last_name`
  - `password`
  - `confirm_password`
- The backend always creates registered users as `Client`.
- The frontend redirects back to login after successful registration.

## Ticket Workflow Rules

### Client

- Can create tickets
- Can read only their own tickets
- Cannot update tickets after creation
- Cannot delete tickets

### Agent

- Can read assigned tickets only
- Can update `status` only on assigned tickets
- Cannot delete tickets

### Admin

- Can read all tickets
- Can update all tickets
- Can delete tickets

## Settings Page

The settings page allows authenticated users to:

- View username and role
- Update:
  - first name
  - last name
  - email
- Change password by entering:
  - current password
  - new password
  - confirm new password

The role is read-only in the UI.

## UI Notes

- The app uses a white/blue light theme and a slate-based dark theme
- Theme values are managed through semantic CSS variables
- Reusable UI primitives reduce repeated page markup
- The interface is responsive for mobile, tablet, and desktop layouts

## Common Commands

### Backend

```powershell
cd backend
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver
python manage.py check
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
npm run build
```

## Manual Testing Checklist

### Register a new client

1. Open `/register`
2. Submit the form with valid values
3. Confirm success toast
4. Confirm redirect to `/login`

### Login

1. Open `/login`
2. Sign in with `admin_demo`, `agent_demo`, or `client_demo`
3. Confirm redirect to `/dashboard`
4. Confirm role-aware content loads correctly

### Dashboard

1. Confirm metric cards load
2. Confirm recent work panels render
3. Confirm layout looks correct on wide screens
4. Confirm no noisy placeholder panels remain

### Tickets

1. Open `/tickets`
2. Test search and filters
3. Confirm sort behavior works
4. Confirm filters persist in query params
5. As `Client`, create a new ticket

### Ticket detail

1. Open a ticket detail page
2. Add a comment
3. Confirm optimistic comment behavior
4. Upload or view attachments
5. As `Admin`, delete a ticket and confirm redirect to `/tickets`
6. As `Client` or `Agent`, confirm the delete button is not shown

### Settings

1. Open `/settings`
2. Update first name, last name, or email
3. Confirm success toast
4. Change password with valid values
5. Confirm mismatched passwords are blocked on the frontend

### Theme

1. Toggle light/dark mode
2. Confirm headings, forms, cards, tables, and utility panels remain readable
3. Confirm both themes remain visually consistent

## Notes

- JWT is used for app authentication
- Django session auth still supports Django admin
- Attachments are stored in `backend/media/`
- CORS is enabled for development

## License

This project is currently for educational and portfolio use unless you define a different license for distribution.
