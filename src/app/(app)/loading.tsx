export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-32 rounded bg-line" />
      <div className="mt-4 h-12 w-72 rounded bg-line" />
      <div className="mt-8 h-[520px] max-w-3xl rounded-[2rem] bg-line/70" />
    </div>
  );
}
