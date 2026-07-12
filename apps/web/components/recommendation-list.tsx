"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { paginate, getPagedWindow } from "../lib/pagination";
import type { RecommendationsResult } from "../lib/recommendations";
import { ListPagination } from "./list-pagination";
import { RecommendationCard } from "./recommendation-card";
import { FilterBar, type FilterState } from "./recommendation-filter";

export function RecommendationList({ result }: { result: RecommendationsResult }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    languages: [],
    difficulties: [],
    labels: [],
    repositories: [],
  });

  const pageSize = 5;

  const filteredRecommendations = useMemo(() => {
    return result.topRecommendations.filter((rec) => {
      // Language Filter
      if (filters.languages.length > 0) {
        if (
          !rec.repository.primaryLanguage ||
          !filters.languages.includes(rec.repository.primaryLanguage)
        ) {
          return false;
        }
      }

      // Difficulty Filter
      if (filters.difficulties.length > 0) {
        if (!rec.issue.difficulty || !filters.difficulties.includes(rec.issue.difficulty)) {
          return false;
        }
      }

      // Repository Filter
      if (filters.repositories.length > 0) {
        if (!rec.repository.fullName || !filters.repositories.includes(rec.repository.fullName)) {
          return false;
        }
      }

      // Label Filter
      if (filters.labels.length > 0) {
        const issueLabels = rec.issue.labels || [];
        const hasMatchingLabel = filters.labels.some((label) => issueLabels.includes(label));
        if (!hasMatchingLabel) {
          return false;
        }
      }

      return true;
    });
  }, [result.topRecommendations, filters]);

  const totalFilteredCount = filteredRecommendations.length;
  const windowInfo = getPagedWindow(totalFilteredCount, currentPage, pageSize);

  const pageItems = useMemo(
    () => paginate(filteredRecommendations, currentPage, pageSize),
    [filteredRecommendations, currentPage, pageSize],
  );

  const totalPages = Math.ceil(totalFilteredCount / pageSize);

  if (result.candidateCount === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No issues have been synced yet. Check back once an admin curates some repositories and syncs
        their issues.
      </p>
    );
  }

  if (result.topRecommendations.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          None of the currently synced issues match your profile yet.
        </p>
        {!result.hasSkills && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/profile" className="underline-offset-2 hover:underline">
              Generate your skill profile
            </Link>{" "}
            to improve your matches.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {!result.hasSkills && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/profile" className="underline-offset-2 hover:underline">
              Generate your skill profile
            </Link>{" "}
            for more accurate matches.
          </p>
        )}
      </div>

      {result.topRecommendations.length > 0 && (
        <FilterBar
          recommendations={result.topRecommendations}
          filters={filters}
          onChange={(newFilters) => {
            setFilters(newFilters);
            setCurrentPage(1); // Reset to page 1 on filter change
          }}
        />
      )}

      {totalFilteredCount === 0 && result.topRecommendations.length > 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4">
          No recommendations match your current filters.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {pageItems.map((recommendation) => (
            <RecommendationCard key={recommendation.issue.id} recommendation={recommendation} />
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-4">
          <ListPagination
            currentPage={currentPage}
            totalPages={totalPages}
            firstItemNumber={windowInfo.firstItemNumber}
            lastItemNumber={windowInfo.lastItemNumber}
            totalItems={totalFilteredCount}
            itemLabel="recommendations"
            onPrevious={() => setCurrentPage((p) => Math.max(1, p - 1))}
            onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          />
        </div>
      )}
    </div>
  );
}
