# Foundation and Authentication API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a modular Express API with PostgreSQL schema, fixed administrator/worker roles, secure login, token refresh, and protected profile endpoint.

**Architecture:** A JavaScript workspace rooted at `Sistema de Cobro` holds an API that alone accesses PostgreSQL. Web and mobile are explicitly outside this first delivery. The API uses route → controller → service → repository boundaries.

**Tech Stack:** Node.js 22 LTS, Express 5, PostgreSQL 16/Supabase, `pg`, `argon2`, `jose`, `zod`, `express-rate-limit`, Vitest, Supertest, ESLint, Prettier, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-09-01-sistema-de-cobro-design.md`

## Global Constraints

- ECMAScript modules only; Node 22 LTS.
- API-only database access; clients have no PostgreSQL/Supabase credentials.
- UUID primary keys, `timestamptz`, and `America/Bogota`.
- Passwords use Argon2id; never log passwords, hashes, JWTs, or connection strings.
- Exact roles are `administrator` and `worker`, enforced in middleware.
- Future financial writes must be transactional/auditable; this delivery creates the audit foundation.
- No UI, credit, payment, quota, calendar, receipt, report, or in-app user management.

## Planned structure

```text
Sistema de Cobro/
  package.json .env.example docker-compose.yml README.md
  apps/api/
    src/{app.js,server.js,config/env.js,db/,modules/,middleware/,shared/}
    scripts/create-user.js
    test/
```

---

### Task 1: Initialize source control, workspace, and HTTP application

**Files:**
- Create: `package.json`, `.gitignore`, `.editorconfig`, `.env.example`, `docker-compose.yml`, `eslint.config.js`, `prettier.config.js`, `README.md`.
- Create: `apps/api/package.json`, `apps/api/src/app.js`, `apps/api/src/server.js`, `apps/api/test/app.unit.test.js`.

**Interfaces:**
- Produces `createApp(dependencies)`, returning an Express app.
- Produces root `test`, `lint`, and `format:check` scripts.

- [ ] **Step 1: Initialize repository and workspace**

```powershell
git init
git branch -M main
npm init -y
npm pkg set private=true workspaces[0]=apps/* engines.node=">=22 <23"
```

- [ ] **Step 2: Install API dependencies**

Install runtime dependencies `express pg argon2 jose zod express-rate-limit helmet cors` and development dependencies `vitest supertest eslint prettier`. Configure root scripts to delegate to `apps/api`.

- [ ] **Step 3: Write the failing health test**

```js
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('GET /health', () => {
  it('returns service status', async () => {
    const response = await request(createApp({})).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
```

- [ ] **Step 4: Verify the test fails**

Run: `npm test --workspace apps/api -- app.unit.test.js`  
Expected: FAIL because `createApp` does not exist.

- [ ] **Step 5: Implement the minimal HTTP composition root**

```js
import express from 'express';

export function createApp(dependencies) {
  const app = express();
  app.get('/health', (_request, response) => response.status(200).json({ status: 'ok' }));
  return app;
}
```

Make `server.js` load configuration, construct dependencies, listen on `PORT`, and close its database pool on SIGTERM/SIGINT.

- [ ] **Step 6: Add safe local config**

Create Docker Compose for PostgreSQL 16 at localhost only with a named volume. `.env.example` lists `PORT`, `DATABASE_URL`, `DATABASE_URL_TEST`, `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`, `APP_TIME_ZONE`, and `DATABASE_SSL`. Ignore `.env`, `node_modules`, coverage, and database volumes.

- [ ] **Step 7: Verify and commit**

```powershell
npm test --workspace apps/api
npm run lint
npm run format:check
git add .
git commit -m "chore: initialize modular API workspace"
```

### Task 2: Create the users, refresh-token, and audit migrations

**Files:**
- Create: `apps/api/src/config/env.js`, `apps/api/src/db/pool.js`, `apps/api/src/db/run-migrations.js`.
- Create: `apps/api/src/db/migrations/001_extensions_and_users.sql`, `002_refresh_tokens.sql`, `003_audit_logs.sql`.
- Create: `apps/api/test/migrations.integration.test.js`.

**Interfaces:**
- Produces `loadEnv(source = process.env)`, `createPool(databaseUrl)`, and `runMigrations(pool)`.
- Produces `schema_migrations`, `users`, `refresh_tokens`, and `audit_logs`.

- [ ] **Step 1: Write a failing database-schema test**

Against `DATABASE_URL_TEST`, run migrations, then assert all four tables exist. Insert users with `administrator` and `worker`; assert any third role is rejected.

- [ ] **Step 2: Verify it fails**

Run: `npm test --workspace apps/api -- migrations.integration.test.js`  
Expected: FAIL because migrations do not exist.

- [ ] **Step 3: Implement config, pool, and ordered migrations**

Validate environment with Zod; reject malformed URLs, missing secrets, and a timezone other than `America/Bogota`. Use `pg.Pool` with `max: 10` and `idleTimeoutMillis: 30000`; enable SSL only with `DATABASE_SSL=true`. Read migration names lexicographically. In a transaction, execute only unrecorded files and insert each filename into `schema_migrations`; roll back on failure.

- [ ] **Step 4: Implement schemas**

`users` has UUID `id`, unique `email`, `password_hash`, role check `('administrator','worker')`, `is_active`, `created_at`, `updated_at`. `refresh_tokens` stores token hash, user ID, expiration and revocation time. `audit_logs` stores nullable actor user ID, action, entity type/ID, request ID, before/after JSONB, timestamp, and indexes for entity and actor/time.

- [ ] **Step 5: Verify and commit**

```powershell
npm test --workspace apps/api -- migrations.integration.test.js
npm test --workspace apps/api
git add apps/api/src/config apps/api/src/db apps/api/test/migrations.integration.test.js
git commit -m "feat: add authentication database schema"
```

### Task 3: Implement authentication services and account provisioning

**Files:**
- Create: `apps/api/src/modules/auth/{password.js,tokens.js,auth.repository.js,auth.service.js}`.
- Create: `apps/api/src/modules/users/{users.repository.js,users.service.js}`.
- Create: `apps/api/scripts/create-user.js`, `apps/api/test/auth.unit.test.js`.

**Interfaces:**
- Produces `hashPassword(password)`, `verifyPassword(hash, password)`.
- Produces `issueTokenPair(user)` and `verifyAccessToken(token)`.
- Produces `authService.login({ email, password, requestId })` and `authService.refresh({ refreshToken, requestId })`.
- Produces CLI-only `userService.createUser({ email, password, role, actorUserId, requestId })`.

- [ ] **Step 1: Write failing unit tests**

```js
expect(await verifyPassword(hash, 'wrong-password')).toBe(false);
expect(await verifyAccessToken(accessToken)).toMatchObject({ sub: user.id, role: 'worker' });
expect(secondPair.refreshToken).not.toBe(firstPair.refreshToken);
```

- [ ] **Step 2: Verify failure**

Run: `npm test --workspace apps/api -- auth.unit.test.js`  
Expected: FAIL because these primitives are absent.

- [ ] **Step 3: Implement secure primitives**

Use Argon2id. Sign access JWTs with issuer, audience, `sub`, email, role and token type; access lifetime is 15 minutes. Sign 7-day refresh tokens; only their hash is persisted. Rotation revokes the used record and creates its replacement in one transaction.

- [ ] **Step 4: Implement services and audit records**

Normalize email to lowercase. Login returns one `INVALID_CREDENTIALS` response for missing, inactive, or wrong-password accounts. Provisioning validates role/email, hashes password, writes user and `USER_CREATED` audit event in one transaction.

- [ ] **Step 5: Implement the external provisioning script**

Accept only `--email` and `--role`; read a password through hidden interactive input. Reject invalid roles. Print only user ID, email, and role. Do not expose an HTTP route for provisioning.

- [ ] **Step 6: Verify and commit**

```powershell
npm test --workspace apps/api -- auth.unit.test.js
git add apps/api/src/modules apps/api/scripts/create-user.js apps/api/test/auth.unit.test.js
git commit -m "feat: add secure authentication services"
```

### Task 4: Add REST endpoints, authorization, and error contract

**Files:**
- Create: `auth.routes.js`, `auth.controller.js`, `users.routes.js`.
- Create: `middleware/{authenticate.js,authorize.js,error-handler.js,not-found.js,request-id.js}`.
- Modify: `apps/api/src/app.js`.
- Create: `apps/api/test/auth.integration.test.js`.

**Interfaces:**
- Produces `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `GET /api/v1/users/me`.
- `authenticate` sets `request.auth` to verified `{ sub, email, role }`.
- `authorize(...roles)` rejects unauthorized users with 403.

- [ ] **Step 1: Write failing endpoint tests**

Create a test user; assert success login is 200, bad password is 401, profile without token is 401, and profile with bearer access token is 200 with no hash or refresh fields. Assert malformed JSON produces 400 and a worker receives 403 from a temporary admin-only test endpoint.

- [ ] **Step 2: Verify failure**

Run: `npm test --workspace apps/api -- auth.integration.test.js`  
Expected: FAIL because routes/middleware are absent.

- [ ] **Step 3: Implement request and error middleware**

Assign every request a UUID. Error bodies exactly follow:

```json
{ "error": { "code": "INVALID_CREDENTIALS", "message": "Credenciales inválidas", "requestId": "uuid" } }
```

Accept only `Authorization: Bearer <token>`. Use codes `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `VALIDATION_ERROR` (400), `NOT_FOUND` (404), and `INTERNAL_ERROR` (500); never expose internal detail.

- [ ] **Step 4: Implement security and routes**

Apply Helmet, CORS from `CORS_ORIGIN`, JSON body limit of `32kb`, and a login-specific rate limiter. Validate login/refresh bodies with Zod. Return token pair JSON; cookie transport waits for the web app.

- [ ] **Step 5: Verify and commit**

```powershell
npm test --workspace apps/api -- auth.integration.test.js
npm test --workspace apps/api
npm run lint
npm run format:check
git add apps/api/src apps/api/test/auth.integration.test.js
git commit -m "feat: expose authenticated API endpoints"
```

### Task 5: Document and reproduce local operation

**Files:**
- Modify: `README.md`, `.env.example`.
- Create: `apps/api/README.md`.

**Interfaces:**
- Produces repeatable setup, migration, provisioning, API and test instructions.

- [ ] **Step 1: Document commands and safety constraints**

Include commands for Docker PostgreSQL, migrations, provisioning administrator/worker accounts, API startup and tests. State that development/test databases use separate URLs and `.env` must never be committed.

- [ ] **Step 2: Verify a clean local database**

```powershell
docker compose up -d
npm run db:migrate --workspace apps/api
npm run create-user --workspace apps/api -- --email admin@example.test --role administrator
npm test --workspace apps/api
npm run lint
npm run format:check
```

Call `/health`, log in, then call `/api/v1/users/me` with the returned bearer token. Confirm no command output contains a password, hash, JWT, secret, or connection string.

- [ ] **Step 3: Commit**

```powershell
git add README.md apps/api/README.md .env.example
git commit -m "docs: document secure local API setup"
```

## Plan self-review

- Covered: API-only database access, authentication, fixed roles, audit foundation, validation, errors, rate limiting, transactions, testing and local operation.
- Deferred intentionally: clients, requests, credits, installments, payments, calendar, receipts, reports, web and mobile.
- Consistency confirmed: exact role values, `/api/v1` prefix, JWT claims and lifetimes are consistent across all tasks.

