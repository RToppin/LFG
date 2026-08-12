# ReadyLobby Production Readiness

This checklist is for preparing ReadyLobby for real accounts, live data, and public deployment.

## Ready In Code

- Production auth does not expose test credentials unless `ENABLE_TEST_AUTH=true` and `NODE_ENV !== "production"`.
- Admin access is role based through `User.role = ADMIN`; there is no public self-promotion flow.
- Admin-only areas use `canAdmin` for the dashboard and user management.
- Game creation and listing actions re-check approved catalog state server-side.
- Discord invite links are validated and default to approved members only.
- User blocks are enforced in join/match flows.
- Reports, moderation actions, notifications, and audit logs have database models.

## Required Production Environment

- `DATABASE_URL`: production Postgres connection string.
- `AUTH_SECRET`: strong random secret, at least 16 characters.
- `AUTH_URL`: production site URL, such as `https://your-domain.com`.
- `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`: production Discord OAuth app.
- `AUTH_DISCORD_ID` and `AUTH_DISCORD_SECRET`: optional Auth.js-compatible aliases if you prefer those names over `DISCORD_CLIENT_*`.
- `CRON_SECRET`: strong random secret for scheduled expiration routes.
- `ENABLE_TEST_AUTH=false`.
- `EMAIL_FROM`: sender address when transactional email is added.

## Launch Blockers

- Register production Discord OAuth callback URLs for the final domain.
- Run `npm run db:deploy` against the production database.
- Seed the approved game catalog with `npm run db:seed`.
- Create the first admin by directly setting one trusted user's `User.role` to `ADMIN` in the production database.
- Add Terms of Service, Privacy Policy, Community Guidelines, and support contact copy.
- Decide whether phone number, birthday, and payment data are actually needed before collecting that PII.
- Add backups, database monitoring, and error monitoring.
- Configure the production cron job to call `/api/cron/expire-posts` with `CRON_SECRET`.

## Recommended Before Public Beta

- Add a verified account/admin bootstrap runbook.
- Add moderation queue workflows for suspensions, restores, and report notes.
- Add user data export/deletion flows before collecting more personal information.
- Add email notifications for critical account and join-request events.
- Add rate-limit persistence if running across multiple server instances.
- Add analytics that avoids storing search history unless the user explicitly opts in.
