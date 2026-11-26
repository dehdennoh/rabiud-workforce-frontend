# Rabiud Workforce Frontend

A responsive workforce operations dashboard built with React + TypeScript + Vite.

## Features

- Dashboard summary cards
- Companies management page
- Workers list page
- Assignments overview
- Attendance tracking
- Payroll summary
- Compliance document tracking
- Reports page
- Mobile and desktop responsive layout

## Run locally

1. Install dependencies:
   npm install
2. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Apply `supabase/migrations/20261126_completion.sql` in Supabase SQL Editor.
4. Start the app:
   npm run dev
5. Open the local Vite URL in the browser.

## API integration

The app uses realistic mock data by default. To switch to the backend, copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` to the API root, for example `http://localhost:3000/api`, then restart Vite.

The frontend currently loads these JSON collection endpoints:

- `GET /companies`
- `GET /workers`
- `GET /assignments`
- `GET /attendance`
- `GET /payroll`
- `GET /advances`
- `GET /documents`

Company and worker create/update actions use these REST endpoints when `VITE_API_BASE_URL` is configured:

- `POST /companies`
- `PUT /companies/:id`
- `POST /workers`
- `PUT /workers/:id`

Create endpoints should return the created record. Update endpoints should return the updated record. A response may be the record directly or wrapped as `{ "data": record }`. A `204 No Content` response is also accepted for updates.

Each endpoint should return an array directly or an object shaped like `{ "data": [] }`. Response fields should match the interfaces in `src/types.ts`. The request client is in `src/services/apiClient.ts`; endpoint loading and mock fallback are in `src/services/workforceService.ts`.

This first integration phase is read-only. Create/update actions and authentication will need matching backend contracts before they are connected.

## Roles and permissions

The frontend includes demo roles (Admin, Operations Manager, HR Officer, Payroll Officer, Supervisor, and Viewer), permission-filtered navigation, protected page routes, and a local Users & Access preview. Role assignments and the selected demo identity reset when the app reloads. This is UI behavior only: the backend must authenticate users and enforce authorization on every API request; frontend checks are not a security boundary.

## Roles and permissions

The frontend includes demo roles (Admin, Operations Manager, HR Officer, Payroll Officer, Supervisor, and Viewer), permission-filtered navigation, protected page routes, and a local Users & Access preview. Role assignments and the selected demo identity reset when the app reloads. This is UI behavior only: the backend must authenticate users and enforce authorization on every API request; frontend checks are not a security boundary.
