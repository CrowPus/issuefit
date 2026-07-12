/**
 * How ready a repository is to receive outside contributors, graded from
 * signals the platform already measures (ADR-0020). Deterministic and
 * testable without GitHub or a database; shown publicly on the /projects
 * directory so maintainers can see exactly what to improve.
 */

/**
 * `unknown` means the underlying signal has not been measured yet (e.g.
 * responsiveness before the first issue sync) — it scores zero but is
 * displayed as "not measured", never as a failure (ADR-0015 honesty rule).
 */
export type ReadinessItemState = "met" | "missing" | "unknown";

export type ReadinessItemId =
  | "active_development"
  | "readme"
  | "contributing_guide"
  | "code_of_conduct"
  | "ci_workflows"
  | "contribution_manifest"
  | "responsive_maintainers";

export interface ContributorReadinessItem {
  id: ReadinessItemId;
  state: ReadinessItemState;
  /** Points this item contributes to the 0–100 score when met. */
  weight: number;
}

export type ReadinessGrade = "A" | "B" | "C" | "D" | "E";

export interface ContributorReadinessAssessment {
  /** 0–100: the sum of met item weights. Unknown items score zero. */
  score: number;
  grade: ReadinessGrade;
  items: ContributorReadinessItem[];
}

export interface ContributorReadinessInput {
  isActive: boolean;
  /**
   * Community/setup signals are null when never measured for this
   * repository (curated before ADR-0017 and not refreshed since); a
   * measured absence is `false`.
   */
  hasReadme: boolean | null;
  hasContributingGuide: boolean | null;
  hasCodeOfConduct: boolean | null;
  hasCiWorkflows: boolean | null;
  manifestStatus: "missing" | "valid" | "invalid";
  manifestAcceptingContributors: boolean | null;
  /** Null when responsiveness has not been measured yet (ADR-0015). */
  medianFirstResponseDays: number | null;
}

/** Median first response within a week counts as responsive maintainership. */
const RESPONSIVE_MEDIAN_DAYS = 7;

const WEIGHTS: Record<ReadinessItemId, number> = {
  active_development: 15,
  readme: 10,
  contributing_guide: 15,
  code_of_conduct: 10,
  ci_workflows: 10,
  contribution_manifest: 25,
  responsive_maintainers: 15,
};

function booleanState(met: boolean): ReadinessItemState {
  return met ? "met" : "missing";
}

function measuredState(met: boolean | null): ReadinessItemState {
  return met === null ? "unknown" : booleanState(met);
}

function gradeFor(score: number): ReadinessGrade {
  if (score >= 85) {
    return "A";
  }
  if (score >= 65) {
    return "B";
  }
  if (score >= 45) {
    return "C";
  }
  if (score >= 25) {
    return "D";
  }
  return "E";
}

/**
 * Grades contributor readiness from stored curation-time signals. The
 * manifest carries the largest weight: a valid, accepting contribution
 * manifest is the strongest consent signal a maintainer can give (ADR-0016).
 */
export function assessContributorReadiness(
  input: ContributorReadinessInput,
): ContributorReadinessAssessment {
  const items: ContributorReadinessItem[] = [
    {
      id: "active_development",
      state: booleanState(input.isActive),
      weight: WEIGHTS.active_development,
    },
    { id: "readme", state: measuredState(input.hasReadme), weight: WEIGHTS.readme },
    {
      id: "contributing_guide",
      state: measuredState(input.hasContributingGuide),
      weight: WEIGHTS.contributing_guide,
    },
    {
      id: "code_of_conduct",
      state: measuredState(input.hasCodeOfConduct),
      weight: WEIGHTS.code_of_conduct,
    },
    {
      id: "ci_workflows",
      state: measuredState(input.hasCiWorkflows),
      weight: WEIGHTS.ci_workflows,
    },
    {
      id: "contribution_manifest",
      state: booleanState(
        input.manifestStatus === "valid" && input.manifestAcceptingContributors === true,
      ),
      weight: WEIGHTS.contribution_manifest,
    },
    {
      id: "responsive_maintainers",
      state:
        input.medianFirstResponseDays === null
          ? "unknown"
          : booleanState(input.medianFirstResponseDays <= RESPONSIVE_MEDIAN_DAYS),
      weight: WEIGHTS.responsive_maintainers,
    },
  ];

  const score = items.reduce((sum, item) => (item.state === "met" ? sum + item.weight : sum), 0);
  return { score, grade: gradeFor(score), items };
}
