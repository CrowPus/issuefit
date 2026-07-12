import { findUserById, type RepositoryRecord } from "@issuefit/database";
import type { RecommendationScoreComponents } from "@issuefit/recommendation-engine";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppHeader } from "../../../components/app-header";
import { BriefingChecklist } from "../../../components/briefing-checklist";
import { ContributionPanel } from "../../../components/contribution-panel";
import { LanguageDot } from "../../../components/language-icon";
import { MatchScoreBadge } from "../../../components/match-score-badge";
import { RecommendationFeedbackButtons } from "../../../components/recommendation-feedback-buttons";
import { isAdminUsername } from "../../../lib/admin";
import { getAuth } from "../../../lib/auth";
import { getContributionForUser } from "../../../lib/contributions";
import { getDb } from "../../../lib/db";
import {
  briefingGithubIssueIdSchema,
  componentLabels,
  exclusionLabels,
  getIssueBriefingForUser,
} from "../../../lib/issue-briefing";
import { repositoryHasMaintainerApprovedManifest } from "../../../lib/manifest-policy";

export const metadata: Metadata = {
  title: "Issue briefing",
};

// Session-gated: must render per request, never at build time.
export const dynamic = "force-dynamic";

const NOT_AVAILABLE = "Not available";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      {children}
    </section>
  );
}

function FactRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className="w-56 shrink-0 text-sm text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-sm text-zinc-800 dark:text-zinc-200">{children}</dd>
    </div>
  );
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
    >
      {children}
    </a>
  );
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

function formatResponsivenessDetails(repository: RepositoryRecord): string | null {
  if (repository.maintainerResponsivenessScore === null) {
    return null;
  }
  const details: string[] = [];
  if (repository.medianFirstResponseDays !== null) {
    details.push(
      `~${repository.medianFirstResponseDays < 1 ? "<1" : Math.round(repository.medianFirstResponseDays)}d median first response`,
    );
  }
  if (repository.firstResponseRate !== null) {
    details.push(`${Math.round(repository.firstResponseRate * 100)}% of issues answered`);
  }
  const suffix = details.length > 0 ? ` (${details.join(", ")})` : "";
  return `${Math.round(repository.maintainerResponsivenessScore * 100)}%${suffix}`;
}

const aiPolicyLabels: Record<string, string> = {
  none: "No AI assistance accepted",
  "disclosed-assistance": "AI assistance must be disclosed",
  unrestricted: "Unrestricted",
};

const mentorshipLabels: Record<string, string> = {
  none: "No mentorship",
  limited: "Limited mentorship",
  available: "Mentorship available",
};

function checklistItems(repository: RepositoryRecord): string[] {
  const items = [
    "I have read the contribution guide",
    "I confirmed nobody is assigned and no pull request is already open",
    "I will ask the maintainers before making large changes",
  ];
  if (repository.manifestStatus !== "valid") {
    return items;
  }
  if (repository.manifestIssueDiscussionRequired === true) {
    items.push("I discussed this issue with the maintainers before starting (required here)");
  }
  if (repository.manifestTestsRequired === true) {
    items.push("I will cover my change with tests (required here)");
  }
  if (repository.manifestDraftPullRequestFirst === true) {
    items.push("I will open a draft pull request first (required here)");
  }
  return items;
}

export default async function IssueBriefingPage({
  params,
}: {
  params: Promise<{ githubIssueId: string }>;
}) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/signin");
  }

  const { githubIssueId: rawIssueId } = await params;
  const parsedIssueId = briefingGithubIssueIdSchema.safeParse(rawIssueId);
  if (!parsedIssueId.success) {
    notFound();
  }

  const db = getDb();
  const [user, briefing, contribution] = await Promise.all([
    findUserById(db, session.user.id),
    getIssueBriefingForUser(session.user.id, parsedIssueId.data),
    getContributionForUser(session.user.id, parsedIssueId.data),
  ]);
  if (!user) {
    redirect("/signin");
  }
  if (briefing === null) {
    notFound();
  }

  const { issue, repository, score } = briefing;
  const hasManifest = repositoryHasMaintainerApprovedManifest(repository);
  const responsiveness = formatResponsivenessDetails(repository);
  const setupMeasured = repository.setupSignalsCheckedAt !== null;

  return (
    <>
      <AppHeader
        userImage={user.image}
        userName={user.name}
        active="recommendations"
        isAdmin={isAdminUsername(user.githubUsername)}
      />
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href="/recommendations"
          className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          ← Back to recommendations
        </Link>

        <header className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight">{issue.title}</h1>
            <MatchScoreBadge score={score.total} />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <a
              href={repository.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 hover:underline"
            >
              {repository.fullName}
            </a>
            {repository.primaryLanguage !== null && (
              <span className="inline-flex items-center gap-1.5">
                <LanguageDot language={repository.primaryLanguage} />
                {repository.primaryLanguage}
              </span>
            )}
            {hasManifest && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                Maintainer-approved
              </span>
            )}
            <span className="capitalize">{issue.difficulty}</span>
            <ExternalLink href={issue.htmlUrl}>View issue on GitHub</ExternalLink>
          </div>
          {issue.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {issue.labels.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </header>

        {score.exclusions.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
            <p className="font-medium">This issue would not be recommended right now:</p>
            <ul className="mt-1 list-inside list-disc">
              {score.exclusions.map((exclusion) => (
                <li key={exclusion}>{exclusionLabels[exclusion]}</li>
              ))}
            </ul>
          </div>
        )}

        <SectionCard title="Why this matches you">
          {score.reasons.length > 0 ? (
            <ul className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
              {score.reasons.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <span aria-hidden className="text-emerald-500">
                    ✓
                  </span>
                  {reason}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No individual signal is strong enough to call out — the score below shows the full
              picture.
            </p>
          )}
          <dl className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
            {(Object.keys(componentLabels) as (keyof RecommendationScoreComponents)[]).map(
              (component) => (
                <div key={component} className="flex items-baseline justify-between gap-3">
                  <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                    {componentLabels[component]}
                  </dt>
                  <dd className="text-sm font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
                    {score.components[component]}%
                  </dd>
                </div>
              ),
            )}
          </dl>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Deterministic score, engine version {score.version} — no AI involved.
          </p>
        </SectionCard>

        <SectionCard title="Getting started">
          <dl className="flex flex-col gap-2">
            <FactRow label="Contribution guide">
              {repository.contributingUrl !== null ? (
                <ExternalLink href={repository.contributingUrl}>Read the guide</ExternalLink>
              ) : (
                NOT_AVAILABLE
              )}
            </FactRow>
            <FactRow label="Code of conduct">
              {repository.codeOfConductUrl !== null ? (
                <ExternalLink href={repository.codeOfConductUrl}>
                  Read the code of conduct
                </ExternalLink>
              ) : (
                NOT_AVAILABLE
              )}
            </FactRow>
            <FactRow label="README">
              {repository.readmeUrl !== null ? (
                <ExternalLink href={repository.readmeUrl}>Read the README</ExternalLink>
              ) : (
                NOT_AVAILABLE
              )}
            </FactRow>
          </dl>
        </SectionCard>

        <SectionCard title="Local setup signals">
          {setupMeasured ? (
            <dl className="flex flex-col gap-2">
              <FactRow label="Package manager">
                {repository.packageManager ?? "No known lockfile detected"}
              </FactRow>
              <FactRow label="Docker Compose">
                {repository.hasDockerCompose === null
                  ? NOT_AVAILABLE
                  : yesNo(repository.hasDockerCompose)}
              </FactRow>
              <FactRow label="Node version (.nvmrc)">
                {repository.nodeVersion ?? "No .nvmrc found"}
              </FactRow>
              <FactRow label="CI workflows">
                {repository.ciWorkflowNames !== null && repository.ciWorkflowNames.length > 0
                  ? repository.ciWorkflowNames.join(", ")
                  : "No workflow files found"}
              </FactRow>
            </dl>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Not measured yet — these signals are detected the next time an admin refreshes this
              repository.
            </p>
          )}
        </SectionCard>

        <SectionCard title="Maintainer signals">
          <dl className="flex flex-col gap-2">
            <FactRow label="Responsiveness">
              {responsiveness ?? "Not measured yet — measured during issue sync"}
            </FactRow>
            {repository.manifestStatus === "valid" &&
              repository.manifestExpectedResponseDays !== null && (
                <FactRow label="Response target (manifest)">
                  {repository.manifestExpectedResponseDays} days
                </FactRow>
              )}
          </dl>
        </SectionCard>

        <SectionCard title="Maintainer requirements">
          {repository.manifestStatus === "valid" ? (
            <dl className="flex flex-col gap-2">
              <FactRow label="Tests required">
                {repository.manifestTestsRequired === null
                  ? NOT_AVAILABLE
                  : yesNo(repository.manifestTestsRequired)}
              </FactRow>
              <FactRow label="Discuss the issue before a PR">
                {repository.manifestIssueDiscussionRequired === null
                  ? NOT_AVAILABLE
                  : yesNo(repository.manifestIssueDiscussionRequired)}
              </FactRow>
              <FactRow label="Draft pull request first">
                {repository.manifestDraftPullRequestFirst === null
                  ? NOT_AVAILABLE
                  : yesNo(repository.manifestDraftPullRequestFirst)}
              </FactRow>
              <FactRow label="AI policy">
                {repository.manifestAiPolicy === null
                  ? NOT_AVAILABLE
                  : (aiPolicyLabels[repository.manifestAiPolicy] ?? repository.manifestAiPolicy)}
              </FactRow>
              <FactRow label="Mentorship">
                {repository.manifestMentorshipAvailable === null
                  ? NOT_AVAILABLE
                  : (mentorshipLabels[repository.manifestMentorshipAvailable] ??
                    repository.manifestMentorshipAvailable)}
              </FactRow>
              {repository.manifestContributionGuide !== null && (
                <FactRow label="Guide named in the manifest">
                  <ExternalLink
                    href={`${repository.htmlUrl}/blob/HEAD/${repository.manifestContributionGuide}`}
                  >
                    {repository.manifestContributionGuide}
                  </ExternalLink>
                </FactRow>
              )}
            </dl>
          ) : repository.manifestStatus === "invalid" ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              This repository publishes a contribution manifest, but it currently fails validation —
              the requirements cannot be shown until the maintainers fix it.
            </p>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              This repository has not published an IssueFit contribution manifest. Check its
              contribution guide for expectations.
            </p>
          )}
        </SectionCard>

        <SectionCard title="Pre-flight checklist">
          <BriefingChecklist items={checklistItems(repository)} />
        </SectionCard>

        <SectionCard title="Your contribution">
          <ContributionPanel
            githubIssueId={issue.githubIssueId}
            initial={
              contribution === null
                ? null
                : {
                    status: contribution.status,
                    prUrl: contribution.prUrl,
                    branchName: contribution.branchName,
                  }
            }
          />
        </SectionCard>

        <SectionCard title="Rate this recommendation">
          <RecommendationFeedbackButtons
            githubIssueId={issue.githubIssueId}
            initialVerdict={briefing.verdict}
          />
        </SectionCard>
      </main>
    </>
  );
}
