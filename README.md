# LFG

LFG is a full-stack Looking for Group application for multiplayer co-op and survival games. It helps players discover compatible groups, create fresh LFG posts, request to join groups, reveal Discord invitations only after authorization, and keep stale listings out of discovery.

## Features

- Auth.js authentication with Discord OAuth and a development-only test login.
- Persistent player profiles, privacy controls, game libraries, platforms, play styles, and availability.
- Local game catalog seeded with Valheim, Minecraft Java, Minecraft Bedrock, ARK Survival Evolved, ARK Survival Ascended, Palworld, Terraria, and Project Zomboid.
- LFG post creation with campaign dates, listing expiration, hosting status, join mode, capacity, tags, Discord invitation validation, public or private invite behavior, refresh, close, save, and report actions.
- Discover search and filters for active posts with rule-based match scores and explanations.
- Join request workflow for open join and approval-required groups.
- In-app notifications with preferences and read state.
- Scheduled expiration endpoint for stale posts and 24-hour warning notifications.
- Saved posts, blocking, reporting, moderator/admin pages, audit records, and catalog management.
- Vitest unit tests, Playwright smoke test, and GitHub Actions CI.

## Stack

- Next.js App Router
- TypeScript strict mode
- React
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Auth.js with Discord OAuth
- Zod
- React Hook Form ready dependency for complex future form enhancements
- Vitest
- Playwright

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment defaults:

```bash
cp .env.example .env
```

3. Start PostgreSQL:

```bash
docker compose up -d
```

4. Generate Prisma, run migrations, and seed:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

5. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string.
- `AUTH_SECRET`: Auth.js secret. Generate with `openssl rand -base64 32`.
- `AUTH_URL`: Local or production application URL.
- `DISCORD_CLIENT_ID`: Discord OAuth client ID.
- `DISCORD_CLIENT_SECRET`: Discord OAuth client secret.
- `CRON_SECRET`: Bearer token for the expiration endpoint.
- `ENABLE_TEST_AUTH`: Set to `true` for local development test login only.
- `EMAIL_FROM`: Reserved for the email provider adapter.

Never commit real `.env` files or credentials.

## Discord OAuth Setup

In the Discord Developer Portal:

1. Create an application.
2. Add an OAuth2 redirect URL:
   - Local: `http://localhost:3000/api/auth/callback/discord`
   - Production: `https://your-domain.com/api/auth/callback/discord`
3. Use scopes `identify email`.
4. Copy the client ID and secret into `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`.

OAuth access tokens are stored server-side by Auth.js and are never exposed to browser code.

## Cron

The protected expiration endpoint is:

```text
POST /api/cron/expire-posts
Authorization: Bearer <CRON_SECRET>
```

Vercel Cron or a server cron job can call this endpoint hourly or daily. Expiration updates `status`, sets `closedAt`, and creates in-app notifications.

## Tests and Build

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

CI runs dependency installation, Prisma generation, migrations, linting, type checking, unit tests, and production build.

## Deployment

Use Vercel or another Node hosting platform with managed PostgreSQL.

1. Provision PostgreSQL and set `DATABASE_URL`.
2. Set `AUTH_SECRET`, `AUTH_URL`, Discord OAuth credentials, and `CRON_SECRET`.
3. Run `npm run db:deploy`.
4. Use `npm run build` as the build command.
5. Configure the cron endpoint with the bearer token.
6. Seed only catalog-safe production data. Do not seed development test users in production.
7. Assign the first admin through a secure database update or one-time protected admin bootstrap.
8. Configure backups for PostgreSQL.

## Project Structure

- `src/app`: App Router pages, route handlers, and server actions.
- `src/components`: Reusable presentation components.
- `src/lib`: Auth-independent business logic, validation, matching, expiration, Discord validation, authorization, and data access.
- `prisma`: Prisma schema and seed script.
- `tests/e2e`: Playwright smoke tests.
- `docs`: Architecture and Mermaid diagrams.

## Git Workflow

This work lives on `feature/lfg-core-platform`. Future work must use a feature, fix, refactor, or chore branch and merge through a pull request. See `CONTRIBUTING.md`.

## Known Limitations

- Email notifications are represented by preferences and an abstraction point; a production provider is not wired yet.
- The edit page supports refresh and close management; full field editing should be completed on a follow-up branch.
- E2E auth uses the development credentials provider and should be expanded with full multi-user workflows once CI secrets and a test database strategy are finalized.
- Game artwork uses local gradient placeholders so the app does not depend on a third-party catalog API.

## Future Roadmap

- Browser push notifications.
- Real-time group updates.
- Discord bot integration.
- Steam, Xbox, PlayStation, and Nintendo account linking.
- Calendar integrations.
- Verified community organizers.
- Featured posts and premium discovery tools.
- Public API.
