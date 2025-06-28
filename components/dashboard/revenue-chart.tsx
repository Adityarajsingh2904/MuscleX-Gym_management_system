"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function RevenueChart() {
  // Mock data for the chart
  const data = [
    { month: "Jan", revenue: 12500 },
    { month: "Feb", revenue: 13200 },
    { month: "Mar", revenue: 11800 },
    { month: "Apr", revenue: 14500 },
    { month: "May", revenue: 15200 },
    { month: "Jun", revenue: 16800 },
  ]

  const maxRevenue = Math.max(...data.map((d) => d.revenue))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.month} className="flex items-center space-x-4">
              <div className="w-12 text-sm font-medium text-gray-600">{item.month}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-3 relative overflow-hidden">
                <div
                  className="bg-green-500 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                />
              </div>
              <div className="w-16 text-sm font-medium text-gray-900">${item.revenue.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
