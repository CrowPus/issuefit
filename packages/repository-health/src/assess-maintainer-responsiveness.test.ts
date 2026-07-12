import { describe, expect, it } from "vitest";

import {
  assessMaintainerResponsiveness,
  firstNonAuthorResponseAt,
} from "./assess-maintainer-responsiveness.js";
import { defaultRepositoryHealthConfig, RepositoryHealthConfigError } from "./config.js";
import type { FirstResponseSample } from "./types.js";

function sample(createdAt: string, respondedAt: string | null): FirstResponseSample {
  return {
    issueCreatedAt: new Date(createdAt),
    firstRespondedAt: respondedAt === null ? null : new Date(respondedAt),
  };
}

describe("assessMaintainerResponsiveness", () => {
  it("returns all nulls for an empty sample — not measured is an explicit state", () => {
    expect(assessMaintainerResponsiveness([])).toEqual({
      score: null,
      medianResponseDays: null,
      responseRate: null,
    });
  });

  it("scores zero, not null, when sampled issues exist but none were answered", () => {
    const result = assessMaintainerResponsiveness([
      sample("2026-01-01T00:00:00Z", null),
      sample("2026-01-02T00:00:00Z", null),
    ]);
    expect(result).toEqual({ score: 0, medianResponseDays: null, responseRate: 0 });
  });

  it("computes the median latency over answered issues only", () => {
    const result = assessMaintainerResponsiveness([
      sample("2026-01-01T00:00:00Z", "2026-01-02T00:00:00Z"), // 1 day
      sample("2026-01-01T00:00:00Z", "2026-01-04T00:00:00Z"), // 3 days
      sample("2026-01-01T00:00:00Z", "2026-01-06T00:00:00Z"), // 5 days
      sample("2026-01-01T00:00:00Z", null),
    ]);
    expect(result.medianResponseDays).toBe(3);
    expect(result.responseRate).toBe(0.75);
  });

  it("averages the two middle latencies for an even-sized answered set", () => {
    const result = assessMaintainerResponsiveness([
      sample("2026-01-01T00:00:00Z", "2026-01-02T00:00:00Z"), // 1 day
      sample("2026-01-01T00:00:00Z", "2026-01-04T00:00:00Z"), // 3 days
    ]);
    expect(result.medianResponseDays).toBe(2);
  });

  it("scales the latency score by the response rate", () => {
    // Median 3 days of max 30 → latency score 0.9; rate 0.5 → 0.45.
    const result = assessMaintainerResponsiveness([
      sample("2026-01-01T00:00:00Z", "2026-01-04T00:00:00Z"),
      sample("2026-01-01T00:00:00Z", null),
    ]);
    expect(result.score).toBeCloseTo(0.45, 5);
  });

  it("floors the latency score at zero for very slow responses", () => {
    const result = assessMaintainerResponsiveness([
      sample("2026-01-01T00:00:00Z", "2026-06-01T00:00:00Z"),
    ]);
    expect(result.score).toBe(0);
    expect(result.responseRate).toBe(1);
  });

  it("treats a response timestamped before issue creation as zero latency, never negative", () => {
    const result = assessMaintainerResponsiveness([
      sample("2026-01-02T00:00:00Z", "2026-01-01T00:00:00Z"),
    ]);
    expect(result.medianResponseDays).toBe(0);
    expect(result.score).toBe(1);
  });

  it("rejects an invalid configuration", () => {
    expect(() =>
      assessMaintainerResponsiveness([], {
        config: { ...defaultRepositoryHealthConfig, maxResponseDays: -1 },
      }),
    ).toThrow(RepositoryHealthConfigError);
  });
});

describe("firstNonAuthorResponseAt", () => {
  const comments = [
    { authorLogin: "author", createdAt: new Date("2026-01-01T10:00:00Z") },
    { authorLogin: "responder", createdAt: new Date("2026-01-02T10:00:00Z") },
    { authorLogin: "later", createdAt: new Date("2026-01-03T10:00:00Z") },
  ];

  it("skips the author's own comments", () => {
    expect(firstNonAuthorResponseAt(comments, "author")).toEqual(new Date("2026-01-02T10:00:00Z"));
  });

  it("takes the first comment when the author never self-replied", () => {
    expect(firstNonAuthorResponseAt(comments, "someone-else")).toEqual(
      new Date("2026-01-01T10:00:00Z"),
    );
  });

  it("returns null when every comment is by the author", () => {
    expect(
      firstNonAuthorResponseAt(
        [{ authorLogin: "author", createdAt: new Date("2026-01-01T10:00:00Z") }],
        "author",
      ),
    ).toBeNull();
  });

  it("returns null for no comments", () => {
    expect(firstNonAuthorResponseAt([], "author")).toBeNull();
  });

  it("counts a ghost commenter as a response when the issue author is known", () => {
    expect(
      firstNonAuthorResponseAt(
        [{ authorLogin: null, createdAt: new Date("2026-01-05T00:00:00Z") }],
        "author",
      ),
    ).toEqual(new Date("2026-01-05T00:00:00Z"));
  });

  it("never matches a ghost commenter against a ghost issue author", () => {
    expect(
      firstNonAuthorResponseAt(
        [{ authorLogin: null, createdAt: new Date("2026-01-05T00:00:00Z") }],
        null,
      ),
    ).toBeNull();
  });
});
