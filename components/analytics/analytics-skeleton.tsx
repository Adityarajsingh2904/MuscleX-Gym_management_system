import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MetricCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-20 mb-2" />
            <div className="flex items-center mt-2">
              <Skeleton className="h-4 w-4 rounded mr-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <Skeleton className="h-11 w-11 rounded-2xl" />
        </div>
      </CardContent>
    </Card>
  )
}

export function ChartCardSkeleton({ title }: { title?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title ? <Skeleton className="h-6 w-32" /> : <Skeleton className="h-6 w-40" />}</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  )
}

export function TableCardSkeleton({ title, rows = 5 }: { title?: string; rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title ? <Skeleton className="h-6 w-32" /> : <Skeleton className="h-6 w-40" />}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <th key={i} className="text-left p-2">
                    <Skeleton className="h-4 w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array(rows)
                .fill(0)
                .map((_, i) => (
                  <tr key={i} className="border-b">
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <td key={j} className="p-2">
                        <Skeleton className="h-4 w-full max-w-[80px]" />
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export function ControlsSkeleton() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-10 w-[180px]" />
      <Skeleton className="h-10 w-[180px]" />
    </div>
  )
}

export function OverviewAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-32" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-32" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-32" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member Growth and Franchise Comparison */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>

      {/* Franchise Comparison Table */}
      <TableCardSkeleton rows={5} />
    </div>
  )
}

export function PaymentAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Controls */}
      <ControlsSkeleton />

      {/* Payment Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="text-center">
                <Skeleton className="h-8 w-20 mx-auto mb-2" />
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>

      {/* Recent Payments Table */}
      <TableCardSkeleton rows={10} />
    </div>
  )
}

export function ExpenseAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Controls */}
      <ControlsSkeleton />

      {/* Expense Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="text-center">
                <Skeleton className="h-8 w-20 mx-auto mb-2" />
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>

      {/* Recent Expenses Table */}
      <TableCardSkeleton rows={10} />
    </div>
  )
}

export function MemberAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Controls */}
      <ControlsSkeleton />

      {/* Member Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="text-center">
                <Skeleton className="h-8 w-20 mx-auto mb-2" />
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>

      {/* Recent Members Table */}
      <TableCardSkeleton rows={10} />
    </div>
  )
}
