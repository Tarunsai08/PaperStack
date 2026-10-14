export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} aria-hidden />;
}

export function CardSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <Skeleton className="aspect-[16/9] w-full rounded-card" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-5" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-[72px] w-[96px] shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ArticleSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      {[100, 96, 98, 70, 0, 100, 92, 97, 60].map((w, i) =>
        w ? <Skeleton key={i} className="h-4" /> : <div key={i} className="h-4" />,
      )}
    </div>
  );
}
