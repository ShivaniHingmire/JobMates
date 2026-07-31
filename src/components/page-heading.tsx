export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-brand">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-4xl leading-none font-semibold tracking-[-0.04em] sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
