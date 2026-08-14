/** Suspense fallback for lazy-loaded routes. Kept minimal and unobtrusive since it's usually only visible for a beat while a route chunk downloads. */
export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading page">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
    </div>
  );
}
