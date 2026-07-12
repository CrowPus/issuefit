import { describe, expect, it } from "vitest";

import {
  entryVisibilitySchema,
  portfolioEntryUpdateSchema,
  profileVisibilitySchema,
} from "./portfolio.js";

const ENTRY_ID = "11111111-1111-4111-8111-111111111111";

describe("portfolioEntryUpdateSchema", () => {
  it("accepts a full valid edit", () => {
    const parsed = portfolioEntryUpdateSchema.safeParse({
      entryId: ENTRY_ID,
      title: "Fixed the thing",
      summary: "I did the work.",
      skillsDemonstrated: ["TypeScript", "PostgreSQL"],
      reviewRounds: 2,
    });
    expect(parsed.success).toBe(true);
  });

  it("treats a blank summary as null and accepts null review rounds", () => {
    const parsed = portfolioEntryUpdateSchema.safeParse({
      entryId: ENTRY_ID,
      title: "Title",
      summary: "   ",
      skillsDemonstrated: [],
      reviewRounds: null,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.summary).toBeNull();
      expect(parsed.data.reviewRounds).toBeNull();
    }
  });

  it("rejects an empty title", () => {
    expect(
      portfolioEntryUpdateSchema.safeParse({
        entryId: ENTRY_ID,
        title: "   ",
        summary: null,
        skillsDemonstrated: [],
        reviewRounds: null,
      }).success,
    ).toBe(false);
  });

  it("rejects a non-uuid entry id and negative review rounds", () => {
    expect(
      portfolioEntryUpdateSchema.safeParse({
        entryId: "not-a-uuid",
        title: "Title",
        summary: null,
        skillsDemonstrated: [],
        reviewRounds: null,
      }).success,
    ).toBe(false);
    expect(
      portfolioEntryUpdateSchema.safeParse({
        entryId: ENTRY_ID,
        title: "Title",
        summary: null,
        skillsDemonstrated: [],
        reviewRounds: -1,
      }).success,
    ).toBe(false);
  });
});

describe("entryVisibilitySchema", () => {
  it("accepts a boolean visibility", () => {
    expect(entryVisibilitySchema.safeParse({ entryId: ENTRY_ID, isPublic: true }).success).toBe(
      true,
    );
  });

  it.each(["yes", 1, null])("rejects non-boolean isPublic %j", (isPublic) => {
    expect(entryVisibilitySchema.safeParse({ entryId: ENTRY_ID, isPublic }).success).toBe(false);
  });
});

describe("profileVisibilitySchema", () => {
  it.each(["private", "public"])("accepts %j", (visibility) => {
    expect(profileVisibilitySchema.safeParse({ visibility }).success).toBe(true);
  });

  it.each(["hidden", "", null])("rejects %j", (visibility) => {
    expect(profileVisibilitySchema.safeParse({ visibility }).success).toBe(false);
  });
});
