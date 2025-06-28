"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

const peakHoursData = [
  { hour: "6AM", visits: 15 },
  { hour: "7AM", visits: 25 },
  { hour: "8AM", visits: 35 },
  { hour: "9AM", visits: 45 },
  { hour: "10AM", visits: 55 },
  { hour: "11AM", visits: 40 },
  { hour: "12PM", visits: 30 },
  { hour: "1PM", visits: 35 },
  { hour: "2PM", visits: 40 },
  { hour: "3PM", visits: 50 },
  { hour: "4PM", visits: 60 },
  { hour: "5PM", visits: 75 },
  { hour: "6PM", visits: 85 },
  { hour: "7PM", visits: 90 },
  { hour: "8PM", visits: 70 },
  { hour: "9PM", visits: 45 },
  { hour: "10PM", visits: 20 },
]

export function PeakHoursChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Peak Hours</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            visits: {
              label: "Visits",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={peakHoursData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="visits"
                stroke="var(--color-visits)"
                fill="var(--color-visits)"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
