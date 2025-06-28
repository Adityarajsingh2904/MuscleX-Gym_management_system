"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Bar, BarChart } from "recharts"

interface RevenueData {
  month: string
  revenue: number
  target: number
  growth: number
}

interface RevenueChartProps {
  data?: RevenueData[]
  type?: "line" | "bar"
  showTarget?: boolean
}

const mockData: RevenueData[] = [
  { month: "Jan", revenue: 45000, target: 40000, growth: 12.5 },
  { month: "Feb", revenue: 52000, target: 45000, growth: 15.6 },
  { month: "Mar", revenue: 48000, target: 47000, growth: 2.1 },
  { month: "Apr", revenue: 61000, target: 50000, growth: 22.0 },
  { month: "May", revenue: 55000, target: 52000, growth: 5.8 },
  { month: "Jun", revenue: 67000, target: 55000, growth: 21.8 },
  { month: "Jul", revenue: 72000, target: 60000, growth: 20.0 },
  { month: "Aug", revenue: 69000, target: 62000, growth: 11.3 },
  { month: "Sep", revenue: 78000, target: 65000, growth: 20.0 },
  { month: "Oct", revenue: 82000, target: 70000, growth: 17.1 },
  { month: "Nov", revenue: 85000, target: 75000, growth: 13.3 },
  { month: "Dec", revenue: 92000, target: 80000, growth: 15.0 },
]

export function RevenueChart({ data = mockData, type = "line", showTarget = true }: RevenueChartProps) {
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)
  const averageGrowth = data.reduce((sum, item) => sum + item.growth, 0) / data.length

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-1))",
    },
    target: {
      label: "Target",
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Analytics</CardTitle>
        <CardDescription>Monthly revenue performance and growth trends</CardDescription>
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Revenue: </span>
            <span className="font-semibold">${totalRevenue.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Avg Growth: </span>
            <span className="font-semibold text-green-600">+{averageGrowth.toFixed(1)}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {type === "line" ? (
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-revenue)" }}
                />
                {showTarget && (
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="var(--color-target)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: "var(--color-target)" }}
                  />
                )}
              </LineChart>
            ) : (
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" />
                {showTarget && <Bar dataKey="target" fill="var(--color-target)" opacity={0.6} />}
              </BarChart>
            )}
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
