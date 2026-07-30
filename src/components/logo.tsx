import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      aria-label="JobMates home"
      className={cn("inline-flex items-center gap-2.5 text-ink", className)}
    >
      <span className="relative grid size-9 rotate-[-6deg] place-items-center rounded-[0.9rem] bg-brand text-sm font-black text-white shadow-[0_7px_16px_rgba(236,91,63,0.25)]">
        J
        <span className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-paper bg-sun" />
      </span>
      {!compact && (
        <span className="font-display text-2xl font-bold tracking-[-0.04em]">
          JobMates
        </span>
      )}
    </Link>
  );
}
