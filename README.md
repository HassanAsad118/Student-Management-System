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

## First-time setup

You need Node.js 24 LTS, a MongoDB Atlas account, and an internet connection.

### 1. Open the project

Download or clone this repository, then open its main folder in VS Code. You should see the `client` and `server` folders.

### 2. Connect your database

In MongoDB Atlas:

- Create a free cluster and a database user.
- Add your current IP address under Network Access.
- Choose **Connect → Drivers → Node.js** and copy the connection string.

Inside the project's `server` folder, copy `.env.example` and rename the copy to `.env`. If you already have a working `.env`, keep it and skip this step.

Fill in these three settings:

```env
MONGODB_URI="YOUR_MONGODB_CONNECTION_STRING"
PORT=5000
SESSION_SECRET=YOUR_RANDOM_SECRET
```

For the MongoDB connection string, use your database user's password and add `student_management` after the hostname's `/`, before any `?` options. Special characters in the password must be URL-encoded; for example, `%` becomes `%25`.

To generate a random session secret, run this in a terminal:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copy its output into `SESSION_SECRET`. Keep `.env` private.

### 3. Start the backend — Terminal 1

Open a terminal in the main project folder and run:

```powershell
cd server
npm.cmd install
npm.cmd run dev
```

Wait for **MongoDB connected successfully** and **Server running at http://localhost:5000**. Leave this terminal running.

### 4. Start the frontend — Terminal 2

Open a second terminal in the main project folder and run:

```powershell
cd client
npm.cmd install
npm.cmd run dev
```

Open the **Local** URL it prints, normally **http://localhost:5173/**. Keep both terminals running.

## Starting again later

Once setup is complete, you only need these commands. Start each terminal in the main project folder.

**Terminal 1 — Backend**

```powershell
cd server
npm.cmd run dev
```

**Terminal 2 — Frontend**

```powershell
cd client
npm.cmd run dev
```

Open the frontend's Local URL. You do not need to reinstall packages or recreate `.env` each time. To stop either server, press **Ctrl+C**.

## Make your account an Admin

1. Register through the app. New accounts start as Users.
2. In MongoDB Atlas, open **Data Explorer → student_management → users**.
3. Find your account by email. Edit its `role` from `user` to `admin` and save.
4. Refresh the app.

Users can view and search students. Admins can also add, edit, and delete them. This role belongs to the app and is separate from your Atlas database user's permissions.

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
