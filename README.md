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

### Internationalization

- Full Amharic (አማርኛ) and English UI coverage
- Instant language switching via navbar toggle
- Language preference persisted per user

---

## User Roles

| Role              | Identifier   | Capabilities                                                                                                                                                           |
| ----------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Employee**      | `EMPLOYEE`   | Register/login, submit service requests, track request status, view maintenance history                                                                                |
| **Technician**    | `TECHNICIAN` | Receive assigned requests (one or more offices), update progress, log maintenance notes, view work history and personal performance                                    |
| **Administrator** | `ADMIN`      | Manage users, technicians, and offices; configure categories and SLAs; monitor technician performance; generate reports; publish announcements; manage system settings |

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

### Core Business

- `User` — accounts with role, office assignment, active status, and preferred language
- `Office` — organizational office units (active/inactive)
- `TechnicianOffice` — many-to-many mapping between technicians and offices
- `Category` — issue categories (Hardware / Software / Networking) with expected resolution time
- `Ticket` — service requests with priority, status, device/system, and SLA fields
- `MaintenanceNote` — diagnosis, work performed, parts replaced, recommendations per ticket
- `Announcement` — organization-wide notices published by Admins

### Logging

- `AuditLog` — immutable record of every ticket lifecycle event (actor, action, timestamp, before/after value)

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

| Variable       | Required | Default                 | Description                     |
| -------------- | -------- | ----------------------- | ------------------------------- |
| `DATABASE_URL` | Yes      | —                       | PostgreSQL connection string    |
| `JWT_SECRET`   | Yes      | —                       | JWT signing secret              |
| `NODE_ENV`     | No       | `development`           | Environment mode                |
| `PORT`         | No       | `5000`                  | Server port                     |
| `CORS_ORIGINS` | No       | `http://localhost:5173` | Comma-separated allowed origins |

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

| Script                   | Command                 | Description                   |
| ------------------------ | ----------------------- | ----------------------------- |
| `npm run dev`            | `nodemon src/server.js` | Development with auto-restart |
| `npm start`              | `node src/server.js`    | Production start              |
| `npx prisma migrate dev` | —                       | Apply database migrations     |
| `npx prisma studio`      | —                       | Browse the database visually  |

### Frontend

| Script            | Command        | Description              |
| ----------------- | -------------- | ------------------------ |
| `npm run dev`     | `vite`         | Development server       |
| `npm run build`   | `vite build`   | Production build         |
| `npm run preview` | `vite preview` | Preview production build |

---

## Project Structure

```
isrms/
├── backend/                          # Express API
│   ├── src/
│   │   ├── controllers/              # auth, user, office, ticket, maintenance, report, search, announcement
│   │   ├── middleware/               # auth.middleware (JWT + RBAC)
│   │   ├── services/                 # assignment.service (auto-workload logic)
│   │   ├── routes/                   # auth, user, office, ticket, report, announcement routes
│   │   ├── prisma/                   # schema.prisma, migrations
│   │   └── server.js                 # Entry point
│   └── .env.example
│
├── frontend/                         # React.js SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/                 # Login, Register
│   │   │   ├── admin/                # OfficeManagement, UserManagement, PeriodicReports
│   │   │   ├── employee/             # CreateTicketModal
│   │   │   └── technician/           # TechnicianQueue, TicketResolveModal
│   │   ├── components/               # TechnicianAssignmentModal, AnnouncementBoard, AuditTrailModal, AdvancedFilterBar
│   │   ├── context/                  # AuthContext, LanguageContext
│   │   ├── store/                    # Redux slices (auth, user, office, ticket, announcement)
│   │   ├── locales/                  # en.json, am.json
│   │   └── layouts/                  # AppLayout
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

**Status: Test suite not yet implemented.**

Planned work:

- Backend: unit tests for the assignment/SLA services and integration tests for controllers
- Frontend: component tests for modals and dashboards
- E2E: coverage of the full ticket lifecycle (submit → assign → resolve → close)

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

- [ ] Asset Management Module
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
