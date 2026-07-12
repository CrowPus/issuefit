"use client";

import type { GithubRepositoryRecord } from "@issuefit/database";
import { useMemo, useState } from "react";

import { LanguageDot } from "./language-icon";
import { ListPagination } from "./list-pagination";

const PAGE_SIZE = 5;

export function GithubRepositoryList({
  repositories,
}: {
  repositories: readonly GithubRepositoryRecord[];
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
        No public repositories were found on your GitHub account.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {visibleRepositories.map((repository) => (
          <li
            key={repository.id}
            className="flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40"
          >
            <div className="min-w-0">
              <a
                href={repository.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
              >
                {repository.fullName}
              </a>
              {repository.description !== null && (
                <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                  {repository.description}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
              {repository.primaryLanguage !== null && (
                <span className="inline-flex items-center gap-1.5">
                  <LanguageDot language={repository.primaryLanguage} />
                  {repository.primaryLanguage}
                </span>
              )}
              <span aria-label={`${repository.stargazersCount} stars`}>
                ★ {repository.stargazersCount}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <ListPagination
        currentPage={currentPage}
        totalPages={totalPages}
        firstItemNumber={firstItemNumber}
        lastItemNumber={lastItemNumber}
        totalItems={repositories.length}
        itemLabel="repositories"
        onPrevious={() => setPage((value) => Math.max(1, value - 1))}
        onNext={() => setPage((value) => Math.min(totalPages, value + 1))}
      />
    </div>
  );
}
