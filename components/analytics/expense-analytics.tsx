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
import { formatCurrency } from "@/lib/currency"

interface ExpenseAnalyticsProps {
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

export function ExpenseAnalytics({
  data,
  dateRange,
  onDateRangeChange,
  selectedFranchise,
  franchises,
}: ExpenseAnalyticsProps) {
  const [chartType, setChartType] = useState("trend")
  const [groupBy, setGroupBy] = useState("month")

  // Add fallback data
  const safeData = data || {
    totalAmount: 0,
    totalCount: 0,
    expenses: [],
    expensesByMonth: {},
    expensesByCategory: {},
    expensesByFranchise: {},
    averageExpense: 0,
  }

  // Helper function to get the date from an expense
  const getExpenseDate = (expense: any) => {
    return expense.created_at || expense.date || expense.expense_date || expense.transaction_date
  }

  // Prepare monthly trend data with fallback
  const monthlyData =
    Object.keys(safeData.expensesByMonth || {}).length > 0
      ? Object.keys(safeData.expensesByMonth).map((month) => ({
          month,
          amount: safeData.expensesByMonth[month],
          count:
            safeData.expenses?.filter((e: any) => {
              const expenseDate = getExpenseDate(e)
              const expenseMonth = new Date(expenseDate).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })
              return expenseMonth === month
            }).length || 0,
        }))
      : [{ month: "No Data", amount: 0, count: 0 }]

  // Prepare category-wise data
  const categoryData = Object.keys(safeData.expensesByCategory || {}).map((category) => ({
    name: category,
    value: safeData.expensesByCategory[category],
    count: safeData.expenses?.filter((e: any) => e.category === category).length || 0,
  }))

  // Prepare franchise-wise data
  const franchiseData = Object.keys(safeData.expensesByFranchise || {}).map((franchise) => ({
    name: franchise,
    value: safeData.expensesByFranchise[franchise],
    count: safeData.expenses?.filter((e: any) => e.subaccount?.name === franchise).length || 0,
  }))

  // Prepare daily data for detailed view
  const dailyData =
    safeData.expenses?.reduce((acc: any, expense: any) => {
      const expenseDate = getExpenseDate(expense)
      const date = new Date(expenseDate).toLocaleDateString()
      acc[date] = (acc[date] || 0) + expense.amount
      return acc
    }, {}) || {}

  const dailyChartData = Object.keys(dailyData)
    .slice(-30)
    .map((date) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      amount: dailyData[date],
    }))

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center space-x-4">
        <Select value={chartType} onValueChange={setChartType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Chart Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trend">Trend Analysis</SelectItem>
            <SelectItem value="distribution">Category Distribution</SelectItem>
            <SelectItem value="franchise">Franchise Analysis</SelectItem>
            <SelectItem value="detailed">Detailed View</SelectItem>
          </SelectContent>
        </Select>

        <Select value={groupBy} onValueChange={setGroupBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Group By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Monthly</SelectItem>
            <SelectItem value="week">Weekly</SelectItem>
            <SelectItem value="day">Daily</SelectItem>
            <SelectItem value="category">By Category</SelectItem>
            <SelectItem value="franchise">By Franchise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Expense Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{formatCurrency(safeData?.totalAmount || 0)}</p>
              <p className="text-sm text-gray-600">Total Expenses</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{safeData?.totalCount || 0}</p>
              <p className="text-sm text-gray-600">Total Transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(safeData?.averageExpense || 0)}</p>
              <p className="text-sm text-gray-600">Average Expense</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{categoryData.length}</p>
              <p className="text-sm text-gray-600">Categories</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts based on selected type */}
      {chartType === "trend" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Expense Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  amount: {
                    label: "Amount",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="var(--color-amount)"
                      strokeWidth={2}
                      dot={{ fill: "var(--color-amount)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction Count Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: "Count",
                    color: "hsl(var(--chart-2))",
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
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
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
              <CardTitle>Top Expense Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
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
              <CardTitle>Expenses by Franchise</CardTitle>
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
              <CardTitle>Franchise Expense Breakdown</CardTitle>
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
                      <div className="font-bold">{formatCurrency(franchise.value)}</div>
                      <div className="text-sm text-gray-500">{franchise.count} expenses</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {chartType === "detailed" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Expenses (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  amount: {
                    label: "Daily Amount",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="amount" fill="var(--color-amount)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Top Categories Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryData.slice(0, 5).map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(category.value)}</div>
                      <div className="text-sm text-gray-500">{category.count} expenses</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2">Franchise</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {safeData?.expenses?.slice(0, 10).map((expense: any) => (
                  <tr key={expense.id} className="border-b">
                    <td className="p-2">{new Date(getExpenseDate(expense)).toLocaleDateString()}</td>
                    <td className="p-2">{expense.description}</td>
                    <td className="p-2">{expense.subaccount?.name || "Unknown"}</td>
                    <td className="p-2">{expense.category}</td>
                    <td className="p-2 font-medium">{formatCurrency(expense.amount)}</td>
                    <td className="p-2">
                      <Badge className="bg-green-100 text-green-800">Completed</Badge>
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
