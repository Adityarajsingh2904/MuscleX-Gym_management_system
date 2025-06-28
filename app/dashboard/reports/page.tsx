"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, BarChart3, Users, DollarSign, Calendar, TrendingUp, TrendingDown } from "lucide-react"
import { RevenueChart } from "@/components/reports/revenue-chart"
import { MembershipChart } from "@/components/reports/membership-chart"
import { AttendanceHeatmap } from "@/components/reports/attendance-heatmap"
import { TrainerPerformance } from "@/components/reports/trainer-performance"

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("30")
  const [reportType, setReportType] = useState("overview")

  const generateReport = () => {
    // Simulate report generation
    const reportData = {
      revenue: 15420,
      members: 234,
      attendance: 1876,
      classes: 45,
    }

    const csvContent = [
      "Metric,Value",
      `Revenue,$${reportData.revenue}`,
      `Members,${reportData.members}`,
      `Attendance,${reportData.attendance}`,
      `Classes,${reportData.classes}`,
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `gym-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into your gym performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <Button onClick={generateReport} className="bg-blue-600 hover:bg-blue-700">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <Card>
        <CardContent className="p-6">
          <div className="flex space-x-2">
            {[
              { id: "overview", label: "Overview" },
              { id: "revenue", label: "Revenue" },
              { id: "membership", label: "Membership" },
              { id: "attendance", label: "Attendance" },
              { id: "trainers", label: "Trainers" },
            ].map((type) => (
              <Button
                key={type.id}
                variant={reportType === type.id ? "default" : "outline"}
                onClick={() => setReportType(type.id)}
                className={reportType === type.id ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">$15,420</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm font-medium text-green-600">+12.5%</span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-green-100 text-green-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Members</p>
                <p className="text-2xl font-bold text-gray-900">234</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm font-medium text-green-600">+8.2%</span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Visits</p>
                <p className="text-2xl font-bold text-gray-900">1,876</p>
                <div className="flex items-center mt-2">
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-sm font-medium text-red-600">-3.1%</span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-purple-100 text-purple-600">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Classes Held</p>
                <p className="text-2xl font-bold text-gray-900">45</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm font-medium text-green-600">+15.4%</span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-orange-100 text-orange-600">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts based on selected report type */}
      {reportType === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueChart />
          <MembershipChart />
        </div>
      )}

      {reportType === "revenue" && (
        <div className="space-y-6">
          <RevenueChart />
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="font-medium">Membership Fees</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">$12,340</div>
                    <div className="text-sm text-gray-500">80.0%</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="font-medium">Personal Training</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">$2,180</div>
                    <div className="text-sm text-gray-500">14.1%</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span className="font-medium">Class Drop-ins</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">$900</div>
                    <div className="text-sm text-gray-500">5.9%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === "membership" && (
        <div className="space-y-6">
          <MembershipChart />
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Membership Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Active Members</span>
                    <Badge className="bg-green-100 text-green-800">189</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Expired Members</span>
                    <Badge className="bg-red-100 text-red-800">23</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>On Hold</span>
                    <Badge className="bg-yellow-100 text-yellow-800">12</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>New This Month</span>
                    <Badge className="bg-blue-100 text-blue-800">18</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Package Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Premium Package</span>
                    <Badge variant="outline">45%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Basic Package</span>
                    <Badge variant="outline">35%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>VIP Package</span>
                    <Badge variant="outline">15%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Student Package</span>
                    <Badge variant="outline">5%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {reportType === "attendance" && (
        <div className="space-y-6">
          <AttendanceHeatmap />
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Peak Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>6:00 AM - 8:00 AM</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-teal-500 h-2 rounded-full" style={{ width: "85%" }}></div>
                      </div>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>6:00 PM - 8:00 PM</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-teal-500 h-2 rounded-full" style={{ width: "92%" }}></div>
                      </div>
                      <span className="text-sm font-medium">92%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>12:00 PM - 2:00 PM</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-teal-500 h-2 rounded-full" style={{ width: "65%" }}></div>
                      </div>
                      <span className="text-sm font-medium">65%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Weekly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Monday</span>
                    <Badge className="bg-green-100 text-green-800">High</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tuesday</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Wednesday</span>
                    <Badge className="bg-green-100 text-green-800">High</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Thursday</span>
                    <Badge className="bg-green-100 text-green-800">High</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Friday</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Saturday</span>
                    <Badge className="bg-red-100 text-red-800">Low</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sunday</span>
                    <Badge className="bg-red-100 text-red-800">Low</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {reportType === "trainers" && (
        <div className="space-y-6">
          <TrainerPerformance />
        </div>
      )}
    </div>
  )
}
