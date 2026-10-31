# ElevAI - AI-Powered Elevator Maintenance and Fault Management System

A 100% software application (no hardware, sensors or IoT). React + Vite + Tailwind frontend, Node/Express backend, MongoDB + Mongoose, JWT auth, Grok (xAI) for AI features, Recharts and Lucide icons.

## Features
- **Roles**: Admin, Technician, Building User, each with its own dashboard and protected routes.
- **Elevators**: add, edit, delete, view (ID, building, location, floors, model, status).
- **Fault reporting**: category, description, elevator, optional image; auto complaint ID (`CMP-2026-00001`); status tracking and timeline.
- **AI fault diagnosis** (Grok): probable fault, possible causes, severity, recommended actions, precautions (JSON, validated server-side).
- **Technicians**: add, assign complaints, update repair status, repair history.
- **Maintenance**: schedules, recurring jobs, completed service records, component history, reminders (overdue / due in 7-14 days).
- **Predictive maintenance**: rule-based estimates computed from real complaint and maintenance records, shown separately from on-demand **AI predictions**. No sensor data is used or invented.
- **AI assistant**: maintenance FAQ and troubleshooting chat.
- **Analytics**: fault trends, maintenance history, technician performance, printable monthly report.
- **Security**: bcrypt, JWT, role checks, express-validator, Helmet, CORS allow-list, rate limiting (global, auth, AI), Mongo operator sanitization, upload type/size limits. The xAI key lives only in `backend/.env`.

## Requirements
Node.js 18+, MongoDB (local or Atlas), an xAI API key from https://console.x.ai (optional: everything except AI features works without it).

## Installation

```bash
# 1. Backend
cd backend
cp .env.example .env        # then edit .env (JWT_SECRET, MONGODB_URI, XAI_API_KEY)
npm install
npm run seed                # WARNING: wipes users, elevators, complaints, maintenance
npm run dev                 # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Vite proxies `/api` and `/uploads` to `http://localhost:5000`, so no frontend env file is needed in development.

### Environment variables (backend/.env)
| Variable | Purpose |
|---|---|
| `PORT`, `NODE_ENV`, `CLIENT_URL` | Server port, mode, allowed browser origin(s), comma separated |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Token signing secret (16+ chars) and lifetime |
| `XAI_API_KEY` | Your xAI key (server only) |
| `XAI_BASE_URL` | `https://api.x.ai/v1` |
| `XAI_MODEL` | Default `grok-4.7`. Change it if your xAI account uses a different model name |
| `XAI_TIMEOUT_MS` | AI request timeout (default 60000) |

## Demo accounts (after `npm run seed`)
| Role | Email | Password |
|---|---|---|
| Admin | admin@elevai.com | Admin@123 |
| Technician | technician@elevai.com | Tech@123 |
| Building user | user@elevai.com | User@123 |

Other technicians: `suresh.babu@`, `meena.iyer@`, `karthik.rao@elevai.com` (Tech@123). Other users use `User@123`.
The seed creates 8 elevators, ~37 complaints and ~35 maintenance records over the last 6 months (including repeat door and rope faults so predictive maintenance has real history). Seeded complaints have no AI diagnosis; click **Run AI diagnosis** on any complaint.

## API overview (all under `/api`)
| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Dashboards | `GET /dashboard/admin\|technician\|user` |
| Elevators | `GET/POST /elevators`, `GET/PUT/DELETE /elevators/:id` |
| Complaints | `GET/POST /complaints` (multipart), `GET/DELETE /complaints/:id`, `POST /:id/diagnose`, `PATCH /:id/assign`, `PATCH /:id/status` |
| Technicians | `GET/POST /technicians`, `PUT/DELETE /technicians/:id`, `GET /technicians/:id/history` |
| Maintenance | `GET/POST /maintenance`, `PUT/DELETE /:id`, `PATCH /:id/start`, `PATCH /:id/complete`, `GET /reminders`, `GET /component-history?elevator=` |
| Predictive | `GET /predictive/rule-based`, `POST /predictive/ai` |
| AI | `GET /ai/status`, `POST /ai/chat` |
| Analytics | `GET /analytics/fault-trends`, `/maintenance-history`, `/technician-performance`, `/monthly-report?month=YYYY-MM` |

## Notes
- Public registration creates **building users** only; admins create technicians.
- Completing a complaint automatically records a corrective maintenance entry, which feeds component history and predictive maintenance. Elevator status syncs with active repairs (`out_of_service` is only changed manually).
- Production: `npm run build` in `frontend`, serve `dist/`, and set `VITE_API_URL` / `VITE_FILE_BASE_URL` plus `CLIENT_URL` on the backend.
