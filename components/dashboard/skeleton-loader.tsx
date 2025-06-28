import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-8 w-16" />
              <Skeleton className="mt-2 h-4 w-12" />
            </div>
          ))}
      </div>

      {/* Charts Row Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-[240px] w-full" />
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-[240px] w-full" />
        </div>
      </div>

      {/* Bottom Row Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border bg-card p-6 shadow-sm">
          <Skeleton className="h-6 w-32 mb-4" />
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full max-w-[200px]" />
                  <Skeleton className="mt-1 h-3 w-full max-w-[160px]" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <Skeleton className="h-6 w-32 mb-4" />
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="mb-3 flex items-center gap-4 py-2">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full max-w-[140px]" />
                  <Skeleton className="mt-1 h-3 w-full max-w-[100px]" />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

// Add this export alias
export { DashboardSkeleton as SkeletonLoader }
