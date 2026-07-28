# Contributing to LFG

Every feature, fix, refactor, or chore must be completed on its own branch and merged through a pull request.

Recommended branch names:

```text
feature/feature-name
fix/issue-name
refactor/component-name
chore/task-name
```

Do not commit directly to `main` or `master`. Do not commit `.env` files, OAuth secrets, database passwords, API tokens, Discord credentials, or production data.

Before opening a pull request:

1. Run `npm run lint`.
2. Run `npm run typecheck`.
3. Run `npm test`.
4. Run `npm run build`.
5. Add migration and seed notes when database behavior changes.
6. Confirm protected data, OAuth tokens, private invitations, and moderation notes are not exposed to the browser.

Pull requests should include a summary, setup instructions, tests run, screenshots for UI changes, and any remaining manual configuration.
