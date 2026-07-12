import type { GithubProfileRecord } from "@issuefit/database";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function GithubProfileSummary({ profile }: { profile: GithubProfileRecord }) {
  return (
    <dl className="grid grid-cols-3 gap-4 text-center">
      <div>
        <dt className="text-sm text-zinc-500 dark:text-zinc-400">Public repos</dt>
        <dd className="text-xl font-semibold">{profile.publicRepos}</dd>
      </div>
      <div>
        <dt className="text-sm text-zinc-500 dark:text-zinc-400">Followers</dt>
        <dd className="text-xl font-semibold">{profile.followers}</dd>
      </div>
      <div>
        <dt className="text-sm text-zinc-500 dark:text-zinc-400">Following</dt>
        <dd className="text-xl font-semibold">{profile.following}</dd>
      </div>
      <p className="col-span-3 text-xs text-zinc-500 dark:text-zinc-400">
        Last synced {dateFormatter.format(profile.syncedAt)}
      </p>
    </dl>
  );
}
