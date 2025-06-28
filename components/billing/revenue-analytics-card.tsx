"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import type { Payment } from "@/types/gym"

interface RevenueAnalyticsCardProps {
  payments: Payment[]
}

export function RevenueAnalyticsCard({ payments }: RevenueAnalyticsCardProps) {
  const currentMonth = new Date().getMonth()
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1

  const currentMonthRevenue = payments
    .filter((p) => p.status === "completed" && new Date(p.date).getMonth() === currentMonth)
    .reduce((sum, p) => sum + p.amount, 0)

  const lastMonthRevenue = payments
    .filter((p) => p.status === "completed" && new Date(p.date).getMonth() === lastMonth)
    .reduce((sum, p) => sum + p.amount, 0)

  const growth = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

  const revenueByType = payments
    .filter((p) => p.status === "completed")
    .reduce(
      (acc, payment) => {
        acc[payment.type] = (acc[payment.type] || 0) + payment.amount
        return acc
      },
      {} as Record<string, number>,
    )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Monthly Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">${currentMonthRevenue.toLocaleString()}</div>
            <div className="text-sm text-blue-700">This Month</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">${lastMonthRevenue.toLocaleString()}</div>
            <div className="text-sm text-gray-700">Last Month</div>
          </div>
        </div>

        {/* Growth Indicator */}
        <div className="flex items-center justify-center space-x-2">
          {growth >= 0 ? (
            <TrendingUp className="h-5 w-5 text-green-500" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-500" />
          )}
          <span className={`font-medium ${growth >= 0 ? "text-green-600" : "text-red-600"}`}>
            {Math.abs(growth).toFixed(1)}% {growth >= 0 ? "increase" : "decrease"}
          </span>
        </div>

        {/* Revenue by Type */}
        <div>
          <h4 className="font-medium mb-3">Revenue by Type</h4>
          <div className="space-y-3">
            {Object.entries(revenueByType).map(([type, amount]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm capitalize">{type.replace("_", " ")}</span>
                <span className="font-medium">${amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
