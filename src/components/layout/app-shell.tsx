import { Bell } from "lucide-react";
import { Logo } from "@/components/logo";
import { AppNav } from "@/components/layout/app-nav";
import type { AppUser } from "@/lib/auth";

export function AppShell({
  user,
  children,
}: {
  user: AppUser;
  children: React.ReactNode;
}) {
  return (
    <div className="safe-app-shell noise min-h-dvh bg-paper">
      <header className="glass sticky top-0 z-40 border-b border-line/80">
        <div className="safe-app-header mx-auto flex max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <Logo />
          <div className="hidden md:block">
            <AppNav />
          </div>
          <div className="flex items-center gap-2">
            {user.isDemo && (
              <span className="hidden rounded-full bg-sun/35 px-3 py-1 text-xs font-bold text-ink sm:inline-flex">
                Demo mode
              </span>
            )}
            <button
              type="button"
              aria-label="Notifications"
              className="grid size-10 place-items-center rounded-full text-muted transition hover:bg-ink/5 hover:text-ink"
            >
              <Bell className="size-5" />
            </button>
            <div
              className="grid size-9 place-items-center rounded-full bg-sage text-sm font-bold text-white"
              title={user.email}
            >
              {user.displayName
                .split(" ")
                .slice(0, 2)
                .map((word) => word[0])
                .join("")
                .toUpperCase()}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto min-h-[calc(100dvh-4.5rem)] max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-9">
        {children}
      </main>
      <div className="safe-mobile-nav glass fixed inset-x-0 bottom-0 z-50 border-t border-line md:hidden">
        <AppNav mobile />
      </div>
    </div>
  );
}
