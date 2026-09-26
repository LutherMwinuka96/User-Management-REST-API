# User Management REST API

A JSON REST API for managing users with persistent MySQL storage. The existing Express routes and Postman collection are retained; controllers now use parameterized SQL through a reusable `mysql2` connection pool.

## Features

- Create, list, retrieve, update, and delete users
- MySQL persistence across server restarts
- Required field, email format, age, and duplicate email validation
- Consistent JSON responses and HTTP status codes
- Central handling for unknown routes and malformed JSON
- Postman collection at `postman/User Management REST API.postman_collection.json`

## Technologies

Node.js, Express.js, MySQL, `mysql2`, `dotenv`, and Postman.

## Project structure

```text
src/config/db.js             MySQL connection pool used by the API
src/controllers/userController.js  Validation and SQL CRUD operations
src/routes/userRoutes.js     User endpoint mappings
src/middleware/errorHandler.js  JSON error responses
src/server.js                Express setup and startup
database.sql                 Database and table definition
.env.example                 Environment variable template
postman/                     Importable Postman collection
```

## Database setup

1. Install and start MySQL Server (MySQL 8+ recommended).
2. From a MySQL client, run `source database.sql` (or open and execute `database.sql` in MySQL Workbench). This creates `user_management_db` and the `users` table.
3. Copy `.env.example` to `.env` and set the connection values for your MySQL account. `.env` is ignored by Git.

The `users` table has an auto-incrementing integer primary key, required name/email/age fields, a unique email constraint, a positive age constraint, and a creation timestamp.

## Installation and configuration

```bash
npm install
```

Required settings in `.env`:

```dotenv
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=user_management_db
DB_PORT=3306
```

Never commit `.env` or put database credentials in source code. `.env.example` contains safe placeholders.

## Run the API

```bash
npm start
# or, with automatic reload:
npm run dev
```

The server checks its MySQL connection before listening at `http://localhost:3000`. Ensure the database script has been run and MySQL is available.

## API documentation

Send `Content-Type: application/json` with POST and PUT requests. Successful user objects include `id`, `name`, `email`, `age`, and `created_at`.

| Method | URL | Purpose | Success / errors |
| --- | --- | --- | --- |
| GET | `/` | Health check | 200 |
| POST | `/api/users` | Create user | 201, 400 invalid input, 409 duplicate email |
| GET | `/api/users` | List all users | 200 with `count` and `data` |
| GET | `/api/users/:id` | Retrieve one user | 200, 400 invalid ID, 404 missing user |
| PUT | `/api/users/:id` | Replace name, email, and age | 200, 400 invalid input, 404 missing user, 409 duplicate email |
| DELETE | `/api/users/:id` | Delete one user | 200, 400 invalid ID, 404 missing user |

### Create user — `POST /api/users`

Request:

```json
{ "name": "John Doe", "email": "john@example.com", "age": 25 }
```

Response (201):

```json
{
  "success": true,
  "message": "User created successfully",
  "data": { "id": 1, "name": "John Doe", "email": "john@example.com", "age": 25, "created_at": "2026-09-26T00:00:00.000Z" }
}
```

### List users — `GET /api/users`

Response (200): `{ "success": true, "count": 1, "data": [{ "id": 1, "name": "John Doe", "email": "john@example.com", "age": 25, "created_at": "..." }] }`.

### Retrieve one — `GET /api/users/1`

Response (200): `{ "success": true, "data": { "id": 1, "name": "John Doe", "email": "john@example.com", "age": 25, "created_at": "..." } }`.

### Update — `PUT /api/users/1`

All fields are required; PUT replaces the user's editable fields.

```json
{ "name": "John Updated", "email": "johnupdated@example.com", "age": 26 }
```

Response (200): `{ "success": true, "message": "User updated successfully", "data": { "id": 1, "name": "John Updated", "email": "johnupdated@example.com", "age": 26, "created_at": "..." } }`.

### Delete — `DELETE /api/users/1`

Response (200): `{ "success": true, "message": "User deleted successfully", "data": { "id": 1, "name": "John Updated", "email": "johnupdated@example.com", "age": 26, "created_at": "..." } }`.

Errors use `{ "success": false, "message": "..." }`. Unexpected database errors are logged on the server and returned with a generic message.

## Postman testing

1. Start MySQL and the API.
2. Import `postman/User Management REST API.postman_collection.json` into Postman.
3. Run **Create User**; the collection saves its ID as `userId`.
4. Run **Get All Users**, **Get User**, **Update User**, and **Delete User**. The collection uses `baseUrl` (`http://localhost:3000`) and `userId` variables.
5. The **Validation examples** folder includes invalid input, duplicate email, missing user, and invalid ID examples. Run **Create Duplicate Email Fixture** before **Duplicate email**.

The collection's example create email may already exist on repeated runs; change it or delete the previous record before creating again.

## SQL concepts demonstrated

- `CREATE DATABASE` and `CREATE TABLE` define the database and schema.
- `PRIMARY KEY` and `AUTO_INCREMENT` provide unique generated IDs.
- `NOT NULL`, `UNIQUE`, and `CHECK` enforce data rules.
- API operations use `INSERT`, `SELECT`, `UPDATE`, and `DELETE`.
- `WHERE id = ?` filters records; `?` placeholders keep user data parameterized.

## GitHub

After reviewing the changes and configuring your remote:

```bash
git add .
git commit -m "Integrate MySQL database for user API"
git push
```

For a new remote repository, configure it with `git remote add origin <GITHUB_REPOSITORY_URL>` and push the current branch with `git push -u origin <branch-name>`.
