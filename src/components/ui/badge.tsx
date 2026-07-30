import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "success" | "warning";
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-line bg-white/70 px-2.5 py-1 text-xs font-semibold text-muted",
        tone === "success" && "border-transparent bg-mint text-sage",
        tone === "warning" && "border-transparent bg-sun/25 text-amber-900",
        className,
      )}
      {...props}
    />
  );
}
