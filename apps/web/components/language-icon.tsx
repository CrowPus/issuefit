import type { IconType } from "react-icons";
import {
  SiC,
  SiCplusplus,
  SiCss,
  SiDart,
  SiDocker,
  SiElixir,
  SiGnubash,
  SiGo,
  SiHaskell,
  SiHtml5,
  SiJavascript,
  SiJupyter,
  SiKotlin,
  SiLua,
  SiOpenjdk,
  SiPerl,
  SiPhp,
  SiPython,
  SiR,
  SiReact,
  SiRuby,
  SiRust,
  SiScala,
  SiSharp,
  SiSwift,
  SiTerraform,
  SiTypescript,
  SiVuedotjs,
} from "react-icons/si";

interface LanguageVisual {
  icon?: IconType;
  /** GitHub linguist's colour for the language, used for icons and dots. */
  color: string;
}

/**
 * Icons come from Simple Icons where a brand icon exists (Java's logo is
 * trademark-restricted, so linguist convention is OpenJDK); everything else
 * falls back to a GitHub-style coloured dot via `languageColor`.
 */
const languageVisuals: Record<string, LanguageVisual> = {
  TypeScript: { icon: SiTypescript, color: "#3178c6" },
  JavaScript: { icon: SiJavascript, color: "#f1e05a" },
  Python: { icon: SiPython, color: "#3572A5" },
  Java: { icon: SiOpenjdk, color: "#b07219" },
  Go: { icon: SiGo, color: "#00ADD8" },
  Rust: { icon: SiRust, color: "#dea584" },
  C: { icon: SiC, color: "#555555" },
  "C++": { icon: SiCplusplus, color: "#f34b7d" },
  "C#": { icon: SiSharp, color: "#178600" },
  Ruby: { icon: SiRuby, color: "#701516" },
  PHP: { icon: SiPhp, color: "#4F5D95" },
  Swift: { icon: SiSwift, color: "#F05138" },
  Kotlin: { icon: SiKotlin, color: "#A97BFF" },
  Shell: { icon: SiGnubash, color: "#89e051" },
  HTML: { icon: SiHtml5, color: "#e34c26" },
  CSS: { icon: SiCss, color: "#663399" },
  SCSS: { icon: SiCss, color: "#c6538c" },
  Dart: { icon: SiDart, color: "#00B4AB" },
  Vue: { icon: SiVuedotjs, color: "#41b883" },
  React: { icon: SiReact, color: "#61dafb" },
  Dockerfile: { icon: SiDocker, color: "#384d54" },
  HCL: { icon: SiTerraform, color: "#844FBA" },
  "Jupyter Notebook": { icon: SiJupyter, color: "#DA5B0B" },
  Scala: { icon: SiScala, color: "#c22d40" },
  Haskell: { icon: SiHaskell, color: "#5e5086" },
  Lua: { icon: SiLua, color: "#000080" },
  R: { icon: SiR, color: "#198CE7" },
  Perl: { icon: SiPerl, color: "#0298c3" },
  Elixir: { icon: SiElixir, color: "#6e4a7e" },
};

const UNKNOWN_LANGUAGE_COLOR = "#8b949e";

export function languageColor(language: string): string {
  return languageVisuals[language]?.color ?? UNKNOWN_LANGUAGE_COLOR;
}

/** Brand icon when we have one, GitHub-style coloured dot otherwise. */
export function LanguageIcon({ language, className }: { language: string; className?: string }) {
  const visual = languageVisuals[language];
  if (visual?.icon !== undefined) {
    const Icon = visual.icon;
    return <Icon aria-hidden className={className} style={{ color: visual.color }} />;
  }
  return <LanguageDot language={language} />;
}

/** The small coloured circle GitHub shows next to a repository's language. */
export function LanguageDot({ language }: { language: string }) {
  return (
    <span
      aria-hidden
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: languageColor(language) }}
    />
  );
}
