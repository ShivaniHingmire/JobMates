import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg" | "icon";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-brand text-white shadow-[0_8px_24px_rgba(236,91,63,0.25)] hover:bg-brand-dark",
        variant === "secondary" &&
          "border border-line bg-surface text-ink hover:border-ink/20 hover:bg-white",
        variant === "ghost" && "text-muted hover:bg-ink/5 hover:text-ink",
        variant === "danger" &&
          "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
        size === "sm" && "h-9 px-4 text-sm",
        size === "md" && "h-11 px-5 text-sm",
        size === "lg" && "h-13 px-7 text-base",
        size === "icon" && "size-11",
        className,
      )}
      {...props}
    />
  );
}
