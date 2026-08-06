export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 border-b border-slate-100">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-200 rounded flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 items-center px-4 py-4 border-b border-slate-50">
          <div className="w-10 h-14 bg-slate-100 rounded flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-slate-100 rounded w-3/4" />
            <div className="h-3 bg-slate-50 rounded w-1/2" />
          </div>
          {Array.from({ length: cols - 1 }).map((_, c) => (
            <div key={c} className="h-3 bg-slate-100 rounded w-16 flex-shrink-0" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-slate-100 rounded-xl" />
        <div className="space-y-2">
          <div className="h-3 bg-slate-100 rounded w-20" />
          <div className="h-6 bg-slate-100 rounded w-12" />
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
          <div className="h-4 bg-slate-100 rounded w-1/3" />
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-slate-50 rounded-lg" />
            <div className="w-8 h-8 bg-slate-50 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
