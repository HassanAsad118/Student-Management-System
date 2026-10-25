# Student Management System

A full-stack student management application built for Devixo Solutions Web Development Internship, Task 03. It supports account authentication, persistent student records, and an Admin/User dashboard.

## Technologies

React, Vite, CSS, Node.js, Express, MongoDB Atlas, express-session, connect-mongo, and bcryptjs.

## Features

- Register, login, and logout with hashed passwords and MongoDB-backed sessions.
- Admin access to add, edit, and delete students; Users have read-only access.
- Student details: unique Student ID, name, email, course, semester/year, and status.
- Search by Student ID, name, email, course, semester/year, or status.
- Statistics for total students, registrations in the last seven days, and distinct courses.
- The five most recent registrations and client-side pagination.
- Responsive layout, loading indicators, form validation, and saved light/dark preference.

Student IDs are stored in uppercase. Semester choices are 1–8; year choices are 1–4. Status choices are Graduated, Semester Freeze, Active, and On Leave. For this project's four-year model, Graduated is permitted only at Semester 8 or Year 4; selecting the final level does not automatically mark a student as graduated.

## Project structure

- `client/` — React interface, styles, and public icons.
- `server/` — Express API, authentication, and student validation.
- `server/.env.example` — configuration template without credentials.

## Run locally

Use Node.js 24 LTS and a MongoDB database.

1. In MongoDB Atlas, create a database user and allow your development machine's IP address.
2. Open a terminal in `server` and install its dependencies:

   ```powershell
   npm.cmd install
   Copy-Item .env.example .env
   ```

3. Edit `server/.env` with your MongoDB connection string. URL-encode special characters in the database password. Generate a session secret:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   Put the generated value after `SESSION_SECRET=` in `.env`.

4. From `server`, start Express:

   ```powershell
   npm.cmd run dev
   ```

5. Open another terminal in `client`:

   ```powershell
   npm.cmd install
   npm.cmd run dev
   ```

6. Open the Local URL printed by Vite, normally `http://localhost:5173`. Vite forwards `/api` requests to Express on port 5000. Keep both terminals running.

## Admin setup

Registration creates a User account. To set up your own Admin account:

1. Register in the application.
2. In Atlas Data Explorer, open `student_management` → `users`.
3. Find your account by email and change its `role` from `user` to `admin`.
4. Refresh the application.

This application role is separate from the Atlas database user's permissions. Existing student records without the newer fields can be updated through Edit Student.

## Checks

From `client`:

```powershell
npm.cmd run lint
npm.cmd run build
```

From `server`:

```powershell
node --check index.js
node --check auth.js
node --check studentValidation.js
```

The frontend build is written to `client/dist`. This repository is configured for local development; hosted deployment requires appropriate API routing and HTTPS session-cookie settings.

## Configuration

Real `.env` files, `node_modules`, and build output are excluded from Git. Each developer supplies their own MongoDB credentials and session secret. No database records or login credentials are bundled with the source.
