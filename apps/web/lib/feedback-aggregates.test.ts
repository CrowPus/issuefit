import { describe, expect, it } from "vitest";

import { countFeedbackVerdicts, VERDICT_LABELS, VERDICT_ORDER } from "./feedback-aggregates.js";

describe("countFeedbackVerdicts", () => {
  it("returns zero for every verdict when there is no feedback", () => {
    const counts = countFeedbackVerdicts([]);
    expect(Object.keys(counts).sort()).toEqual([...VERDICT_ORDER].sort());
    expect(Object.values(counts)).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it("counts each verdict independently", () => {
    const counts = countFeedbackVerdicts([
      { verdict: "good_match" },
      { verdict: "good_match" },
      { verdict: "too_difficult" },
      { verdict: "issue_unavailable" },
    ]);
    expect(counts.good_match).toBe(2);
    expect(counts.too_difficult).toBe(1);
    expect(counts.issue_unavailable).toBe(1);
    expect(counts.too_easy).toBe(0);
    expect(counts.not_interested).toBe(0);
    expect(counts.wrong_technology).toBe(0);
  });
});

describe("verdict display metadata", () => {
  it("has a label for every verdict in display order", () => {
    for (const verdict of VERDICT_ORDER) {
      expect(VERDICT_LABELS[verdict]).toBeTruthy();
    }
    expect(VERDICT_ORDER).toHaveLength(6);
  });
});
