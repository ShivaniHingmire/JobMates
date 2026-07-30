import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-line bg-surface shadow-[0_10px_40px_rgba(23,33,27,0.06)]",
        className,
      )}
      {...props}
    />
  );
}
