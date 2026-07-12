# Open Contribution Manifest v0

Status: v0, MVP scope
License: Apache-2.0

The Open Contribution Manifest is a repository-owned YAML file that tells
contribution tools whether and how a project wants outside help. In IssueFit
MVP, maintainers onboard by committing this file to:

```text
.github/contribution-manifest.yml
```

The file is read from the repository's default branch. Tools must not require a
maintainer account or dashboard for v0.

## Example

```yaml
version: 1

project:
  externalContributions: true
  aiPolicy: disclosed-assistance
  contributionGuide: CONTRIBUTING.md

maintainerCapacity:
  acceptingContributors: true
  mentorshipAvailable: limited
  expectedResponseDays: 5

opportunities:
  allowedTypes: [bug, testing, documentation, performance]
  preferredSkills: [typescript, postgresql, docker]
  difficulty: [beginner, intermediate]

qualityRequirements:
  testsRequired: true
  issueDiscussionRequired: true
  draftPullRequestFirst: true
```

## Schema

`version`

Required. Must be `1`.

`project.externalContributions`

Required boolean. When `false`, tools must not recommend this repository to
outside contributors even if the repository was manually curated elsewhere.

`project.aiPolicy`

Required. One of:

- `none` — contributions must not use AI assistance.
- `disclosed-assistance` — AI assistance is allowed when disclosed.
- `unrestricted` — the project does not impose an AI-assistance rule.

IssueFit itself is AI-neutral: it does not call AI providers in the MVP. This
field records the maintainer's policy for contributors and other tools.

`project.contributionGuide`

Required relative repository path to the contribution guide. Absolute URLs and
parent-directory paths are invalid in v0.

`maintainerCapacity.acceptingContributors`

Required boolean. When `false`, tools should not recommend new contribution
starts even when `externalContributions` is `true`.

`maintainerCapacity.mentorshipAvailable`

Required. One of `none`, `limited`, or `available`.

`maintainerCapacity.expectedResponseDays`

Required integer from 1 to 365.

`opportunities.allowedTypes`

Required non-empty array. Allowed values:

- `bug`
- `documentation`
- `feature`
- `maintenance`
- `performance`
- `refactor`
- `testing`

IssueFit v0 maps these values to issue labels deterministically. If a valid
manifest exists and an issue cannot be matched to an allowed type, the issue is
not recommended.

`opportunities.preferredSkills`

Required array of skill names. Empty is allowed. IssueFit uses these as a
bounded recommendation boost when they overlap with a developer's confirmed
skills.

`opportunities.difficulty`

Required non-empty array. Allowed values: `beginner`, `intermediate`,
`advanced`. IssueFit v0 filters out issues whose assessed difficulty is not in
this list.

`qualityRequirements.testsRequired`

Required boolean. Display data for contribution briefings.

`qualityRequirements.issueDiscussionRequired`

Required boolean. Display data for contribution briefings.

`qualityRequirements.draftPullRequestFirst`

Required boolean. Display data for contribution briefings.

## Invalid Manifests

Invalid manifests must not be silently ignored. IssueFit stores the raw file
and validation errors, surfaces them in `/admin/repositories`, and falls back to
admin curation until the manifest becomes valid.

## Out Of Scope For v0

The MVP deliberately excludes a generator CLI, public validator service,
JSON-Schema publication, per-issue overrides, RFC governance, maintainer
dashboard, and GitHub write operations.
