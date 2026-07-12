import { describe, expect, it } from "vitest";

import { isTopListStale } from "./top-projects.js";

const NOW = new Date("2026-07-12T12:00:00Z");

describe("isTopListStale", () => {
  it("is stale when nothing was ever fetched", () => {
    expect(isTopListStale(null, NOW)).toBe(true);
  });

  it("is fresh within 24 hours", () => {
    expect(isTopListStale(new Date("2026-07-12T11:00:00Z"), NOW)).toBe(false);
    expect(isTopListStale(new Date("2026-07-11T12:00:00Z"), NOW)).toBe(false);
  });

  it("is stale after 24 hours", () => {
    expect(isTopListStale(new Date("2026-07-11T11:59:59Z"), NOW)).toBe(true);
  });
});
