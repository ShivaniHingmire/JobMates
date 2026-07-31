"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bookmark,
  BriefcaseBusiness,
  Compass,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/discover", label: "Discover", mobileLabel: "Discover", icon: Compass },
  { href: "/saved", label: "Saved", mobileLabel: "Saved", icon: Bookmark },
  {
    href: "/applications",
    label: "Applications",
    mobileLabel: "Applied",
    icon: BriefcaseBusiness,
  },
  { href: "/analytics", label: "Analytics", mobileLabel: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Settings", mobileLabel: "Settings", icon: Settings },
];

export function AppNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={mobile ? "Mobile navigation" : "Main navigation"}
      className={cn(
        mobile
          ? "grid grid-cols-5"
          : "flex items-center gap-1 rounded-full border border-line bg-white/70 p-1",
      )}
    >
      {items.map(({ href, label, mobileLabel, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center justify-center gap-2 rounded-full font-semibold transition",
              mobile
                ? "min-h-16 min-w-0 flex-col px-0.5 text-[10px]"
                : "h-9 px-4 text-sm",
              active
                ? mobile
                  ? "text-brand"
                  : "bg-ink text-white"
                : "text-muted hover:text-ink",
            )}
          >
            <Icon className={cn("size-4", mobile && "size-5")} />
            <span className="max-w-full truncate">
              {mobile ? mobileLabel : label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
