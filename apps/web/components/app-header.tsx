import Image from "next/image";
import Link from "next/link";

import { SignOutButton } from "./sign-out-button";
import { Wordmark } from "./wordmark";

interface AppHeaderProps {
  userImage: string | null;
  userName: string;
  active:
    | "dashboard"
    | "profile"
    | "recommendations"
    | "contributions"
    | "portfolio"
    | "projects"
    | "admin";
  /** Only signed-in admins see the Admin nav link — computed server-side. */
  isAdmin?: boolean;
}

const navLinks = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard" },
  { key: "recommendations", href: "/recommendations", label: "Recommendations" },
  { key: "contributions", href: "/contributions", label: "Contributions" },
  { key: "portfolio", href: "/portfolio", label: "Portfolio" },
  { key: "projects", href: "/projects", label: "Projects" },
  { key: "profile", href: "/profile", label: "Skill profile" },
] as const;

/** Shared top navigation for signed-in pages. */
export function AppHeader({ userImage, userName, active, isAdmin = false }: AppHeaderProps) {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
          <Link href="/dashboard" aria-label="IssueFit dashboard">
            <Wordmark className="text-xl" />
          </Link>
          <nav aria-label="Main" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                aria-current={active === link.key ? "page" : undefined}
                className={
                  active === link.key
                    ? "font-semibold text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin/repositories"
                aria-current={active === "admin" ? "page" : undefined}
                className={
                  active === "admin"
                    ? "font-semibold text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {userImage !== null && (
            <Image
              src={userImage}
              alt={`${userName}'s avatar`}
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
