import { cn } from "@/lib/utils";

export function MatchScore({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full border-4 border-mint bg-white text-sage",
        size === "sm" && "size-14",
        size === "md" && "size-18",
        size === "lg" && "size-24",
      )}
      aria-label={`${score} out of 100 résumé fit`}
    >
      <span
        className={cn(
          "font-black",
          size === "sm" && "text-lg",
          size === "md" && "text-xl",
          size === "lg" && "text-3xl",
        )}
      >
        {score}
      </span>
      {size !== "sm" && (
        <span className="absolute -bottom-6 text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
          Résumé fit
        </span>
      )}
    </div>
  );
}
