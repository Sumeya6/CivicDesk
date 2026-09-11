# Postman Testing Guide — CivicDesk Backend

This guide explains how to test the backend API routes implemented so far using Postman (or similar HTTP clients). It covers environment setup, common requests, and helpful Postman test scripts to extract cookies and reset tokens.

## Prerequisites

- Node.js installed
- Run the backend locally from `backend/`:

```bash
cd backend
npm install
npm run dev
```

- Ensure your `.env` contains DB and optional notifier settings (see README). For local testing the test user data created by the seed script may be used.

## Postman Environment Variables (recommended)

- `BASE_URL` — e.g. `http://localhost:3000`
- `TEST_PHONE` — phone number of a seeded/test user (used in examples)
- `TEST_PASSWORD` — password for that user
- `ACCESS_COOKIE` — stored login cookie (managed by Postman scripts)
- `RESET_TOKEN` — password-reset token (test-only; server returns token in test env)

## Useful Notes

- Authentication uses a cookie named `accessToken`. After `POST /api/auth/login` the server sets `Set-Cookie`. Use the Postman Tests script below to extract it into `ACCESS_COOKIE`.
- `POST /api/auth/forgot-password` in test environment returns `resetToken` in the JSON response for convenience. In production this token is sent via email/SMS.

## Common Requests

Base URL prefix: `{{BASE_URL}}/api`

### Register

- POST `/auth/register`
- Body (JSON):
  - `fullName`, `phoneNumber`, `password`, (optional) `preferredLanguage`, `officeId`, `role`
- Success: `201` with created `user` payload

### Login

- POST `/auth/login`
- Body (JSON): `{ "phoneNumber": "{{TEST_PHONE}}", "password": "{{TEST_PASSWORD}}" }`
- Success: `200` and `Set-Cookie: accessToken=...`

Postman Tests script (to save cookie to environment):

```javascript
// Save Set-Cookie header value to environment
const setCookie = pm.response.headers.get("set-cookie");
if (setCookie) {
  pm.environment.set("ACCESS_COOKIE", setCookie);
}
pm.test("login successful", () => pm.response.to.have.status(200));
```

To reuse the cookie in subsequent requests, set a header in Postman:
Header: `Cookie` Value: `{{ACCESS_COOKIE}}`

### Get current user

- GET `/auth/me` (requires cookie)
- Add header `Cookie: {{ACCESS_COOKIE}}`

### Change password

- PUT `/auth/change-password` (requires cookie)
- Body: `{ "currentPassword": "old", "newPassword": "NewPass123" }`

### Forgot password (test flow)

- POST `/auth/forgot-password`
- Body: `{ "phoneNumber": "{{TEST_PHONE}}" }`
- In test environment response contains:
  - `resetToken` (useful for tests)

Postman Tests script (extract resetToken):

```javascript
const body = pm.response.json();
if (body.resetToken) pm.environment.set("RESET_TOKEN", body.resetToken);
pm.test("forgot password returned", () => pm.response.to.have.status(200));
```

### Reset password

- POST `/auth/reset-password`
- Body: `{ "token": "{{RESET_TOKEN}}", "newPassword": "NewPass123!" }`
- Success: `200` and message `Password has been reset successfully.`

### Logout

- POST `/auth/logout`
- Clears `accessToken` cookie

## User endpoints (require roles)

- GET `/users` — list users (requires `ADMIN` role)
- GET `/users/:id` — get a user by id
- PUT `/users/:id` — update user
- PUT `/users/:id/status` — change `isActive` boolean
- PUT `/users/:id/role` — change `role`
- PUT `/users/:id/preferred-language` — change `preferredLanguage`
- PUT `/users/:id/offices` — assign technician offices (body: `{ "officeIds": ["uuid"] }`)

Remember to include `Cookie: {{ACCESS_COOKIE}}` for protected endpoints.

## Office endpoints

- GET `/offices` — list offices
- GET `/offices/:id` — get office details
- POST `/offices` — create (requires `ADMIN`)
- PUT `/offices/:id` — update (requires `ADMIN`)
- PUT `/offices/:id/status` — change `isActive` (requires `ADMIN`)

## Example Postman collection snippets

- For each POST/PUT request that requires authentication, add header `Cookie` with value `{{ACCESS_COOKIE}}`.
- Use the Login request test to capture `ACCESS_COOKIE` and the Forgot Password request test to capture `RESET_TOKEN`.

## Recommended workflow to test flows

1. Register a fresh test user (or use seeded user).
2. Login and capture cookie.
3. Call protected endpoints using the cookie.
4. Test forgot/reset: call `/auth/forgot-password`, capture `RESET_TOKEN`, call `/auth/reset-password` with `RESET_TOKEN`, then `POST /auth/login` with new password.

## Troubleshooting

- If Postman doesn't show `Set-Cookie` header, enable `Send cookies` and check the `Cookies` tab. Use the Tests script shown above to capture the `set-cookie` header directly.
- If `forgot-password` returns no `resetToken`, ensure `NODE_ENV=test` when running the server locally if you want the token in the response; otherwise the token will be sent via notifier configured by env vars.

---

If you want, I can also create a full Postman Collection JSON that imports these requests and includes Test scripts. Want me to generate that collection next?

