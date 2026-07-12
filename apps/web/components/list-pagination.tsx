"use client";

export function ListPagination({
  currentPage,
  totalPages,
  firstItemNumber,
  lastItemNumber,
  totalItems,
  itemLabel,
  onPrevious,
  onNext,
}: {
  currentPage: number;
  totalPages: number;
  firstItemNumber: number;
  lastItemNumber: number;
  totalItems: number;
  itemLabel: string;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  if (totalItems <= 5) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Showing{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{firstItemNumber}</span>-
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{lastItemNumber}</span> of{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{totalItems}</span>{" "}
        {itemLabel}
      </p>
      <div className="flex items-center gap-2 text-sm">
        {canGoPrevious ? (
          <button
            type="button"
            onClick={onPrevious}
            className="inline-flex items-center rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Previous
          </button>
        ) : (
          <span className="inline-flex items-center rounded-md border border-zinc-200 px-3 py-1.5 font-medium text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
            Previous
          </span>
        )}
        <span className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium tabular-nums text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Page {currentPage} of {totalPages}
        </span>
        {canGoNext ? (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center rounded-md bg-zinc-900 px-3 py-1.5 font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Next
          </button>
        ) : (
          <span className="inline-flex items-center rounded-md bg-zinc-200 px-3 py-1.5 font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500">
            Next
          </span>
        )}
      </div>
    </div>
  );
}
