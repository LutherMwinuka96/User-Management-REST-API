# User Management REST API

A small, beginner-friendly REST API built with Node.js and Express. It supports creating, listing, reading, updating, and deleting users. SQLite saves data in a local database file, so records remain after the server restarts.

## Features

- CRUD endpoints for users (`id`, `name`, `email`, `age`)
- JSON request and response bodies with consistent success/error formats
- Required-field, email-format, unique-email, and age validation
- SQLite persistence with a unique email constraint
- Automated API tests using Node's built-in test runner
- Central handling for malformed JSON, unknown routes, and server errors
- Modular routes, controllers, middleware, and data storage
- Importable Postman collection with success and validation requests

## Technologies and requirements

- Node.js 22.5+ and npm (uses Node's built-in SQLite module)
- Express 4
- Postman (optional, for the included API walkthrough)

## Install and run

```bash
npm install
Copy-Item .env.example .env   # PowerShell; optional if using the default port
npm run dev
```

On macOS/Linux, copy the example with `cp .env.example .env`. Set `PORT` in `.env` to choose another port. `DB_PATH` can point to a different SQLite file; by default it is `src/data/users.sqlite`. The server defaults to port 3000 and prints its local URL on startup. For a regular run without auto-reload, use `npm start`.

## API endpoints

All endpoints use `http://localhost:3000` by default. Send JSON with `Content-Type: application/json` for POST and PUT.

| Method | Path | Description | Success |
| --- | --- | --- | --- |
| GET | `/` | Health check | 200 |
| GET | `/api/users` | List users (`count` and `data`) | 200 |
| GET | `/api/users/:id` | Get one user | 200 |
| POST | `/api/users` | Create a user | 201 |
| PUT | `/api/users/:id` | Replace a user's fields | 200 |
| DELETE | `/api/users/:id` | Delete a user | 200 |

### Create user

```http
POST /api/users
Content-Type: application/json
```

```json
{ "name": "Alice Johnson", "email": "alice@example.com", "age": 24 }
```

```json
{
  "success": true,
  "message": "User created successfully",
  "data": { "id": 1, "name": "Alice Johnson", "email": "alice@example.com", "age": 24 }
}
```

### List and retrieve users

`GET /api/users` returns `{ "success": true, "count": 1, "data": [...] }`. `GET /api/users/1` returns `{ "success": true, "data": { ... } }`.

### Update user

PUT replaces the complete user record; all three fields are required.

```json
{ "name": "Alice Updated", "email": "alice.updated@example.com", "age": 26 }
```

### Delete user

`DELETE /api/users/1` returns a success message and the deleted user in `data`.

## Validation and errors

- Name must be a non-empty string.
- Email must have a basic valid email format and be unique (case-insensitive).
- Age must be a positive number no greater than 150.
- IDs must be positive integers. A malformed ID returns 400; a valid ID with no matching user returns 404.
- Invalid input and malformed JSON return 400. Duplicate email returns 409. Unknown routes return 404.
- Unexpected server errors return a generic 500 response so internal details are not sent to clients.

Errors use `{ "success": false, "message": "..." }`.

## Test with Postman

1. Start the app with `npm run dev`.
2. In Postman, choose **Import** and select `postman/User Management REST API.postman_collection.json`.
3. Run **Health Check**, then **Create User**. The collection saves the created user's ID for the read, update, and delete requests.
4. Run **Get All Users**, **Get User**, **Update User**, and **Delete User**. These requests use `{{baseUrl}}` and `{{userId}}` collection variables.
5. The **Validation examples** folder includes missing name, invalid email, invalid age, duplicate email, missing user, and invalid ID requests. Run **Create Duplicate Email Fixture** first; then run **Duplicate email**. The missing-user request uses a high ID that should not exist.

Postman uses a JSON body for create/update. SQLite records remain after the server restarts.

Run automated API checks with `npm test`. They use a temporary database and leave the app's saved records untouched.

## Project structure

```text
src/
  controllers/userController.js  # CRUD operations and input checks
  data/database.js               # SQLite connection and user data functions
  middleware/errorHandler.js     # Unknown route and centralized errors
  routes/userRoutes.js           # Maps HTTP paths to controller functions
  server.js                      # Express configuration and startup
postman/
  User Management REST API.postman_collection.json
.env.example
.gitignore
package.json
```

## Request flow

Postman sends an HTTP request to Express. Express parses JSON, matches a route, and calls its controller. The controller validates the input and uses database functions to read or change SQLite. It then sends a JSON response with the appropriate status code. Errors pass to the central error middleware.

## Beginner terms

- **Node.js** runs JavaScript outside a web browser, including on a server.
- **Express.js** is a Node.js library that makes it easier to build web servers and APIs.
- A **REST API** exposes resources through URLs and standard HTTP methods.
- **CRUD** means Create, Read, Update, and Delete.
- **HTTP methods** describe the action: GET reads, POST creates, PUT replaces/updates, and DELETE removes.
- **JSON** is a text format for structured data, commonly used between clients and APIs.
- **Middleware** is a function that runs during a request/response cycle. Here it parses JSON and formats errors.
- A **route** connects an HTTP method and URL to code that handles the request.
- A **controller** contains the action logic for a route, such as validating and creating a user.
- **Postman** lets you send requests to an API and inspect status codes and response bodies without building a separate front end.

In short: **Postman → Express middleware → route → controller → SQLite database → JSON response**.

## Future improvements

Add pagination, authentication, stricter schema validation, and a MySQL or PostgreSQL repository if the project outgrows SQLite.

## Upload to GitHub

Create an empty GitHub repository, then run these commands from the project directory. Replace the placeholder URL with your repository URL.

```bash
git init
git add .
git commit -m "Build User Management REST API"
git branch -M main
git remote add origin <GITHUB_REPOSITORY_URL>
git push -u origin main
```

`node_modules/` and `.env` are ignored by Git. Commit `.env.example` so collaborators know which configuration value to set.
