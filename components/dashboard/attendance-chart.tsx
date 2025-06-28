"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AttendanceChart() {
  // Mock data for the chart
  const data = [
    { day: "Mon", checkins: 45 },
    { day: "Tue", checkins: 52 },
    { day: "Wed", checkins: 38 },
    { day: "Thu", checkins: 61 },
    { day: "Fri", checkins: 55 },
    { day: "Sat", checkins: 67 },
    { day: "Sun", checkins: 43 },
  ]

  const maxCheckins = Math.max(...data.map((d) => d.checkins))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.day} className="flex items-center space-x-4">
              <div className="w-12 text-sm font-medium text-gray-600">{item.day}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-3 relative overflow-hidden">
                <div
                  className="bg-teal-500 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(item.checkins / maxCheckins) * 100}%` }}
                />
              </div>
              <div className="w-8 text-sm font-medium text-gray-900">{item.checkins}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
