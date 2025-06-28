"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface MembershipData {
  month: string
  active: number
  new: number
  cancelled: number
  total: number
}

interface MembershipTypeData {
  type: string
  count: number
  percentage: number
  color: string
}

interface MembershipChartProps {
  data?: MembershipData[]
  typeData?: MembershipTypeData[]
  chartType?: "area" | "pie"
}

const mockData: MembershipData[] = [
  { month: "Jan", active: 450, new: 45, cancelled: 12, total: 450 },
  { month: "Feb", active: 483, new: 38, cancelled: 5, total: 483 },
  { month: "Mar", active: 512, new: 42, cancelled: 13, total: 512 },
  { month: "Apr", active: 548, new: 51, cancelled: 15, total: 548 },
  { month: "May", active: 572, new: 35, cancelled: 11, total: 572 },
  { month: "Jun", active: 601, new: 47, cancelled: 18, total: 601 },
  { month: "Jul", active: 628, new: 39, cancelled: 12, total: 628 },
  { month: "Aug", active: 655, new: 43, cancelled: 16, total: 655 },
  { month: "Sep", active: 682, new: 38, cancelled: 11, total: 682 },
  { month: "Oct", active: 708, new: 41, cancelled: 15, total: 708 },
  { month: "Nov", active: 735, new: 44, cancelled: 17, total: 735 },
  { month: "Dec", active: 758, new: 36, cancelled: 13, total: 758 },
]

const mockTypeData: MembershipTypeData[] = [
  { type: "Basic", count: 320, percentage: 42.2, color: "#8884d8" },
  { type: "Premium", count: 285, percentage: 37.6, color: "#82ca9d" },
  { type: "VIP", count: 153, percentage: 20.2, color: "#ffc658" },
]

export function MembershipChart({
  data = mockData,
  typeData = mockTypeData,
  chartType = "area",
}: MembershipChartProps) {
  const totalMembers = data[data.length - 1]?.total || 0
  const monthlyGrowth =
    data.length > 1
      ? ((data[data.length - 1].total - data[data.length - 2].total) / data[data.length - 2].total) * 100
      : 0

  const chartConfig = {
    active: {
      label: "Active Members",
      color: "hsl(var(--chart-1))",
    },
    new: {
      label: "New Members",
      color: "hsl(var(--chart-2))",
    },
    cancelled: {
      label: "Cancelled",
      color: "hsl(var(--chart-3))",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membership Analytics</CardTitle>
        <CardDescription>Member growth trends and membership type distribution</CardDescription>
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Members: </span>
            <span className="font-semibold">{totalMembers.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Monthly Growth: </span>
            <span className={`font-semibold ${monthlyGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
              {monthlyGrowth >= 0 ? "+" : ""}
              {monthlyGrowth.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartType === "area" ? (
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="active"
                  stackId="1"
                  stroke="var(--color-active)"
                  fill="var(--color-active)"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="new"
                  stackId="2"
                  stroke="var(--color-new)"
                  fill="var(--color-new)"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="space-y-3">
              <h4 className="font-medium">Membership Types</h4>
              {typeData.map((type) => (
                <div key={type.type} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: type.color }} />
                    <span className="text-sm">{type.type}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{type.count}</div>
                    <div className="text-xs text-muted-foreground">{type.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
