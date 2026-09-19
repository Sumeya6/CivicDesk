# IT Service Request and Maintenance Management System (CivicDesk)

[![Stack](https://img.shields.io/badge/Stack-PERN-336791?style=flat-square)](https://www.postgresql.org/)
[![Express](https://img.shields.io/badge/Backend-Express.js-000000?style=flat-square)](https://expressjs.com/)
[![React](https://img.shields.io/badge/Frontend-React.js-61DAFB?style=flat-square)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?style=flat-square)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat-square)](https://www.postgresql.org/)
[![i18n](https://img.shields.io/badge/Languages-Amharic%20%7C%20English-1E90FF?style=flat-square)](#internationalization)

A web-based platform that digitizes internal IT maintenance operations — replacing paper-based service requests with electronic ticketing, automated technician assignment, SLA monitoring, and centralized reporting. Built with **Express + Prisma + PostgreSQL** on the backend and **React.js** on the frontend, with full **Amharic/English** bilingual support.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [User Roles](#user-roles)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Database Design](#database-design)
- [API Overview](#api-overview)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Internationalization](#internationalization)
- [Deployment](#deployment)
- [Testing](#testing)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

**CivicDesk** replaces manual paperwork and direct technician communication with a centralized, trackable digital workflow. Employees submit hardware, software, and networking issues electronically; the system automatically routes each request to the right technician based on office and workload, tracks resolution against service-level standards, and generates historical and periodic reports for management.

The system is designed for organizations with multiple offices and a shared technician pool, prioritizing **simplicity, usability, and bilingual accessibility** (Amharic and English) to drive adoption away from the existing paper process.

---

## Key Features

### Authentication & Access Control

- Phone-number-based registration and login
- Password hashing (bcrypt) and password change flow
- Role-based access control (`EMPLOYEE`, `TECHNICIAN`, `ADMIN`)
- Account activation/deactivation by Admins
- Per-user language preference, remembered across sessions

### Office & User Management

- Office CRUD with active/inactive status
- Multi-office technician assignment (`TechnicianOffice` mapping)
- Admin user directory with role filtering and status toggles

### IT Service Request (Ticketing) Management

- Ticket submission across Hardware, Software, and Networking categories
- Configurable priority levels (Low / Medium / High / Critical)
- Five-stage status workflow: `Pending → Assigned → In Progress → Resolved → Closed`
- Automatic technician assignment based on employee office and lowest active technician workload
- Manual reassignment by Admins
- Maintenance notes: diagnosis, work performed, parts replaced, recommendations

### SLA (Service Standard) Monitoring

- Per-category expected resolution time
- Automatic comparison of actual vs. expected resolution time
- Mandatory justification required before closing a ticket that exceeds its SLA

### Audit Trail

- Immutable log of every ticket lifecycle event: creation, assignment, status change, resolution
- Full visibility into who did what and when, per ticket

### Reporting & Analytics

- Periodic reports: Monthly, 3-Month, 6-Month, 9-Month, Annual
- Metrics: total/pending/resolved/closed requests, requests by office, requests by category, technician workload, SLA compliance %, average resolution time, most frequently reported issues
- CSV / PDF report export

### Search & Filtering

- Multi-field ticket search: employee, technician, office, status, priority, category, date range
- Server-side pagination

### Announcements

- Admin-published organization-wide notices (scheduled maintenance, downtime, software updates)
- Visible across Employee, Technician, and Admin dashboards

### Asset Management

- Full IT asset registry: computers, printers, phones, network devices, furniture, and other equipment
- Unique asset tags for identification (e.g. "IT-001")
- Asset lifecycle tracking: Active → Maintenance → Retired → Archived
- Office and optional employee assignment
- Purchase date and warranty expiry tracking
- Link assets to service requests (tickets) for full maintenance history
- Employee view: see assets assigned to you and their ticket history
- Technician view: see assets in your assigned offices
- Admin: full CRUD, search/filter by tag/name/serial, archive assets

### Internationalization

- Full Amharic (አማርኛ) and English UI coverage
- Instant language switching via navbar toggle
- Language preference persisted per user

---

## User Roles

| Role              | Identifier   | Capabilities                                                                                                                                                           |
| ----------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Employee**      | `EMPLOYEE`   | Register/login, submit service requests, track request status, view maintenance history, view assigned assets                                                           |
| **Technician**    | `TECHNICIAN` | Receive assigned requests (one or more offices), update progress, log maintenance notes, view work history, view assets in assigned offices                             |
| **Administrator** | `ADMIN`      | Manage users, technicians, offices, and assets; configure categories and SLAs; monitor technician performance; generate reports; publish announcements; manage system settings |

---

## Architecture

```
[Frontend]                                          [Backend]
React.js (SPA)                                       Express.js
  |                                                    |
  | REST API (Axios) ---------------------------------> |
  |                                                    |
  |   ┌─────────────────────────┐     ┌──────────────────────────────┐
  |   │  Frontend Architecture  │     │   Backend Architecture       │
  |   │                         │     │                              │
  |   │  App.jsx (Router)       │     │  server.js                   │
  |   │   ├─ AuthContext        │     │   ├─ CORS → Helmet          │
  |   │   ├─ ProtectedRoute     │     │   ├─ Auth (JWT) → RBAC      │
  |   │   ├─ Pages (Employee/   │     │   ├─ Validation             │
  |   │   │   Technician/Admin) │     │   ├─ Assignment Service     │
  |   │   ├─ Redux Store        │     │   ├─ SLA Engine             │
  |   │   ├─ LanguageContext    │     │   ├─ Routes → Controllers   │
  |   │   └─ Components         │     │   └─ Audit Logger           │
  |   └─────────────────────────┘     └──────────────────────────────┘
  |                                                    |
  |                                              [PostgreSQL]
  |                                              (via Prisma ORM)
```

### Request Pipeline (Applied in Order)

```
Request → CORS → JWT Verify → Role Authorization (RBAC)
       → Input Validation → Controller Logic → Audit Log → Response
```

---

## Tech Stack

### Backend

| Category           | Technology                     |
| ------------------ | ------------------------------ |
| Runtime            | Node.js 18+                    |
| Framework          | Express.js                     |
| ORM                | Prisma                         |
| Database           | PostgreSQL                     |
| Authentication     | JWT (`jsonwebtoken`), `bcrypt` |
| Validation         | `express-validator`            |
| Scheduling / Dates | `dayjs`                        |
| Config             | `dotenv`                       |
| Cross-Origin       | `cors`                         |

### Frontend

| Category             | Technology                                        |
| -------------------- | ------------------------------------------------- |
| Framework            | React.js                                          |
| Routing              | `react-router-dom`                                |
| State Management     | Redux Toolkit (`@reduxjs/toolkit`, `react-redux`) |
| HTTP                 | Axios                                             |
| Forms                | `react-hook-form`                                 |
| Charts               | `recharts`                                        |
| Icons                | `lucide-react`                                    |
| Notifications        | `react-toastify`                                  |
| Internationalization | `i18next`, `react-i18next`                        |
| Export               | `jspdf`, `jspdf-autotable`, `papaparse`           |

---

## Database Design

The system is modeled around the following core Prisma entities:

> **Migration:** Run `npx prisma migrate deploy` (production) or `npx prisma migrate dev` (development) to apply all migrations including the Asset Management tables.

### Core Business

- `User` — accounts with role, office assignment, active status, and preferred language
- `Office` — organizational office units (active/inactive)
- `TechnicianOffice` — many-to-many mapping between technicians and offices
- `Category` — issue categories (Hardware / Software / Networking) with expected resolution time
- `Ticket` — service requests with priority, status, device/system, SLA fields, and optional `assetId` foreign key linking to an `Asset`
- `MaintenanceNote` — diagnosis, work performed, parts replaced, recommendations per ticket
- `Announcement` — organization-wide notices published by Admins
- `Asset` — IT assets (computers, printers, phones, etc.) tracked by asset tag, with office assignment, optional employee assignment, and linked ticket history

### Logging

- `AuditLog` — immutable record of every ticket lifecycle event (actor, action, timestamp, before/after value)

### Asset Management Enums

| Enum          | Values                                                      | Description                          |
| ------------- | ----------------------------------------------------------- | ------------------------------------ |
| `AssetType`   | `COMPUTER`, `PRINTER`, `NETWORK_DEVICE`, `PHONE`, `FURNITURE`, `OTHER` | Category of IT asset                 |
| `AssetStatus` | `ACTIVE`, `MAINTENANCE`, `RETIRED`, `ARCHIVED`              | Lifecycle status of the asset        |

### Asset Model

```
Asset
├── id              UUID (PK)
├── assetTag        String (unique)     — e.g. "IT-001"
├── name            String              — human-readable name
├── assetType       AssetType (enum)
├── serialNumber    String?             — manufacturer serial number
├── status          AssetStatus (enum)  — default: ACTIVE
├── officeId        UUID (FK → Office)
├── employeeId      UUID? (FK → User)   — assigned employee (nullable)
├── purchaseDate    DateTime?
├── warrantyExpiry  DateTime?
├── notes           String?
├── createdAt       DateTime
├── updatedAt       DateTime
│
├── → office        Office (required)
├── → employee      User? (optional, SET NULL on delete)
└── → tickets       Ticket[] (linked via Ticket.assetId)
```

**Relations:**
- Each `Asset` belongs to one `Office` (required).
- Each `Asset` may be assigned to one `Employee` (optional).
- Each `Asset` may have many linked `Tickets` (via `Ticket.assetId`).
- Deleting an `Office` that has assets is blocked (`onDelete: Restrict`).
- Deleting an `Employee` assigned to assets sets their `employeeId` to NULL (`onDelete: SetNull`).

**Indexes:** `officeId`, `employeeId`, `status`, `assetTag`

---

## API Overview

### Authentication

| Method | Endpoint                | Description                        |
| ------ | ----------------------- | ---------------------------------- |
| POST   | `/auth/register`        | Register a new user                |
| POST   | `/auth/login`           | Login with phone number + password |
| PUT    | `/auth/change-password` | Change password                    |

### Users & Offices

| Method   | Endpoint                         | Description                    |
| -------- | -------------------------------- | ------------------------------ |
| GET      | `/users`                         | List users                     |
| PUT      | `/users/:id/status`              | Activate/deactivate a user     |
| POST     | `/users/technicians/:id/offices` | Assign offices to a technician |
| GET/POST | `/offices`                       | List / create offices          |
| PUT      | `/offices/:id`                   | Update an office               |

### Tickets

| Method | Endpoint                | Description                                         |
| ------ | ----------------------- | --------------------------------------------------- |
| POST   | `/tickets`              | Create a service request (triggers auto-assignment) |
| PUT    | `/tickets/:id/status`   | Update ticket status                                |
| PUT    | `/tickets/:id/reassign` | Manually reassign a ticket (Admin)                  |
| PUT    | `/tickets/:id/resolve`  | Resolve a ticket and log maintenance notes          |
| GET    | `/tickets/search`       | Multi-field paginated ticket search                 |

### Reports & Announcements

| Method   | Endpoint                                     | Description                    |
| -------- | -------------------------------------------- | ------------------------------ |
| GET      | `/reports/summary?period=1m\|3m\|6m\|9m\|1y` | Periodic analytics summary     |
| GET/POST | `/announcements`                             | List / publish announcements   |
| DELETE   | `/announcements/:id`                         | Remove an announcement (Admin) |

### Assets

| Method | Endpoint                  | Description                                  | Roles                       |
| ------ | ------------------------- | -------------------------------------------- | --------------------------- |
| GET    | `/assets`                 | List all assets (paginated, filterable)      | ADMIN                       |
| GET    | `/assets/my`              | List assets assigned to the current employee | EMPLOYEE, TECHNICIAN, ADMIN |
| GET    | `/assets/technician`      | List assets in technician's assigned offices | TECHNICIAN                  |
| GET    | `/assets/:id`             | Get asset detail with ticket history         | ADMIN, EMPLOYEE, TECHNICIAN |
| POST   | `/assets`                 | Create a new asset                           | ADMIN                       |
| PUT    | `/assets/:id`             | Update an asset                              | ADMIN                       |
| PATCH  | `/assets/:id/archive`     | Archive an asset (soft-delete)               | ADMIN                       |

**Query parameters for `GET /assets`:**

| Parameter  | Type   | Description                                    |
| ---------- | ------ | ---------------------------------------------- |
| `page`     | number | Page number (default: 1)                       |
| `pageSize` | number | Items per page (default: 20)                   |
| `search`   | string | Search by assetTag, name, or serialNumber      |
| `status`   | string | Filter by status (ACTIVE, MAINTENANCE, RETIRED, ARCHIVED) |
| `officeId` | string | Filter by office UUID                          |
| `employeeId` | string | Filter by assigned employee UUID             |
| `assetType` | string | Filter by type (COMPUTER, PRINTER, etc.)      |

**Response envelope:**

All asset endpoints follow the standard CivicDesk response envelope:
```json
{
  "success": true,
  "message": "Assets retrieved successfully.",
  "data": [ ... ],
  "meta": { "total": 42, "page": 1, "pageSize": 20, "pageCount": 3 }
}
```

**Ticket-Asset Linking:**

When creating or viewing a ticket, an optional `assetId` field links the ticket to an asset. This allows tracking all service requests against a specific piece of equipment. The `GET /assets/:id` endpoint includes a `tickets` array with linked service request history.

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm**
- **PostgreSQL** 14+ (local or hosted)

### Clone & Install

```bash
git clone https://github.com/Sumeya6/CivicDesk.git
cd CivicDesk

# Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev

# Frontend
cd ../frontend
cp .env.example .env.local
npm install
```

> **Note:** `npm install` only installs the packages declared in each folder's `package.json`/`package-lock.json`. Environment variables and the database schema (`npx prisma migrate dev`) must still be set up separately by each developer after cloning.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable                   | Required | Default                 | Description                                  |
| -------------------------- | -------- | ----------------------- | -------------------------------------------- |
| `DATABASE_URL`             | Yes      | —                       | PostgreSQL connection string                 |
| `JWT_ACCESS_TOKEN_SECRET`  | Yes      | —                       | JWT access token signing secret              |
| `JWT_REFRESH_TOKEN_SECRET` | Yes      | —                       | JWT refresh token signing secret             |
| `JWT_PASSWORD_RESET_SECRET`| Yes      | —                       | JWT password reset token signing secret      |
| `NODE_ENV`                 | No       | `development`           | Environment mode                             |
| `PORT`                     | No       | `5000`                  | Server port                                  |
| `CORS_ORIGINS`             | No       | `http://localhost:5173` | Comma-separated allowed origins              |
| `TWILIO_ACCOUNT_SID`       | No       | —                       | Twilio Account SID (for SMS notifications)   |
| `TWILIO_AUTH_TOKEN`        | No       | —                       | Twilio Auth Token (for SMS notifications)    |
| `TWILIO_FROM`              | No       | —                       | Twilio verified sender phone number (E.164)  |

> **Note:** SMS notifications use Twilio in production. In local development (`NODE_ENV !== "production"`), a mock provider logs the message instead of sending real SMS — no credentials required.

### Frontend (`frontend/.env.local`)

| Variable       | Required | Default                     | Description          |
| -------------- | -------- | --------------------------- | -------------------- |
| `VITE_API_URL` | Yes      | `http://localhost:5000/api` | Backend API base URL |

---

## Running Locally

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

---

## Scripts

### Backend

| Script                   | Command                 | Description                             |
| ------------------------ | ----------------------- | --------------------------------------- |
| `npm run dev`            | `nodemon src/server.js` | Development with auto-restart           |
| `npm start`              | `node src/server.js`    | Production start                        |
| `npm test`               | `jest --runInBand`      | Run all tests (unit + integration)      |
| `npm run test:unit`      | `jest --config jest.config.js` | Unit tests only (no DB needed)    |
| `npm run test:integration` | `jest --config jest.config.integration.js` | Integration tests (requires DB) |
| `npx prisma migrate dev` | —                       | Apply database migrations               |
| `npx prisma studio`      | —                       | Browse the database visually            |

### Frontend

| Script            | Command        | Description              |
| ----------------- | -------------- | ------------------------ |
| `npm run dev`     | `vite`         | Development server       |
| `npm run build`   | `vite build`   | Production build         |
| `npm run lint`    | `eslint .`     | Lint source files        |
| `npm run test`    | `vitest run`   | Run component tests      |
| `npm run preview` | `vite preview` | Preview production build |

---

## Project Structure

```
isrms/
├── backend/                          # Express API
│   ├── src/
│   │   ├── controllers/              # auth, user, office, ticket, maintenance, report, search, announcement, asset
│   │   ├── middleware/               # auth.middleware (JWT + RBAC)
│   │   ├── services/                 # assignment.service, asset.service
│   │   ├── routes/                   # auth, user, office, ticket, report, announcement, asset routes
│   │   ├── prisma/                   # schema.prisma, migrations
│   │   └── server.js                 # Entry point
│   ├── tests/                        # Jest unit + integration tests (including asset.test.js)
│   └── .env.example
│
├── frontend/                         # React.js SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/                 # Login, Register
│   │   │   ├── admin/                # OfficeManagement, UserManagement, PeriodicReports, AssetManagement
│   │   │   ├── employee/             # CreateTicketModal, AssetDetail
│   │   │   └── technician/           # TechnicianQueue, TicketResolveModal
│   │   ├── components/               # TechnicianAssignmentModal, AnnouncementBoard, AuditTrailModal, AdvancedFilterBar, AssetModal
│   │   ├── context/                  # AuthContext, LanguageContext
│   │   ├── store/                    # Redux slices (auth, user, office, ticket, announcement, asset)
│   │   ├── api/                      # axios, ticketApi, assetApi
│   │   ├── locales/                  # en.json, am.json
│   │   ├── layouts/                  # AppLayout, Sidebar
│   │   └── __tests__/                # Vitest component tests (including AssetManagement.test.jsx)
│   └── .env.example
│
└── .gitignore
```

---

## Internationalization

CivicDesk ships with full Amharic and English support:

- All menus, dashboards, tables, forms, notifications, and status badges are translated via `react-i18next`
- Users select or switch language at any time from the navbar toggle
- The selected language is saved to the user's profile (`preferredLanguage`) and restored on next login

---

## Deployment

The project follows a standard two-service deployment:

1. **Backend** — deploy the `backend/` folder to a Node-compatible host (e.g. Railway, Render) with `DATABASE_URL`, `JWT_SECRET`, and `CORS_ORIGINS` configured, then run `npx prisma migrate deploy`.
2. **Frontend** — deploy the `frontend/` folder to a static/SPA host (e.g. Vercel, Netlify) with `VITE_API_URL` pointing at the deployed backend.
3. Update `CORS_ORIGINS` on the backend once the frontend's production URL is known, then redeploy the backend.

Per the proposal, the system is intended to be developed and tested in a local environment first, then deployed to the organization's internal server (or an approved equivalent) after client approval.

---

## Testing

The project has unit and integration test suites across both backend and frontend.

### Backend

Tests are split into two groups using separate Jest configs:

| Suite            | Command                        | Files                                                              | Database required |
| ---------------- | ------------------------------ | ------------------------------------------------------------------ | ----------------- |
| **Unit tests**   | `npm run test:unit`            | `report`, `search`, `announcement`, `session`, `ticket`, `assignment`, `asset` | No (all mocked)   |
| **Integration**  | `npm run test:integration`     | `auth`, `user`, `office`                                           | Yes (PostgreSQL)  |
| **All (default)**| `npm test`                     | Both of the above                                                  | Yes               |

- Unit tests mock Prisma, auth middleware, and external dependencies — no live database needed.
- Integration tests connect to a real PostgreSQL instance via `DATABASE_URL` in `backend/.env`.

### Frontend

| Command          | Framework | Description                             |
| ---------------- | --------- | --------------------------------------- |
| `npm run lint`   | ESLint    | Static analysis for JSX/JS             |
| `npm run test`   | Vitest    | Component and logic tests (13 files)   |
| `npm run build`  | Vite      | Production build (verifies no compile errors) |

Frontend tests use mocked Axios calls and do not require a running backend.

### Running Tests

```bash
# Backend unit tests (no database)
cd backend
npm run test:unit

# Backend integration tests (requires PostgreSQL)
cd backend
npm run test:integration

# All backend tests
cd backend
npm test

# Frontend lint + tests + build
cd frontend
npm run lint
npm run test
npm run build
```

### Test Architecture

- **Backend unit tests** use `jest.mock()` to replace Prisma, JWT utilities, and middleware — fast, isolated, no external dependencies.
- **Backend integration tests** boot the real Express app and hit a live database — verify full request pipeline including auth, validation, and ORM queries.
- **Frontend tests** use Vitest with `@testing-library/react` and mock `axios` — verify component rendering, user interactions, and API call patterns.

---

## Roadmap

### Phase 1 — Foundation

- [ ] User, Office & Auth engine (Issue 1)
- [ ] Application shell, routing & auth UI (Issue 0)

### Phase 2 — Core Workflow

- [ ] Ticketing, auto-assignment & SLA engine (Issue 2)
- [ ] User administration, office setup & announcement UI (Issue 4)
- [ ] Ticket submission, technician queue & audit trail UI (Issue 5)

### Phase 3 — Insights & Localization

- [ ] Periodic analytics, search & announcements engine (Issue 3)
- [ ] Periodic analytics dashboard, multi-field search & Amharic i18n (Issue 6)

### Phase 4 — Future Enhancements

- [x] Asset Management Module
- [ ] QR Code-Based Device Reporting
- [ ] Email / SMS Notifications
- [ ] Preventive Maintenance Scheduling
- [ ] Interactive Analytics Dashboard
- [ ] Knowledge Base for Common IT Issues
- [ ] Mobile-friendly interface

---

## License

This project is developed as part of a Software Engineering internship. License terms to be determined by the project owner/organization.

---

_Proposed and developed by the Software Engineering Internship Team._
