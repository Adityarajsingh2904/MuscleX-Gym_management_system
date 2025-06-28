"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

const retentionData = [
  { month: "Month 1", rate: 100 },
  { month: "Month 2", rate: 85 },
  { month: "Month 3", rate: 75 },
  { month: "Month 6", rate: 65 },
  { month: "Month 12", rate: 55 },
  { month: "Month 18", rate: 50 },
  { month: "Month 24", rate: 45 },
]

export function RetentionAnalysis() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Member Retention</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            rate: {
              label: "Retention Rate %",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={retentionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="var(--color-rate)"
                strokeWidth={2}
                dot={{ fill: "var(--color-rate)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
