"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Pie, PieChart, Cell, ResponsiveContainer, Legend } from "recharts"

const revenueBreakdownData = [
  { name: "Memberships", value: 65, amount: 29700 },
  { name: "Personal Training", value: 20, amount: 9140 },
  { name: "Classes", value: 10, amount: 4570 },
  { name: "Merchandise", value: 3, amount: 1371 },
  { name: "Other", value: 2, amount: 914 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function RevenueBreakdown() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            memberships: { label: "Memberships", color: COLORS[0] },
            training: { label: "Personal Training", color: COLORS[1] },
            classes: { label: "Classes", color: COLORS[2] },
            merchandise: { label: "Merchandise", color: COLORS[3] },
            other: { label: "Other", color: COLORS[4] },
          }}
          className="h-[400px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={revenueBreakdownData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {revenueBreakdownData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-white p-3 border rounded shadow">
                        <p className="font-semibold">{data.name}</p>
                        <p className="text-blue-600">
                          {data.value}% (${data.amount.toLocaleString()})
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {revenueBreakdownData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[index] }}></div>
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">${item.amount.toLocaleString()}</div>
                <div className="text-xs text-gray-500">{item.value}%</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
