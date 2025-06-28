"use client"
import { useState } from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/currency"
import { Badge } from "@/components/ui/badge"

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

interface PaymentAnalyticsData {
  totalAmount: number
  totalCount: number
  payments: any[]
  paymentsByMonth: any
  paymentsByPlan: any
  paymentsByFranchise: any
  averagePayment: number
}

interface PaymentAnalyticsProps {
  data: PaymentAnalyticsData | undefined | null
  dateRange: any
  onDateRangeChange: (range: any) => void
  selectedFranchise: string
  franchises: any[]
}

export function PaymentAnalytics({
  data,
  dateRange,
  onDateRangeChange,
  selectedFranchise,
  franchises,
}: PaymentAnalyticsProps) {
  const [chartType, setChartType] = useState("trend")
  const [groupBy, setGroupBy] = useState("month")

  // Add fallback data
  const safeData = data || {
    totalAmount: 0,
    totalCount: 0,
    payments: [],
    paymentsByMonth: {},
    paymentsByPlan: {},
    paymentsByFranchise: {},
    averagePayment: 0,
  }

  // Prepare monthly trend data with fallback
  const monthlyData =
    Object.keys(safeData.paymentsByMonth || {}).length > 0
      ? Object.keys(safeData.paymentsByMonth).map((month) => ({
          month,
          amount: safeData.paymentsByMonth[month],
          count:
            safeData.payments?.filter((p: any) => {
              const paymentMonth = new Date(p.paid_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
              return paymentMonth === month
            }).length || 0,
        }))
      : [{ month: "No Data", amount: 0, count: 0 }]

  // Prepare plan-wise data
  const planData = Object.keys(safeData.paymentsByPlan || {}).map((plan) => ({
    name: plan,
    value: safeData.paymentsByPlan[plan],
    count: safeData.payments?.filter((p: any) => p.plan?.name === plan).length || 0,
  }))

  // Prepare franchise-wise data
  const franchiseData = Object.keys(safeData.paymentsByFranchise || {}).map((franchise) => ({
    name: franchise,
    value: safeData.paymentsByFranchise[franchise],
    count: safeData.payments?.filter((p: any) => p.franchiseName === franchise).length || 0,
  }))

  // Prepare payment method data
  const paymentMethodData =
    safeData.payments?.reduce((acc: any, payment: any) => {
      const method = payment.payment_method?.name || "Unknown"
      acc[method] = (acc[method] || 0) + payment.amount
      return acc
    }, {}) || {}

  const methodData = Object.keys(paymentMethodData).map((method) => ({
    name: method,
    value: paymentMethodData[method],
  }))

  // Prepare daily data for detailed view
  const dailyData =
    safeData.payments?.reduce((acc: any, payment: any) => {
      const date = new Date(payment.paid_at).toLocaleDateString()
      acc[date] = (acc[date] || 0) + payment.amount
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
            <SelectItem value="distribution">Distribution</SelectItem>
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
            <SelectItem value="plan">By Plan</SelectItem>
            <SelectItem value="franchise">By Franchise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(safeData?.totalAmount || 0)}</p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{safeData?.totalCount || 0}</p>
              <p className="text-sm text-gray-600">Total Payments</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(safeData?.averagePayment || 0)}</p>
              <p className="text-sm text-gray-600">Average Payment</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{planData.length}</p>
              <p className="text-sm text-gray-600">Active Plans</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts based on selected type */}
      {chartType === "trend" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
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
              <CardTitle>Payment Count Trend</CardTitle>
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
              <CardTitle>Revenue by Plan</CardTitle>
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
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={methodData}>
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
              <CardTitle>Revenue by Franchise</CardTitle>
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
              <CardTitle>Franchise Performance</CardTitle>
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
                      <div className="text-sm text-gray-500">{franchise.count} payments</div>
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
              <CardTitle>Daily Revenue (Last 30 Days)</CardTitle>
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

          {/* Top Plans Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {planData.slice(0, 5).map((plan, index) => (
                  <div key={plan.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="font-medium">{plan.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(plan.value)}</div>
                      <div className="text-sm text-gray-500">{plan.count} payments</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Member</th>
                  <th className="text-left p-2">Franchise</th>
                  <th className="text-left p-2">Plan</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Method</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {safeData?.payments?.slice(0, 10).map((payment: any) => (
                  <tr key={payment.id} className="border-b">
                    <td className="p-2">{new Date(payment.paid_at).toLocaleDateString()}</td>
                    <td className="p-2">{payment.member?.name}</td>
                    <td className="p-2">{payment.franchiseName || "Unknown"}</td>
                    <td className="p-2">{payment.plan?.name || "N/A"}</td>
                    <td className="p-2 font-medium">{formatCurrency(payment.final_amount)}</td>
                    <td className="p-2">{payment.payment_method?.name || "N/A"}</td>
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

export default PaymentAnalytics
