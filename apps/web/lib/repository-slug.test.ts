import { describe, expect, it } from "vitest";

import { parseRepositorySlug } from "./repository-slug.js";

describe("parseRepositorySlug", () => {
  it("parses a plain owner/name slug", () => {
    expect(parseRepositorySlug("facebook/react")).toEqual({ owner: "facebook", name: "react" });
  });

  it("trims surrounding whitespace", () => {
    expect(parseRepositorySlug("  facebook/react  ")).toEqual({ owner: "facebook", name: "react" });
  });

  it("accepts a pasted GitHub URL", () => {
    expect(parseRepositorySlug("https://github.com/facebook/react")).toEqual({
      owner: "facebook",
      name: "react",
    });
    expect(parseRepositorySlug("http://www.github.com/facebook/react/")).toEqual({
      owner: "facebook",
      name: "react",
    });
  });

  it("strips a trailing .git", () => {
    expect(parseRepositorySlug("facebook/react.git")).toEqual({ owner: "facebook", name: "react" });
  });

  it("accepts names with dots, hyphens, and underscores", () => {
    expect(parseRepositorySlug("my-org/my_repo.js")).toEqual({
      owner: "my-org",
      name: "my_repo.js",
    });
  });

  it("rejects input with no slash", () => {
    expect(parseRepositorySlug("react")).toBeNull();
  });

  it("rejects input with more than one slash", () => {
    expect(parseRepositorySlug("facebook/react/tree/main")).toBeNull();
  });

  it("rejects an empty owner or name", () => {
    expect(parseRepositorySlug("/react")).toBeNull();
    expect(parseRepositorySlug("facebook/")).toBeNull();
  });

  it("rejects an owner starting or ending with a hyphen", () => {
    expect(parseRepositorySlug("-facebook/react")).toBeNull();
    expect(parseRepositorySlug("facebook-/react")).toBeNull();
  });

  it("rejects blank input", () => {
    expect(parseRepositorySlug("   ")).toBeNull();
  });
});
