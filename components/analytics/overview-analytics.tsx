"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { formatCurrency } from "@/lib/currency"

interface OverviewAnalyticsProps {
  data: any
  dateRange: any
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

export function OverviewAnalytics({ data, dateRange, selectedFranchise, franchises }: OverviewAnalyticsProps) {
  // Add fallback data
  const safeData = data || {
    payments: {
      totalAmount: 0,
      totalCount: 0,
      payments: [],
      paymentsByMonth: {},
      paymentsByPlan: {},
      paymentsByFranchise: {},
      averagePayment: 0,
    },
    expenses: {
      totalAmount: 0,
      totalCount: 0,
      expenses: [],
      expensesByMonth: {},
      expensesByCategory: {},
      expensesByFranchise: {},
      averageExpense: 0,
    },
    members: {
      totalMembers: 0,
      activeMembers: 0,
      inactiveMembers: 0,
      newMembers: 0,
      churnRate: 0,
      members: [],
      membersByPlan: {},
      membersByMonth: {},
      membersByFranchise: {},
    },
    overview: {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      totalMembers: 0,
      activeMembers: 0,
      newMembers: 0,
      churnRate: 0,
    },
  }

  // Prepare monthly revenue vs expenses data
  const monthlyRevenueData = safeData.payments?.paymentsByMonth || {}
  const monthlyExpenseData = safeData.expenses?.expensesByMonth || {}

  const allMonths = new Set([...Object.keys(monthlyRevenueData), ...Object.keys(monthlyExpenseData)])
  const monthlyComparisonData = Array.from(allMonths)
    .sort((a, b) => {
      const dateA = new Date(a)
      const dateB = new Date(b)
      return dateA.getTime() - dateB.getTime()
    })
    .map((month) => ({
      month,
      revenue: monthlyRevenueData[month] || 0,
      expenses: monthlyExpenseData[month] || 0,
      profit: (monthlyRevenueData[month] || 0) - (monthlyExpenseData[month] || 0),
    }))

  // Prepare franchise performance data
  const franchiseRevenueData = safeData.payments?.paymentsByFranchise || {}
  const franchiseExpenseData = safeData.expenses?.expensesByFranchise || {}
  const franchiseMemberData = safeData.members?.membersByFranchise || {}

  const franchisePerformanceData = Object.keys(franchiseRevenueData).map((franchise) => ({
    name: franchise,
    revenue: franchiseRevenueData[franchise] || 0,
    expenses: franchiseExpenseData[franchise] || 0,
    profit: (franchiseRevenueData[franchise] || 0) - (franchiseExpenseData[franchise] || 0),
    members: franchiseMemberData[franchise] || 0,
    profitMargin: franchiseRevenueData[franchise]
      ? ((franchiseRevenueData[franchise] - (franchiseExpenseData[franchise] || 0)) / franchiseRevenueData[franchise]) *
        100
      : 0,
  }))

  // Calculate KPIs
  const totalRevenue = safeData.overview?.totalRevenue || 0
  const totalExpenses = safeData.overview?.totalExpenses || 0
  const netProfit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
  const revenuePerMember = safeData.members?.totalMembers > 0 ? totalRevenue / safeData.members.totalMembers : 0
  const expensePerMember = safeData.members?.totalMembers > 0 ? totalExpenses / safeData.members.totalMembers : 0

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--chart-1))",
                },
                expenses: {
                  label: "Expenses",
                  color: "hsl(var(--chart-2))",
                },
                profit: {
                  label: "Profit",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-revenue)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="var(--color-expenses)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-expenses)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="var(--color-profit)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-profit)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Franchise Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--chart-1))",
                },
                expenses: {
                  label: "Expenses",
                  color: "hsl(var(--chart-2))",
                },
                profit: {
                  label: "Profit",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={franchisePerformanceData.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" />
                  <Bar dataKey="profit" fill="var(--color-profit)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Financial Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Profit Margin</span>
                <span className={`font-bold ${profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {profitMargin.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Revenue to Expense Ratio</span>
                <span className="font-bold text-blue-600">
                  {totalExpenses > 0 ? (totalRevenue / totalExpenses).toFixed(2) : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Net Profit</span>
                <span className={`font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(netProfit)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Member Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Revenue per Member</span>
                <span className="font-bold text-green-600">{formatCurrency(revenuePerMember)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Expense per Member</span>
                <span className="font-bold text-red-600">{formatCurrency(expensePerMember)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Active Rate</span>
                <span className="font-bold text-blue-600">
                  {safeData.members?.totalMembers
                    ? ((safeData.members.activeMembers / safeData.members.totalMembers) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Top Performing Franchise</span>
                <span className="font-bold text-purple-600">
                  {franchisePerformanceData.sort((a, b) => b.profit - a.profit)[0]?.name || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Most Profitable Month</span>
                <span className="font-bold text-green-600">
                  {monthlyComparisonData.sort((a, b) => b.profit - a.profit)[0]?.month || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Highest Expense Month</span>
                <span className="font-bold text-red-600">
                  {monthlyComparisonData.sort((a, b) => b.expenses - a.expenses)[0]?.month || "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member Growth and Franchise Comparison */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Member Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                activeMembers: {
                  label: "Active Members",
                  color: "hsl(var(--chart-4))",
                },
                totalMembers: {
                  label: "Total Members",
                  color: "hsl(var(--chart-5))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    {
                      month: "Current",
                      activeMembers: safeData.members?.activeMembers || 0,
                      totalMembers: safeData.members?.totalMembers || 0,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="activeMembers"
                    stroke="var(--color-activeMembers)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-activeMembers)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalMembers"
                    stroke="var(--color-totalMembers)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-totalMembers)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Franchise Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={franchisePerformanceData
                    .slice(0, 5)
                    .map((f) => ({ name: f.name, profitMargin: Number.parseFloat(f.profitMargin.toFixed(1)) }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip />
                  <Bar dataKey="profitMargin" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Franchise Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Franchise Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Franchise</th>
                  <th className="text-left p-2">Revenue</th>
                  <th className="text-left p-2">Expenses</th>
                  <th className="text-left p-2">Profit</th>
                  <th className="text-left p-2">Members</th>
                  <th className="text-left p-2">Profit Margin</th>
                </tr>
              </thead>
              <tbody>
                {franchisePerformanceData.map((franchise) => (
                  <tr key={franchise.name} className="border-b">
                    <td className="p-2 font-medium">{franchise.name}</td>
                    <td className="p-2">{formatCurrency(franchise.revenue)}</td>
                    <td className="p-2">{formatCurrency(franchise.expenses)}</td>
                    <td className={`p-2 ${franchise.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(franchise.profit)}
                    </td>
                    <td className="p-2">{franchise.members}</td>
                    <td className={`p-2 ${franchise.profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {franchise.profitMargin.toFixed(1)}%
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
