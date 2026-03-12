# Auth & CRUD API

A backend API built with Node.js, Express, and MongoDB. Includes JWT authentication, task management (CRUD), and file upload functionality.

## Features
- **Authentication**: Register and login with secure password hashing (Bcrypt) and JWT tokens.
- **CRUD Operations**: Create, Read, Update, and Delete tasks.
- **File Management**: Upload documents and download them.

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (Local or Atlas)

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd task2
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Start the server:**
   ```bash
   node server.js
   ```

## API Endpoints Summary

- **Auth:** `POST /api/auth/register` | `POST /api/auth/login`
- **Tasks:** `GET /api/tasks` | `POST /api/tasks` | `PUT /api/tasks/:id` | `DELETE /api/tasks/:id`
- **Files:** `POST /api/files/upload` | `GET /api/files/download/:filename`

*(Note: Task and File Upload routes require a valid `Bearer Token` in the Authorization header.)*
