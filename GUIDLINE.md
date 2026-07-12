# Open-Source Engineering Guidelines

## Project Purpose

We are building an open-source AI platform that helps developers discover suitable open-source projects and GitHub issues based on their skills, interests, experience, and career goals.

The platform should:

- Connect securely to GitHub.
- Analyse a developer’s public repositories, pull requests, languages, and contribution history.
- Build an editable developer skill profile.
- Recommend active and suitable open-source issues.
- Explain why each issue matches the developer.
- Generate an issue briefing and implementation plan.
- Track the contribution from selection to pull-request completion.
- Generate a verified portfolio entry after the contribution is completed.

This project must be built as a professional open-source product. The codebase must look like it was designed and reviewed by experienced senior engineers.

---

# 1. Core Engineering Principle

Do not generate large amounts of code without clear architecture.

Before implementing a feature:

1. Understand the requirement.
2. Inspect the existing codebase.
3. Identify the correct module.
4. Design the data flow.
5. Define types and interfaces.
6. Consider failure scenarios.
7. Write or update tests.
8. Implement the smallest clean solution.
9. Update documentation.

Never add code merely to make a feature appear complete.

Prefer simple, maintainable solutions over impressive but unnecessary abstractions.

---

# 2. No AI-Generated Slop

The codebase must not contain signs of careless AI generation.

Do not produce:

- Huge files containing unrelated responsibilities.
- Repeated code.
- Placeholder functions pretending to work.
- Fake API integrations.
- Fake database data in production code.
- Empty catch blocks.
- Generic names such as `data`, `item`, `result`, or `handler` when better names are available.
- Excessive comments explaining obvious code.
- Unnecessary abstractions.
- Unused imports.
- Dead code.
- Large components with all logic inside them.
- Hardcoded secrets, IDs, URLs, or configuration values.
- Features marked complete when they are not functional.
- Silent error handling.
- Mock implementations outside test or development environments.
- Random dependencies when the standard library or existing dependency is enough.
- Copy-pasted components with small differences.
- Files named `utils.ts` containing unrelated helpers.

Every function, class, component, and module must have a clear responsibility.

---

# 3. Repository Structure

Use a monorepo structure.

```text
project-root/
├── apps/
│   ├── web/
│   └── worker/
├── packages/
│   ├── ai/
│   ├── database/
│   ├── github/
│   ├── recommendation-engine/
│   ├── shared/
│   └── config/
├── docs/
│   ├── architecture/
│   ├── decisions/
│   ├── development/
│   └── product/
├── scripts/
├── tests/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── workflows/
│   └── PULL_REQUEST_TEMPLATE.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── LICENSE
├── README.md
└── package.json
```

Do not create packages without a real reason.

Each package must have:

- A clear purpose.
- A public entry point.
- Strong typing.
- Its own tests where appropriate.
- No dependency on application UI code.

---

# 4. Recommended Technology Stack

Use:

- TypeScript.
- Next.js.
- React.
- PostgreSQL.
- Prisma or Drizzle ORM.
- GitHub App authentication and webhooks.
- A background worker for scheduled tasks.
- A queue only when asynchronous processing is genuinely needed.
- Zod for runtime validation.
- ESLint.
- Prettier.
- Vitest or Jest.
- Playwright for important user journeys.

Do not add additional technologies unless they solve a specific problem.

Do not introduce Redis, Kafka, Kubernetes, GraphQL, microservices, or event sourcing during the MVP unless there is a proven requirement.

The MVP should remain deployable using a simple web application, PostgreSQL database, and background worker.

---

# 5. TypeScript Rules

Use TypeScript in strict mode.

Required compiler settings should include:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitOverride": true,
  "noFallthroughCasesInSwitch": true
}
```

Rules:

- Do not use `any`.
- Use `unknown` for untrusted values.
- Validate external input before using it.
- Prefer explicit domain types.
- Avoid unsafe type assertions.
- Avoid non-null assertions.
- Use discriminated unions for state transitions.
- Keep API request and response types separate from database models.
- Do not expose ORM-generated types throughout the entire application.

Example:

```typescript
type ContributionStatus =
  | "recommended"
  | "selected"
  | "preparing"
  | "working"
  | "pull_request_opened"
  | "changes_requested"
  | "merged"
  | "closed"
  | "abandoned";
```

---

# 6. Domain-Driven Module Boundaries

Organise code around business domains, not random technical categories.

Main domains:

- Authentication.
- GitHub integration.
- Developer profiles.
- Skills.
- Repositories.
- Issues.
- Recommendations.
- Contributions.
- Portfolios.
- Notifications.
- AI generation.
- Administration.

Each domain should contain its own:

- Types.
- Validation schemas.
- Services.
- Repository or data-access layer.
- Tests.
- Public interface.

Do not allow UI components to directly call the database.

Do not place business logic inside React components, route handlers, or ORM queries.

---

# 7. Layer Responsibilities

Use clear boundaries.

## Presentation layer

Responsible for:

- Pages.
- Components.
- Forms.
- Loading states.
- Error states.
- Accessibility.
- Calling application services.

It must not contain recommendation logic, GitHub business logic, or database queries.

## Application layer

Responsible for:

- Use cases.
- Workflow orchestration.
- Permissions.
- Transactions.
- Calling domain services.

Examples:

- Connect GitHub account.
- Generate developer skill profile.
- Recommend issues.
- Start contribution.
- Create portfolio entry.

## Domain layer

Responsible for:

- Business rules.
- Scoring.
- Status transitions.
- Eligibility checks.
- Recommendation explanations.

The domain layer must not depend on Next.js, React, or HTTP.

## Infrastructure layer

Responsible for:

- PostgreSQL.
- GitHub API.
- AI providers.
- Queues.
- Email or notification providers.
- External services.

External providers must be accessed through interfaces.

---

# 8. GitHub Integration Standards

Use a GitHub App.

Do not require users to manually provide personal access tokens.

Follow least-privilege permissions.

Start with read-only access wherever possible.

The GitHub integration must:

- Verify webhook signatures.
- Handle duplicate webhook events.
- Store webhook delivery IDs.
- Process events idempotently.
- Respect GitHub API rate limits.
- Use pagination correctly.
- Handle deleted or renamed repositories.
- Handle revoked installations.
- Retry temporary failures.
- Avoid unnecessary polling.
- Never expose installation tokens to the browser.

Create a GitHub client interface so the business logic is not tied directly to Octokit.

Example:

```typescript
interface GitHubClient {
  getUserProfile(username: string): Promise<GitHubUserProfile>;
  listRepositories(installationId: string): Promise<GitHubRepository[]>;
  listRepositoryIssues(repository: RepositoryRef): Promise<GitHubIssue[]>;
  getPullRequest(repository: RepositoryRef, number: number): Promise<GitHubPullRequest>;
}
```

---

# 9. Recommendation Engine Standards

The recommendation engine is a core product feature and must remain deterministic and testable.

Do not let the language model directly decide the final recommendation score.

The structured scoring engine should calculate the score.

Initial scoring categories:

```text
Skill match                 30%
Preferred technology        15%
Difficulty match            10%
Issue freshness             10%
Repository activity         10%
Maintainer responsiveness   10%
Issue clarity               10%
Career-goal match             5%
```

The engine must:

- Return a score between 0 and 100.
- Return a breakdown of every score component.
- Explain exclusion reasons.
- Be testable without calling GitHub or an AI model.
- Use configurable weights.
- Avoid hidden magic numbers.
- Support future scoring versions.

Example result:

```typescript
interface RecommendationScore {
  total: number;
  version: string;
  components: {
    skillMatch: number;
    technologyPreference: number;
    difficultyMatch: number;
    freshness: number;
    repositoryActivity: number;
    maintainerResponsiveness: number;
    issueClarity: number;
    careerGoalMatch: number;
  };
  reasons: string[];
  exclusions: string[];
}
```

Exclude issues that are:

- Already assigned.
- Closed.
- Blocked.
- Stale beyond the configured threshold.
- Linked to an active pull request.
- From inactive repositories.
- Missing meaningful descriptions.
- Outside the user’s selected difficulty range.
- Not suitable for external contributors.

---

# 10. AI Integration Standards

AI must enhance the platform, not control critical decisions.

AI may be used for:

- Skill-profile suggestions.
- Issue summaries.
- Repository summaries.
- Implementation-plan suggestions.
- Recommendation explanations.
- Portfolio summaries.

AI must not be trusted to:

- Determine permissions.
- Decide whether an issue is open.
- Submit a pull request automatically.
- Comment on GitHub without explicit approval.
- Modify production data directly.
- Create final recommendation scores.
- Invent repository facts.
- Claim that code was tested when it was not.

Every AI-generated response must distinguish between:

- Confirmed repository facts.
- AI interpretation.
- Assumptions.
- Missing information.

Use structured outputs validated with Zod.

Example:

```typescript
const issueBriefSchema = z.object({
  summary: z.string().min(1),
  confirmedFacts: z.array(z.string()),
  assumptions: z.array(z.string()),
  relevantFiles: z.array(z.string()),
  setupSteps: z.array(z.string()),
  implementationSteps: z.array(z.string()),
  risks: z.array(z.string()),
  questionsForMaintainer: z.array(z.string()),
});
```

All AI providers must implement a shared interface.

The system must support replacing the AI provider without rewriting business logic.

---

# 11. Database Standards

Database design must be intentional.

Rules:

- Use UUIDs or another consistent identifier strategy.
- Add created and updated timestamps.
- Add unique constraints where required.
- Add foreign-key constraints.
- Add indexes based on real query patterns.
- Use database transactions for multi-step operations.
- Do not store secrets in plain text.
- Do not store full GitHub payloads without a documented reason.
- Do not duplicate external data unnecessarily.
- Record the source and timestamp of synchronised data.
- Use migrations for every schema change.
- Never manually modify production tables.

Keep database access inside repository or data-access modules.

Avoid complex ORM calls scattered across route handlers.

---

# 12. API Standards

Use consistent API behaviour.

All API inputs must be validated.

Successful responses should be predictable.

Errors should contain:

```typescript
interface ApiError {
  code: string;
  message: string;
  requestId: string;
  details?: Record<string, unknown>;
}
```

Do not expose:

- Stack traces.
- Database errors.
- Access tokens.
- Internal IDs that should remain private.
- Raw provider errors.

Use appropriate HTTP status codes.

Examples:

- `200` successful read.
- `201` created.
- `204` successful deletion with no body.
- `400` invalid request.
- `401` unauthenticated.
- `403` unauthorized.
- `404` missing resource.
- `409` state conflict.
- `422` valid request with invalid business state.
- `429` rate limit.
- `500` unexpected internal error.

---

# 13. Error Handling

Never ignore errors.

Every external integration must classify errors as:

- Validation error.
- Authentication error.
- Authorization error.
- Rate-limit error.
- Temporary provider error.
- Permanent provider error.
- Internal error.

Retry only temporary failures.

Use exponential backoff with a maximum retry count.

Do not retry:

- Invalid input.
- Permission denial.
- Missing repositories.
- Revoked GitHub installations.
- Unsupported requests.

Log enough context to diagnose the problem without exposing secrets or personal data.

---

# 14. Logging and Observability

Use structured logging.

Every request and background job should have a request or correlation ID.

Logs should include:

- Event name.
- Request ID.
- User ID where safe.
- Job ID.
- Provider.
- Duration.
- Success or failure.
- Error category.

Do not log:

- Access tokens.
- Cookies.
- Passwords.
- Full GitHub webhook secrets.
- AI API keys.
- Private repository content.
- Personal data without a clear need.

Do not scatter `console.log` statements throughout production code.

---

# 15. Security Requirements

Security must be treated as part of implementation, not a final task.

Required:

- Secure session cookies.
- CSRF protection where applicable.
- GitHub webhook signature verification.
- Input validation.
- Output encoding.
- Rate limiting.
- Authorization checks on every protected resource.
- Secret management through environment variables.
- Dependency vulnerability scanning.
- Secure HTTP headers.
- Database parameterisation.
- Protection against insecure direct-object references.
- Safe handling of markdown and user-generated content.
- Clear deletion and account-disconnection flows.

Never trust:

- GitHub usernames from the client.
- Repository IDs supplied by the browser.
- Webhook payloads before signature verification.
- AI-generated JSON before validation.
- Client-side permission checks.

---

# 16. Privacy Standards

Collect only data required for the product.

Users must be able to:

- Understand what GitHub data is accessed.
- Disconnect their GitHub account.
- Delete their account.
- Delete synchronised data.
- Control public portfolio visibility.
- See whether a contribution comes from a public or private repository.

Private repository data must never appear in a public portfolio unless the user explicitly approves a safe summary.

Document:

- Data collected.
- Why it is collected.
- How long it is retained.
- How deletion works.
- What third-party providers receive.

---

# 17. Frontend Standards

The interface should be clean, professional, and accessible.

Required:

- Responsive layouts.
- Keyboard navigation.
- Proper labels.
- Visible focus states.
- Semantic HTML.
- Loading states.
- Empty states.
- Error states.
- Success feedback.
- Confirmation before destructive actions.
- Accessible contrast.
- No layout shifts caused by missing dimensions.
- No unnecessary animations.

Components should remain small.

Move reusable business-free UI components into a shared UI package only when there is genuine reuse.

Do not create abstractions before at least two clear use cases exist.

Do not mix data fetching, business logic, and large UI sections in one file.

---

# 18. Testing Requirements

Every important business rule requires tests.

## Unit tests

Required for:

- Recommendation scoring.
- Issue exclusions.
- Skill calculations.
- Contribution-status transitions.
- Permission rules.
- AI output validation.
- Repository health calculations.

## Integration tests

Required for:

- Database repositories.
- GitHub webhook processing.
- Authentication.
- Recommendation generation.
- Contribution tracking.
- Portfolio creation.

## End-to-end tests

Required for critical flows:

1. Sign in with GitHub.
2. Complete onboarding.
3. Confirm skill profile.
4. Receive recommendations.
5. Open an issue briefing.
6. Start a contribution.
7. Track a pull request.
8. Publish a portfolio entry.

Tests must verify behaviour, not implementation details.

Do not create meaningless tests just to increase coverage.

Do not mock every internal module.

Mock external boundaries such as GitHub and AI providers.

---

# 19. Documentation Standards

Every important feature must be documented.

The root `README.md` must include:

- Project purpose.
- Product screenshots when available.
- Current project status.
- Architecture summary.
- Local setup.
- Environment variables.
- Database migration steps.
- Test commands.
- Development commands.
- Contribution process.
- Security-reporting instructions.
- Licence.
- Roadmap.
- Known limitations.

Create architecture decision records in:

```text
docs/decisions/
```

Use this format:

```text
Title
Status
Context
Decision
Alternatives considered
Consequences
Date
```

Create an architecture decision record when choosing:

- ORM.
- Queue system.
- Authentication strategy.
- GitHub App permissions.
- AI-provider abstraction.
- Recommendation scoring design.
- Monorepo tooling.
- Deployment model.

---

# 20. Open-Source Community Files

The repository must include:

- `README.md`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `LICENSE`
- Pull-request template.
- Bug-report template.
- Feature-request template.
- Documentation issue template.

`CONTRIBUTING.md` must explain:

- How to run the project.
- Branch naming.
- Commit expectations.
- Testing requirements.
- Pull-request requirements.
- Code-style rules.
- How to propose architectural changes.
- How to report security issues.
- How maintainers review contributions.

---

# 21. Commit Standards

Use clear, small commits.

Follow conventional commits:

```text
feat:
fix:
docs:
refactor:
test:
build:
ci:
chore:
perf:
security:
```

Examples:

```text
feat(recommendations): add issue freshness scoring
fix(github): handle revoked app installations
test(contributions): cover invalid status transitions
docs(setup): document GitHub webhook configuration
```

Do not use commit messages such as:

```text
update
changes
fix stuff
working
final
latest
```

Each commit should represent one logical change.

Do not combine formatting, refactoring, and new features in one large commit.

Commits authored with AI assistance must credit the project owner as co-author:

```text
Co-Authored-By: Mohamed Sesay <msesay@dee-empire.com>
```

---

# 22. Pull-Request Standards

Every pull request must include:

- What changed.
- Why it changed.
- How it was tested.
- Screenshots for UI changes.
- Migration details.
- Security impact.
- Breaking changes.
- Related issue.

A pull request is not complete when:

- Tests fail.
- Linting fails.
- Types fail.
- Documentation is missing.
- Temporary debugging code remains.
- Important errors are ignored.
- New environment variables are undocumented.
- Database migrations are missing.
- Accessibility has not been considered.

---

# 23. CI Requirements

Every pull request must run:

- Dependency installation.
- Formatting check.
- Linting.
- Type checking.
- Unit tests.
- Integration tests.
- Build.
- Migration validation.
- Security scanning.
- Dependency audit.

The default branch must remain deployable.

Do not merge directly into the default branch unless it is an emergency security fix.

---

# 24. Feature Completion Definition

A feature is complete only when:

- Requirements are satisfied.
- Architecture is respected.
- Inputs are validated.
- Authorization is implemented.
- Failure cases are handled.
- Tests are written.
- Documentation is updated.
- Logging is added where appropriate.
- Security implications are reviewed.
- No placeholder code remains.
- The UI includes loading, empty, error, and success states.
- The feature works end to end.

Do not mark a feature complete because the UI exists.

---

# 25. Agent Working Process

For every task, the agent must follow this process.

## Step 1: Inspect

Inspect:

- Existing files.
- Existing architecture.
- Related modules.
- Existing tests.
- Current coding conventions.

Do not create a second implementation of something that already exists.

## Step 2: Plan

Before coding, provide:

- Goal.
- Files to change.
- Data flow.
- Security considerations.
- Test plan.
- Risks.

Keep the plan concise but specific.

## Step 3: Implement

Implement in small, reviewable changes.

Do not rewrite unrelated parts of the codebase.

## Step 4: Validate

Run:

- Formatter.
- Linter.
- Type checker.
- Tests.
- Production build.

Fix errors before presenting the task as complete.

## Step 5: Report

At the end of each task, report:

- What was implemented.
- Files changed.
- Tests added.
- Commands run.
- Remaining limitations.
- Any follow-up work.

Never claim a command passed unless it was actually executed successfully.

---

# 26. Agent Behaviour Rules

The agent must:

- Ask for clarification only when the requirement cannot be safely inferred.
- Prefer existing patterns over introducing new ones.
- Explain major architectural decisions.
- Avoid unrelated changes.
- Preserve backward compatibility where reasonable.
- Surface risks early.
- State limitations honestly.
- Leave the repository in a working state.
- Treat documentation as part of the product.
- Treat tests as part of implementation.
- Treat security as part of every feature.

The agent must not:

- Pretend unfinished code is production-ready.
- Hide failing tests.
- disable linting rules to make code pass.
- Use `any` to escape type errors.
- Add `eslint-disable` without a written reason.
- Add `@ts-ignore` without a written reason.
- Commit secrets.
- Invent test results.
- Generate fake integrations.
- Leave TODO comments without an issue reference.
- Add dependencies without explaining why.
- Perform large refactors during unrelated feature work.

---

# 27. MVP Scope Protection

Only implement the approved MVP.

Included:

- GitHub authentication.
- GitHub App connection.
- Developer skill analysis.
- Editable skill profile.
- Career goals.
- Curated repository support.
- Issue synchronisation.
- Recommendation scoring.
- AI issue briefing.
- Contribution tracking.
- Verified portfolio entries.
- Weekly recommendations.
- Basic administration.

Not included:

- Full browser IDE.
- Autonomous coding.
- Automatic pull-request submission.
- Automatic comments on GitHub.
- Social networking.
- Job marketplace.
- Contribution leaderboards.
- GitLab or Bitbucket.
- Enterprise team management.
- Cryptocurrency or token rewards.
- Complex no-code workflow builder.

Do not implement excluded features unless the project owner explicitly changes the scope.

---

# 28. First Development Task

Before building product features, complete the foundation.

The first task should create:

1. Monorepo structure.
2. TypeScript strict configuration.
3. Formatting and linting.
4. Environment-variable validation.
5. PostgreSQL development setup.
6. Initial database package.
7. Web application shell.
8. Worker application shell.
9. Shared configuration package.
10. Unit-test setup.
11. End-to-end test setup.
12. CI workflow.
13. Root README.
14. Contributing guide.
15. Security policy.
16. Code of conduct.
17. Pull-request template.
18. Issue templates.
19. Architecture overview.
20. First architecture decision records.

Do not implement the complete product during the foundation task.

The result should be a clean, reliable base that other contributors can understand and extend.

---

# Final Quality Standard

Every change should answer these questions:

- Is this understandable to a new contributor?
- Is this the simplest correct solution?
- Is the behaviour tested?
- Are failures handled?
- Are permissions enforced?
- Is the documentation accurate?
- Can another developer safely modify this later?
- Does this code belong in this module?
- Would a senior engineer approve this change?

If the answer to any of these is no, the work is not complete.
