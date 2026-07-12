"use client";

import type { RepositoryRecord } from "@issuefit/database";
import { useMemo, useState } from "react";

import { CuratedRepositoryRow } from "./curated-repository-row";
import { ListPagination } from "./list-pagination";

const PAGE_SIZE = 5;

export function CuratedRepositoryList({
  repositories,
  syncedIssueCounts,
}: {
  repositories: readonly RepositoryRecord[];
  /** Repository id → number of issues synced for it. */
  syncedIssueCounts: ReadonlyMap<string, number>;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(repositories.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const { visibleRepositories, firstItemNumber, lastItemNumber } = useMemo(() => {
    const startIndex = repositories.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, repositories.length);

    return {
      visibleRepositories: repositories.slice(startIndex, endIndex),
      firstItemNumber: repositories.length === 0 ? 0 : startIndex + 1,
      lastItemNumber: endIndex,
    };
  }, [currentPage, repositories]);

  if (repositories.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No repositories curated yet. Add one above to get started.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {visibleRepositories.map((repository) => (
          <CuratedRepositoryRow
            key={repository.id}
            repository={repository}
            syncedIssueCount={syncedIssueCounts.get(repository.id) ?? 0}
          />
        ))}
      </ul>
      <ListPagination
        currentPage={currentPage}
        totalPages={totalPages}
        firstItemNumber={firstItemNumber}
        lastItemNumber={lastItemNumber}
        totalItems={repositories.length}
        itemLabel="curated repositories"
        onPrevious={() => setPage((value) => Math.max(1, value - 1))}
        onNext={() => setPage((value) => Math.min(totalPages, value + 1))}
      />
    </div>
  );
}
