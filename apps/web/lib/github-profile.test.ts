import { describe, expect, it } from "vitest";

import { mapGithubProfileToUser } from "./github-profile.js";

const fullProfile = {
  id: 583231,
  login: "octocat",
  name: "The Octocat",
  email: "octocat@github.com",
  avatar_url: "https://avatars.githubusercontent.com/u/583231",
};

describe("mapGithubProfileToUser", () => {
  it("maps a complete profile", () => {
    expect(mapGithubProfileToUser(fullProfile)).toEqual({
      name: "The Octocat",
      email: "octocat@github.com",
      image: "https://avatars.githubusercontent.com/u/583231",
      githubUserId: 583231,
      githubUsername: "octocat",
    });
  });

  it("falls back to the login when the display name is missing or blank", () => {
    expect(mapGithubProfileToUser({ ...fullProfile, name: null }).name).toBe("octocat");
    expect(mapGithubProfileToUser({ ...fullProfile, name: "   " }).name).toBe("octocat");
  });

  it("falls back to GitHub's noreply address when the email is private", () => {
    expect(mapGithubProfileToUser({ ...fullProfile, email: null }).email).toBe(
      "583231+octocat@users.noreply.github.com",
    );
  });

  it("converts string ids from the OAuth payload to numbers", () => {
    expect(mapGithubProfileToUser({ ...fullProfile, id: "583231" }).githubUserId).toBe(583231);
  });

  it("omits the image entirely when GitHub provides no avatar", () => {
    expect(mapGithubProfileToUser({ ...fullProfile, avatar_url: null })).not.toHaveProperty(
      "image",
    );
  });
});
