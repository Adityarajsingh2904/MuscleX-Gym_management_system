"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

const classData = [
  { name: "HIIT", attendance: 95, capacity: 100 },
  { name: "Yoga", attendance: 87, capacity: 100 },
  { name: "Zumba", attendance: 82, capacity: 100 },
  { name: "Pilates", attendance: 78, capacity: 100 },
  { name: "Boxing", attendance: 75, capacity: 100 },
  { name: "Spin", attendance: 72, capacity: 100 },
  { name: "CrossFit", attendance: 68, capacity: 100 },
  { name: "Dance", attendance: 65, capacity: 100 },
]

export function ClassPopularity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Class Popularity</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            attendance: {
              label: "Attendance %",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={80} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="attendance" fill="var(--color-attendance)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
