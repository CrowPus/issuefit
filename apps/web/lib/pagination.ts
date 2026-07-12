export const DEFAULT_PAGE_SIZE = 5;

export function parsePositivePage(value: string | string[] | undefined): number {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(candidate ?? "1", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function getPagedWindow(
  totalItems: number,
  currentPage: number,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    currentPage: safePage,
    totalPages,
    startIndex,
    endIndex,
    firstItemNumber: totalItems === 0 ? 0 : startIndex + 1,
    lastItemNumber: endIndex,
    hasPreviousPage: safePage > 1,
    hasNextPage: safePage < totalPages,
  };
}

export function buildPageHref(pathname: string, pageParam: string, page: number): string {
  if (page <= 1) {
    return pathname;
  }

  const params = new URLSearchParams();
  params.set(pageParam, String(page));
  return `${pathname}?${params.toString()}`;
}

export function paginate<T>(items: readonly T[], currentPage: number, pageSize: number): T[] {
  const { startIndex, endIndex } = getPagedWindow(items.length, currentPage, pageSize);
  return items.slice(startIndex, endIndex);
}
