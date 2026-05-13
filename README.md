# ErrorTracer Backend

Production error debugging and tracing infrastructure for teams that need to monitor, inspect, and resolve production failures quickly.

[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-supported-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Bun](https://img.shields.io/badge/Bun-ready-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![Docker](https://img.shields.io/badge/Docker-supported-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: AGPL v3](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

ErrorTracer is an open-source production error debugging and tracing platform. It helps companies and individual developers collect production errors, inspect application context, trace affected applications, manage production credentials, and debug incidents with less operational friction.

Use it self-hosted on your own infrastructure, or use the managed cloud version at [errortracer.com](https://www.errortracer.com).

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Screenshots](#screenshots)
- [Self-Hosted vs Cloud](#self-hosted-vs-cloud)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Docker Setup](#docker-setup)
- [Local Development](#local-development)
- [Database Setup](#database-setup)
- [Migrations](#migrations)
- [Seeds](#seeds)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [E2E Test Setup](#e2e-test-setup)
- [API Documentation](#api-documentation)
- [CI/CD Notes](#cicd-notes)
- [Deployment Notes](#deployment-notes)
- [Repository Structure](#repository-structure)
- [Related Repositories](#related-repositories)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)
- [Maintainers / Credits](#maintainers--credits)

## Overview

This repository contains the ErrorTracer backend API. It is responsible for authentication, user profiles, application management, production credentials, invitation notifications, and production error ingestion.

The API is designed for:

- Organizations that want to self-host production error tracing.
- Developers who need a focused debugging workflow for production incidents.
- Teams that want the option to move between self-hosted and managed cloud hosting.

Managed cloud platform: [https://www.errortracer.com](https://www.errortracer.com)

## Features

- User registration, login, refresh-token flow, and JWT-based authorization.
- Application registration and application type metadata.
- Application ownership, memberships, and invitations.
- Notification retrieval and mark-as-read workflow.
- Production credential generation and production-mode control.
- React production error ingestion endpoint.
- Localized API error responses.
- PostgreSQL persistence through Sequelize models.
- Docker-ready backend image.
- Testcontainers-backed e2e/API test environment.

## Architecture Overview

```text
Client SDK / Dashboard
        |
        v
ErrorTracer Backend API (NestJS)
        |
        v
PostgreSQL
```

Core modules:

- `auth`: registration, login, refresh tokens, and request authorization.
- `users`: profile and notification APIs.
- `applications`: application lifecycle, memberships, invitations, credentials, and status changes.
- `registry`: production error ingestion.
- `database`: Sequelize models, seeders, and database configuration.

No Redis, queue worker, websocket, or background job infrastructure is currently detected in this backend.

## Screenshots

Screenshots are intentionally left as placeholders until product images are added to the repository.

| Area                | Preview               |
| ------------------- | --------------------- |
| Error dashboard     | _Add screenshot here_ |
| Application details | _Add screenshot here_ |
| Error inspection    | _Add screenshot here_ |
| Team invitations    | _Add screenshot here_ |

## Self-Hosted vs Cloud

| Capability           | Self-hosted                                                                      | Managed cloud                                               |
| -------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Source availability  | Fully open source                                                                | Managed service                                             |
| Infrastructure       | Deployed and operated by your team                                               | Operated by ErrorTracer                                     |
| Database             | Your PostgreSQL instance                                                         | Managed for you                                             |
| Updates              | Your release process                                                             | Delivered by the platform                                   |
| Operational overhead | You own backups, monitoring, upgrades, and scaling                               | Reduced operational overhead                                |
| Best for             | Teams with infrastructure requirements, compliance needs, or private deployments | Teams that want ErrorTracer without managing infrastructure |

Cloud version: [https://www.errortracer.com](https://www.errortracer.com)

## Tech Stack

- **Runtime/package manager:** Bun
- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Sequelize and sequelize-typescript
- **Authentication:** JWT, refresh-token cookies
- **Validation:** class-validator and NestJS validation pipes
- **Testing:** Jest, Supertest, Testcontainers PostgreSQL
- **Containerization:** Docker

## Installation

Prerequisites:

- Bun
- Node.js compatible with the configured toolchain
- PostgreSQL for local development
- Docker for containerized development and e2e tests

Install dependencies:

```bash
bun install
```

## Environment Setup

This backend expects environment variables for the application, PostgreSQL, and JWT secrets. There is no `.env.example` in this backend repository at the moment, so use the following as a starting point:

```bash
# Application
NODE_ENV=development
APP_PORT=4973

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=errortracer

# Auth
JWT_SECRET=replace-me
ACCESS_TOKEN_SECRET=replace-me
REFRESH_TOKEN_SECRET=replace-me
```

Create a local `.env` file:

```bash
cp .env.test .env
```

Then adjust the values for your local database and secrets.

## Docker Setup

Build the backend image:

```bash
docker build -t errortracer-backend -f dockerfile .
```

Run the backend container after providing a valid `.env` file:

```bash
docker run --env-file .env -p 4973:4973 errortracer-backend
```

### Docker Compose

A related Docker Compose repository was detected at:

- [https://github.com/errorstracer/docker-compose](https://github.com/errorstracer/docker-compose)

The sibling compose setup includes:

- backend API
- dashboard frontend
- PostgreSQL database

From the compose repository:

```bash
cp .env.example .env
docker compose up -d
```

Default compose ports detected:

| Service            | Port           |
| ------------------ | -------------- |
| Frontend dashboard | `3000`         |
| Backend API        | `4973`         |
| PostgreSQL         | `5431 -> 5432` |

## Local Development

Start the API in watch mode:

```bash
bun run start:dev
```

Start with the Nest debugger:

```bash
bun run start:debug
```

Format source files:

```bash
bun run format
```

Lint source files:

```bash
bun run lint
```

Type-check the project:

```bash
bunx tsc --noEmit
```

## Database Setup

The backend uses PostgreSQL and reads connection settings from:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

Sequelize CLI configuration is located in:

- `.sequelizerc`
- `src/database/config.js`

Models are located in:

```text
src/database/models/
```

Seeders are located in:

```text
src/database/seeders/
```

## Migrations

No production Sequelize migration files are currently present in this backend repository.

The implemented test database initialization command creates the test schema from Sequelize models:

```bash
bun run db:test:migrate
```

For production deployments, add explicit migrations before relying on automated schema changes.

## Seeds

Generate a new Sequelize seed file:

```bash
bun run db:seed:generate -- <seed-name>
```

Run configured Sequelize seeders:

```bash
bun run db:seed:run
```

Run test seeders against the active test database connection:

```bash
bun run db:test:seed
```

Current seed data includes application type metadata.

## Running the Application

Development:

```bash
bun run start:dev
```

Standard Nest start:

```bash
bun run start
```

Production build:

```bash
bun run build
```

Production start:

```bash
bun run start:prod
```

By default, the app listens on `APP_PORT` or `4973`.

## Testing

Run unit tests:

```bash
bun run test
```

Run tests in watch mode:

```bash
bun run test:watch
```

Run coverage:

```bash
bun run test:cov
```

Run API/e2e tests:

```bash
bun run test:e2e
```

Alias for API/e2e tests:

```bash
bun run test:api
```

CI API/e2e command:

```bash
bun run test:api:ci
```

## E2E Test Setup

The e2e suite uses Jest, Supertest, and Testcontainers PostgreSQL.

Lifecycle:

1. Jest global setup starts one temporary `postgres:16-alpine` container for the full e2e run.
2. The test schema is initialized from Sequelize models.
3. Seeders are executed once.
4. Module-level e2e specs run sequentially.
5. Mutable test data is reset deterministically between suites.
6. Jest global teardown stops and removes the PostgreSQL container.

E2E files are organized by domain:

```text
test/auth.e2e-spec.ts
test/applications.e2e-spec.ts
test/users.e2e-spec.ts
test/registry.e2e-spec.ts
```

Shared test helpers live in:

```text
test/support/
```

Docker must be running before executing e2e tests locally:

```bash
docker info
bun run test:e2e
```

## API Documentation

Published API documentation:

- [https://www.postman.com/errorstracer/backend](https://www.postman.com/errorstracer/backend)

## CI/CD Notes

Recommended CI sequence:

```bash
bun install --frozen-lockfile
bunx tsc --noEmit
bun run lint
bun run test
bun run test:api:ci
```

CI runners must provide Docker access for Testcontainers.

Notes:

- Do not point tests at local development or production databases.
- E2E tests create an isolated PostgreSQL container automatically.
- The container is removed during Jest global teardown.
- Keep migrations and seeders deterministic so CI remains repeatable.

## Deployment Notes

Production deployment requires:

- A reachable PostgreSQL database.
- Strong JWT and refresh-token secrets.
- A production `.env` or equivalent secret management.
- TLS termination at the load balancer, reverse proxy, or platform layer.
- Database backup and restore strategy.
- Observability for application logs and database health.

Build and start:

```bash
bun run build
bun run start:prod
```

Docker:

```bash
docker build -t errortracer-backend -f dockerfile .
docker run --env-file .env -p 4973:4973 errortracer-backend
```

## Repository Structure

```text
src/
  app.module.ts                  # Root Nest module and database wiring
  main.ts                        # HTTP bootstrap, validation, filters, versioning
  common/                        # Constants, localization, filters
  database/
    config.js                    # Sequelize CLI config
    models/                      # Sequelize models
    seeders/                     # Sequelize seeders
  helpers/                       # Shared infrastructure helpers
  modules/
    auth/                        # Authentication and JWT guard
    applications/                # Apps, memberships, invitations, credentials
    users/                       # Profiles and notifications
    registry/                    # Production error ingestion
test/
  *.e2e-spec.ts                  # Module-level e2e/API tests
  global-setup.ts                # Testcontainers startup and schema/seed init
  global-teardown.ts             # Testcontainers cleanup
  support/                       # E2E app, auth, fixtures, DB reset helpers
```

## Related Repositories

Detected related repositories:

- Backend: [https://github.com/errorstracer/backend](https://github.com/errorstracer/backend)
- Dashboard frontend: [https://github.com/errorstracer/dashboard](https://github.com/errorstracer/dashboard)
- Docker Compose setup: [https://github.com/errorstracer/docker-compose](https://github.com/errorstracer/docker-compose)

## Contributing

Contributions are welcome.

Suggested workflow:

1. Fork the repository.
2. Create a feature branch.
3. Install dependencies with `bun install`.
4. Make focused changes with tests.
5. Run:

```bash
bunx tsc --noEmit
bun run lint
bun run test
bun run test:e2e
```

6. Open a pull request with a clear summary and testing notes.

Please keep changes scoped, deterministic, and compatible with self-hosted deployments.

## Security

Please do not report security vulnerabilities through public issues.

Security contact: elsiddig190@gmail.com

When reporting, include:

- affected endpoint or component
- impact
- reproduction steps
- relevant logs or payload examples
- suggested mitigation, if known

## License

ErrorTracer is open-source software licensed under the GNU Affero General Public License v3.0 (AGPLv3).

You are free to self-host, modify, and use the platform under the terms of the license. If you offer a modified version of ErrorTracer as a network-accessible service, you must make the corresponding source code available to users of that service.

License text: [GNU AGPLv3](https://www.gnu.org/licenses/agpl-3.0)

## Maintainers / Credits

Created by the ErrorTracer project creator.

Creator LinkedIn: [Elsiddig Ahmed](https://www.linkedin.com/in/dailysiddig/)

No creator LinkedIn URL was found in the repository, so this placeholder is intentionally left for maintainers to fill in.
