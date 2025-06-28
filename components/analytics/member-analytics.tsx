"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import { Badge } from "@/components/ui/badge"

interface MemberAnalyticsProps {
  data: any
  dateRange: any
  onDateRangeChange: (range: any) => void
  selectedFranchise: string
  franchises: any[]
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FF6B6B",
  "#6BCB77",
  "#4D96FF",
  "#9D4EDD",
]

export function MemberAnalytics({
  data,
  dateRange,
  onDateRangeChange,
  selectedFranchise,
  franchises,
}: MemberAnalyticsProps) {
  const [chartType, setChartType] = useState("growth")
  const [groupBy, setGroupBy] = useState("month")

  // Add fallback data
  const safeData = data || {
    totalMembers: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    newMembers: 0,
    churnRate: 0,
    members: [],
    membersByPlan: {},
    membersByMonth: {},
    membersByFranchise: {},
  }

  // Prepare monthly trend data with fallback
  const monthlyData =
    Object.keys(safeData.membersByMonth || {}).length > 0
      ? Object.keys(safeData.membersByMonth).map((month) => ({
          month,
          count: safeData.membersByMonth[month],
        }))
      : [{ month: "No Data", count: 0 }]

  // Prepare plan-wise data
  const planData = Object.keys(safeData.membersByPlan || {}).map((plan) => ({
    name: plan,
    value: safeData.membersByPlan[plan],
  }))

  // Prepare franchise-wise data
  const franchiseData = Object.keys(safeData.membersByFranchise || {}).map((franchise) => ({
    name: franchise,
    value: safeData.membersByFranchise[franchise],
  }))

  // Prepare gender distribution data
  const genderData = safeData.members
    ? [
        {
          name: "Male",
          value: safeData.members.filter((m: any) => m.gender === "male").length,
        },
        {
          name: "Female",
          value: safeData.members.filter((m: any) => m.gender === "female").length,
        },
        {
          name: "Other",
          value: safeData.members.filter((m: any) => m.gender && m.gender !== "male" && m.gender !== "female").length,
        },
        {
          name: "Not Specified",
          value: safeData.members.filter((m: any) => !m.gender).length,
        },
      ]
    : []

  // Calculate cumulative growth data
  const cumulativeGrowthData = monthlyData.reduce((acc: any[], current, index) => {
    const prevCount = index > 0 ? acc[index - 1].cumulativeCount : 0
    return [
      ...acc,
      {
        month: current.month,
        newMembers: current.count,
        cumulativeCount: prevCount + current.count,
      },
    ]
  }, [] as any[])

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center space-x-4">
        <Select value={chartType} onValueChange={setChartType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Chart Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="growth">Growth Analysis</SelectItem>
            <SelectItem value="distribution">Member Distribution</SelectItem>
            <SelectItem value="franchise">Franchise Analysis</SelectItem>
            <SelectItem value="demographics">Demographics</SelectItem>
          </SelectContent>
        </Select>

        <Select value={groupBy} onValueChange={setGroupBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Group By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Monthly</SelectItem>
            <SelectItem value="plan">By Plan</SelectItem>
            <SelectItem value="status">By Status</SelectItem>
            <SelectItem value="franchise">By Franchise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Member Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{safeData?.totalMembers || 0}</p>
              <p className="text-sm text-gray-600">Total Members</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{safeData?.activeMembers || 0}</p>
              <p className="text-sm text-gray-600">Active Members</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{safeData?.newMembers || 0}</p>
              <p className="text-sm text-gray-600">New Members</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{safeData?.churnRate?.toFixed(1) || "0"}%</p>
              <p className="text-sm text-gray-600">Churn Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts based on selected type */}
      {chartType === "growth" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Member Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  newMembers: {
                    label: "New Members",
                    color: "hsl(var(--chart-1))",
                  },
                  cumulativeCount: {
                    label: "Total Members",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cumulativeGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="cumulativeCount"
                      stroke="var(--color-cumulativeCount)"
                      strokeWidth={2}
                      dot={{ fill: "var(--color-cumulativeCount)" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="newMembers"
                      stroke="var(--color-newMembers)"
                      strokeWidth={2}
                      dot={{ fill: "var(--color-newMembers)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: "New Members",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {chartType === "distribution" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Members by Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {planData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active vs Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Active", value: safeData.activeMembers },
                        { name: "Inactive", value: safeData.inactiveMembers },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#4ade80" />
                      <Cell fill="#f87171" />
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {chartType === "franchise" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Members by Franchise</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={franchiseData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {franchiseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Franchise Member Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {franchiseData.slice(0, 5).map((franchise, index) => (
                  <div key={franchise.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="font-medium">{franchise.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{franchise.value} members</div>
                      <div className="text-sm text-gray-500">
                        {((franchise.value / safeData.totalMembers) * 100).toFixed(1)}% of total
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {chartType === "demographics" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Gender Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#ec4899" />
                      <Cell fill="#8b5cf6" />
                      <Cell fill="#9ca3af" />
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Age Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: "Members",
                    color: "hsl(var(--chart-4))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        age: "18-24",
                        count: safeData.members?.filter((m: any) => m.age >= 18 && m.age <= 24).length || 0,
                      },
                      {
                        age: "25-34",
                        count: safeData.members?.filter((m: any) => m.age >= 25 && m.age <= 34).length || 0,
                      },
                      {
                        age: "35-44",
                        count: safeData.members?.filter((m: any) => m.age >= 35 && m.age <= 44).length || 0,
                      },
                      {
                        age: "45-54",
                        count: safeData.members?.filter((m: any) => m.age >= 45 && m.age <= 54).length || 0,
                      },
                      { age: "55+", count: safeData.members?.filter((m: any) => m.age >= 55).length || 0 },
                      { age: "Unknown", count: safeData.members?.filter((m: any) => !m.age).length || 0 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Franchise</th>
                  <th className="text-left p-2">Join Date</th>
                  <th className="text-left p-2">Plan</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {safeData?.members?.slice(0, 10).map((member: any) => (
                  <tr key={member.id} className="border-b">
                    <td className="p-2">{member.name}</td>
                    <td className="p-2">{member.subaccount?.name || "Unknown"}</td>
                    <td className="p-2">{new Date(member.join_date).toLocaleDateString()}</td>
                    <td className="p-2">{member.plan?.name || "No Plan"}</td>
                    <td className="p-2">
                      {member.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
