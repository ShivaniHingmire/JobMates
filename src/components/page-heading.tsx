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
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-brand">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl leading-7 text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
