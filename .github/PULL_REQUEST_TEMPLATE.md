## What changed

<!-- Describe the change. Keep it focused: one logical change per pull request. -->

## Why

<!-- Link the related issue: Closes #123 -->

## How it was tested

<!-- Commands run, tests added, manual verification performed. -->

## Screenshots

<!-- Required for UI changes; delete this section otherwise. -->

## Database migrations

<!-- List generated migrations, or write "None". -->

## Security impact

<!-- New inputs, permissions, secrets, or external calls? Write "None" if not applicable. -->

## Breaking changes

<!-- API, schema, or configuration changes that affect existing deployments. "None" if not applicable. -->

## Checklist

- [ ] `pnpm format:check && pnpm build && pnpm typecheck && pnpm lint && pnpm test` passes locally
- [ ] Tests cover the changed behaviour
- [ ] Documentation is updated (README, docs/, `.env.example`)
- [ ] No debugging code, placeholders, or unexplained lint/type suppressions remain
