# ElevAI - AI-Powered Elevator Maintenance and Fault Management System
 
A 100% software application (no hardware, sensors or IoT). Building users report elevator faults, administrators assign technicians and schedule maintenance, and Google Gemini explains faults and helps prioritise maintenance based on your own recorded history.
 
## Tech stack
| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Lucide React |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT + bcrypt |
| AI | Google Gemini API (called from the backend only) |
 
## Features
- **Three roles** (Admin, Technician, Building User), each with its own dashboard and protected routes.
- **Elevator management:** add, edit, delete, view (ID, building, location, floors, model, status).
- **Fault reporting:** category, description, elevator and optional photo. A complaint ID such as `CMP-2026-00001` is generated and the status is tracked on a timeline.
- **AI fault diagnosis:** probable fault, possible causes, severity, recommended actions and precautions.
- **Technician management:** add technicians, assign complaints, update repair status, repair history.
- **Maintenance:** schedules (including repeating jobs), completed service records, component history, overdue and upcoming reminders.
- **Predictive maintenance:** rule-based estimates calculated from real complaint and maintenance records, shown separately from on-demand AI predictions. No sensor data is used or invented.
- **AI assistant:** chat for maintenance FAQs and troubleshooting.
- **Analytics:** fault trends, maintenance history, technician performance and a printable monthly report.
- **Security:** hashed passwords, JWT, role checks, input validation, Helmet, CORS allow-list, rate limiting, Mongo operator sanitising, upload type and size limits. The API key stays on the server.
## Requirements
- Node.js 18 or newer
- MongoDB (local install or a MongoDB Atlas connection string)
- A Gemini API key from https://aistudio.google.com/apikey (optional: everything except the AI features works without it)
## Project structure
```
elevator-ai/
  backend/
    server.js
    src/
      app.js
      config/        env, database, constants
      models/        User, Elevator, Complaint, Maintenance, Counter
      middleware/    auth, validation, upload, error handler
      services/      grokService.js (Gemini), predictiveService, analyticsService, elevatorStatus
      controllers/   one per module
      routes/        one per module
      seed/          seed.js, createAdmin.js
    uploads/         uploaded fault photos
  frontend/
    src/
      api/           axios client
      context/       auth and toast providers
      hooks/         useApi
      components/    layout, modals, badges, cards, charts
      pages/         login, register, admin/, technician/, user/, shared/
```
`grokService.js` keeps its old name but now talks to Gemini.
 
## Installation
 
### 1. Backend
```bash
cd backend
cp .env.example .env      # Windows: copy .env.example .env
npm install
```
Edit `.env` (see the table below), then load the demo data and start the server:
```bash
npm run seed              # WARNING: deletes all existing data first
npm run dev               # http://localhost:5000
```
 
### 2. Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```
In development Vite forwards `/api` and `/uploads` to `http://localhost:5000`, so the frontend needs no environment file.
 
### Environment variables (`backend/.env`)
| Variable | Purpose |
|---|---|
| `PORT` | Backend port (default 5000) |
| `NODE_ENV` | `development` or `production` |
| `CLIENT_URL` | Allowed browser origin(s), comma separated (default `http://localhost:5173`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string (16+ characters) used to sign tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `GEMINI_API_KEY` | Your Gemini API key (server only) |
| `GEMINI_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai` |
| `GEMINI_MODEL` | Main model, for example `gemini-3.8-flash` |
| `GEMINI_FALLBACK_MODELS` | Backup model(s), comma separated, used when the main model is overloaded |
| `GEMINI_TIMEOUT_MS` | AI request timeout in milliseconds (default 60000) |
 
Google retires and renames models regularly. If you get a "model not found" error, check https://ai.google.dev/gemini-api/docs/deprecations and update `GEMINI_MODEL`.
 
## Demo accounts (after `npm run seed`)
| Role | Email | Password |
|---|---|---|
| Admin | admin@elevai.com | Admin@123 |
| Technician | technician@elevai.com | Tech@123 |
| Building user | user@elevai.com | User@123 |
 
Other technicians: `suresh.babu@elevai.com`, `meena.iyer@elevai.com`, `karthik.rao@elevai.com` (password `Tech@123`). Other building users use `User@123`.
 
The seed creates 8 elevators, about 37 complaints and about 35 maintenance records spread over the last six months, including repeated door and rope faults so predictive maintenance has real history to analyse. Seeded complaints have no AI diagnosis: open any complaint and click **Run AI diagnosis**.
 
## Creating your own admin account
Public registration only creates building users. To create an admin without wiping data, run this from the `backend` folder:
```bash
node src/seed/createAdmin.js "Your Name" you@example.com YourPassword123
```
Or add `"create-admin": "node src/seed/createAdmin.js"` to the `scripts` block of `backend/package.json` (watch the comma on the line before it) and run:
```bash
npm run create-admin -- "Your Name" you@example.com YourPassword123
```
If the email already exists, that account is promoted to admin and its password is reset. Admins then create technician accounts under **Technicians**.
 
## How the roles work
- **Building user:** report faults, see AI analysis of their own reports, track complaint status, use the AI assistant.
- **Technician:** see assigned repair jobs, start work and mark jobs completed with repair notes, run assigned maintenance services, view reminders and predictive insights.
- **Admin:** everything above plus elevators, technicians, assignment, scheduling, analytics and AI predictions.
Completing a complaint automatically records a corrective maintenance entry. That feeds the component history and predictive maintenance. Elevator status follows active repairs automatically, and `out of service` is only changed manually by an admin.
 
## API overview (all under `/api`)
| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Dashboards | `GET /dashboard/admin`, `/technician`, `/user` |
| Elevators | `GET, POST /elevators`; `GET, PUT, DELETE /elevators/:id` |
| Complaints | `GET, POST /complaints` (multipart); `GET, DELETE /complaints/:id`; `POST /:id/diagnose`; `PATCH /:id/assign`; `PATCH /:id/status` |
| Technicians | `GET, POST /technicians`; `PUT, DELETE /technicians/:id`; `GET /technicians/:id/history` |
| Maintenance | `GET, POST /maintenance`; `PUT, DELETE /:id`; `PATCH /:id/start`; `PATCH /:id/complete`; `GET /reminders`; `GET /component-history?elevator=` |
| Predictive | `GET /predictive/rule-based`, `POST /predictive/ai` |
| AI | `GET /ai/status`, `POST /ai/chat` |
| Analytics | `GET /analytics/fault-trends`, `/maintenance-history`, `/technician-performance`, `/monthly-report?month=YYYY-MM` |
 
## Troubleshooting
| Problem | Fix |
|---|---|
| Backend exits with a `JWT_SECRET` message | Set a long `JWT_SECRET` in `backend/.env` |
| Cannot connect to MongoDB | Start MongoDB or correct `MONGODB_URI` |
| Login fails after seeding | Use the demo credentials above and make sure the seed finished without errors |
| "AI service is not configured" | Add `GEMINI_API_KEY` to `backend/.env` and restart the backend |
| "AI model ... was not found" | The model was retired or misspelled. Update `GEMINI_MODEL` |
| "AI service error (503) ... high demand" | Google is overloaded. The backend retries and uses `GEMINI_FALLBACK_MODELS`; if both are busy, wait a few minutes |
| AI request times out (504) | Increase `GEMINI_TIMEOUT_MS`, and raise the axios `timeout` in `frontend/src/api/client.js` to match |
| The console shows a React Router "Future Flag Warning" | Harmless notice about React Router v7. It can be ignored |
| Uploaded photos do not show | Make sure the backend is running, since images are served from `/uploads` |
 
The real reason for any AI error is printed in the backend terminal on a line starting with `[AI]`.
 
## Production notes
1. Run `npm run build` in `frontend` and serve the `dist` folder from any static host.
2. Set `VITE_API_URL` (for example `https://api.example.com/api`) and `VITE_FILE_BASE_URL` (for example `https://api.example.com`) before building if the API is on a different origin.
3. Set `CLIENT_URL` on the backend to your frontend's URL and use `NODE_ENV=production`.
4. Use a strong `JWT_SECRET`, change or delete the demo accounts, and keep `.env` out of version control.
5. Back up the `uploads` folder along with the database.
## Notes
- AI guidance is decision support only. A qualified technician must verify any diagnosis or prediction before work is done.
- Predictive results are only as good as the records entered. Rule-based estimates need at least a few recorded complaints, and the page says so when data is thin.
 
