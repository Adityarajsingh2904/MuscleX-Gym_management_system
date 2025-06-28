"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

const membershipData = [
  { month: "Jan", new: 15, cancelled: 3 },
  { month: "Feb", new: 22, cancelled: 5 },
  { month: "Mar", new: 18, cancelled: 2 },
  { month: "Apr", new: 25, cancelled: 4 },
  { month: "May", new: 28, cancelled: 6 },
  { month: "Jun", new: 32, cancelled: 3 },
]

export function MembershipChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Membership Growth</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            new: {
              label: "New Members",
              color: "hsl(var(--chart-1))",
            },
            cancelled: {
              label: "Cancelled",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={membershipData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="new" fill="var(--color-new)" />
              <Bar dataKey="cancelled" fill="var(--color-cancelled)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
