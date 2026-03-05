A simple API that provides arithmetic operations with JWT-based authentication.

The implementation of authentication and authorization in a Node.js API, where users must register/login to receive a token, which is then used to access protected arithmetic endpoints.
## Technologies Used

- Node.js + Express.js
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcryptjs for password hashing

## Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB installed and running
- Postman (for testing)

### Installation


1.Clone and install dependencies
```bash
git clone <your-repo-url>
cd task1-arithmetic-api
npm install

2.Configure environment variables
   Create .env file:

MONGODB_URI=mongodb://localhost:27017/arithmetic-api
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h
PORT=3000

3.Start the server

'''bash
node server.js

## How to Test with Postman

1. Register a User

POST http://localhost:3000/api/register
Body (JSON):
{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
}

postman test result [View Registration Screenshot →](register.png)


2. Login
POST http://localhost:3000/api/login
Body (JSON):
{
    "email": "test@example.com",
    "password": "password123"
}