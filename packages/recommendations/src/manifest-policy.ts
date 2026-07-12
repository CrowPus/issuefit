import type { IssueRecord, IssueWithRepository, RepositoryRecord } from "@issuefit/database";

const ISSUE_TYPE_LABELS: Record<string, readonly string[]> = {
  bug: ["bug"],
  documentation: ["documentation", "docs", "doc"],
  feature: ["feature", "enhancement"],
  maintenance: ["maintenance", "chore", "dependencies", "dependency"],
  performance: ["performance", "perf"],
  refactor: ["refactor", "refactoring"],
  testing: ["test", "tests", "testing"],
};

function labelTokens(label: string): Set<string> {
  return new Set(
    label
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 0),
  );
}

/**
 * Valid manifests are maintainer-declared consent and override admin
 * curation immediately (ADR-0016). Missing/invalid manifests keep the
 * current curation fallback, while invalid details stay visible in admin.
 */
export function repositoryAllowsExternalContributors(repository: RepositoryRecord): boolean {
  if (repository.manifestStatus !== "valid") {
    return true;
  }
  return (
    repository.manifestExternalContributions === true &&
    repository.manifestAcceptingContributors === true
  );
}

export function repositoryHasMaintainerApprovedManifest(repository: RepositoryRecord): boolean {
  return repository.manifestStatus === "valid" && repositoryAllowsExternalContributors(repository);
}

function manifestAllowsDifficulty(issue: IssueRecord, repository: RepositoryRecord): boolean {
  if (repository.manifestStatus !== "valid") {
    return true;
  }
  return repository.manifestDifficulty.includes(issue.difficulty);
}

function manifestAllowsIssueType(issue: IssueRecord, repository: RepositoryRecord): boolean {
  if (repository.manifestStatus !== "valid") {
    return true;
  }
  const labelTokenSets = issue.labels.map(labelTokens);
  return repository.manifestAllowedTypes.some((allowedType: string) => {
    const keywords = ISSUE_TYPE_LABELS[allowedType] ?? [];
    return keywords.some((keyword) =>
      labelTokenSets.some((tokens: ReadonlySet<string>) => tokens.has(keyword)),
    );
  });
}

/**
 * Applies manifest opportunity filters that the issue-health domain cannot
 * infer on its own. External-contribution opt-out is intentionally not
 * filtered here; it remains an engine exclusion so the reason is explicit.
 */
export function manifestAllowsIssueOpportunity({
  issue,
  repository,
}: IssueWithRepository): boolean {
  return manifestAllowsDifficulty(issue, repository) && manifestAllowsIssueType(issue, repository);
}
