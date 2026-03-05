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

1. Clone the Repository
git clone <your-repo-url>
cd task1-arithmetic-api
npm install

2.Configure environment variables
   Create a .env file in the root directory.

like below:
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

[View Screenshot →](login.png)

3.Addition
POST http://localhost:3000/api/add
Headers:
Authorization: Bearer <your-token-from-login>
Body (JSON):
{
    "num1": 10,
    "num2": 5
}

[View Screenshot →](add.png)

4.Subtraction
POST http://localhost:3000/api/subtract
Headers:
Authorization: Bearer <your-token-from-login>
Body (JSON):
{
    "num1": 20,
    "num2": 8
}
[View Screenshot →](subtract.png)

5.Multiplication
POST http://localhost:3000/api/multiply
Headers:
Authorization: Bearer <your-token-from-login>
Body (JSON):
{
    "num1": 6,
    "num2": 7
}
[View Screenshot →](multiply.png)

6.Division
POST http://localhost:3000/api/divide
Headers:
Authorization: Bearer <your-token-from-login>
Body (JSON):
{
    "num1": 15,
    "num2": 3
}
[View Screenshot →](subtract.png)