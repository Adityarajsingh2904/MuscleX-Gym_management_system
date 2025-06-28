"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AttendanceData {
  day: string
  hour: number
  count: number
  intensity: number
}

interface AttendanceHeatmapProps {
  data?: AttendanceData[]
  maxCount?: number
}

const mockData: AttendanceData[] = [
  // Monday
  { day: "Mon", hour: 6, count: 15, intensity: 0.3 },
  { day: "Mon", hour: 7, count: 25, intensity: 0.5 },
  { day: "Mon", hour: 8, count: 35, intensity: 0.7 },
  { day: "Mon", hour: 9, count: 45, intensity: 0.9 },
  { day: "Mon", hour: 10, count: 30, intensity: 0.6 },
  { day: "Mon", hour: 17, count: 40, intensity: 0.8 },
  { day: "Mon", hour: 18, count: 50, intensity: 1.0 },
  { day: "Mon", hour: 19, count: 42, intensity: 0.84 },

  // Tuesday
  { day: "Tue", hour: 6, count: 18, intensity: 0.36 },
  { day: "Tue", hour: 7, count: 28, intensity: 0.56 },
  { day: "Tue", hour: 8, count: 32, intensity: 0.64 },
  { day: "Tue", hour: 9, count: 38, intensity: 0.76 },
  { day: "Tue", hour: 10, count: 25, intensity: 0.5 },
  { day: "Tue", hour: 17, count: 35, intensity: 0.7 },
  { day: "Tue", hour: 18, count: 48, intensity: 0.96 },
  { day: "Tue", hour: 19, count: 45, intensity: 0.9 },

  // Wednesday
  { day: "Wed", hour: 6, count: 20, intensity: 0.4 },
  { day: "Wed", hour: 7, count: 30, intensity: 0.6 },
  { day: "Wed", hour: 8, count: 38, intensity: 0.76 },
  { day: "Wed", hour: 9, count: 42, intensity: 0.84 },
  { day: "Wed", hour: 10, count: 28, intensity: 0.56 },
  { day: "Wed", hour: 17, count: 38, intensity: 0.76 },
  { day: "Wed", hour: 18, count: 46, intensity: 0.92 },
  { day: "Wed", hour: 19, count: 40, intensity: 0.8 },

  // Thursday
  { day: "Thu", hour: 6, count: 16, intensity: 0.32 },
  { day: "Thu", hour: 7, count: 26, intensity: 0.52 },
  { day: "Thu", hour: 8, count: 34, intensity: 0.68 },
  { day: "Thu", hour: 9, count: 40, intensity: 0.8 },
  { day: "Thu", hour: 10, count: 32, intensity: 0.64 },
  { day: "Thu", hour: 17, count: 36, intensity: 0.72 },
  { day: "Thu", hour: 18, count: 44, intensity: 0.88 },
  { day: "Thu", hour: 19, count: 38, intensity: 0.76 },

  // Friday
  { day: "Fri", hour: 6, count: 22, intensity: 0.44 },
  { day: "Fri", hour: 7, count: 32, intensity: 0.64 },
  { day: "Fri", hour: 8, count: 40, intensity: 0.8 },
  { day: "Fri", hour: 9, count: 35, intensity: 0.7 },
  { day: "Fri", hour: 10, count: 30, intensity: 0.6 },
  { day: "Fri", hour: 17, count: 42, intensity: 0.84 },
  { day: "Fri", hour: 18, count: 48, intensity: 0.96 },
  { day: "Fri", hour: 19, count: 45, intensity: 0.9 },

  // Saturday
  { day: "Sat", hour: 8, count: 35, intensity: 0.7 },
  { day: "Sat", hour: 9, count: 45, intensity: 0.9 },
  { day: "Sat", hour: 10, count: 50, intensity: 1.0 },
  { day: "Sat", hour: 11, count: 48, intensity: 0.96 },
  { day: "Sat", hour: 14, count: 30, intensity: 0.6 },
  { day: "Sat", hour: 15, count: 35, intensity: 0.7 },
  { day: "Sat", hour: 16, count: 32, intensity: 0.64 },

  // Sunday
  { day: "Sun", hour: 9, count: 25, intensity: 0.5 },
  { day: "Sun", hour: 10, count: 35, intensity: 0.7 },
  { day: "Sun", hour: 11, count: 40, intensity: 0.8 },
  { day: "Sun", hour: 14, count: 28, intensity: 0.56 },
  { day: "Sun", hour: 15, count: 32, intensity: 0.64 },
  { day: "Sun", hour: 16, count: 30, intensity: 0.6 },
]

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const hours = Array.from({ length: 16 }, (_, i) => i + 6) // 6 AM to 9 PM

export function AttendanceHeatmap({ data = mockData, maxCount = 50 }: AttendanceHeatmapProps) {
  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return "bg-gray-100"
    if (intensity <= 0.2) return "bg-blue-100"
    if (intensity <= 0.4) return "bg-blue-200"
    if (intensity <= 0.6) return "bg-blue-300"
    if (intensity <= 0.8) return "bg-blue-400"
    return "bg-blue-500"
  }

  const getDataForDayHour = (day: string, hour: number) => {
    return data.find((d) => d.day === day && d.hour === hour)
  }

  const totalAttendance = data.reduce((sum, item) => sum + item.count, 0)
  const peakHour = data.reduce((max, item) => (item.count > max.count ? item : max), data[0])
  const averageDaily = totalAttendance / 7

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Heatmap</CardTitle>
        <CardDescription>Gym attendance patterns by day and hour</CardDescription>
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Peak Time: </span>
            <span className="font-semibold">
              {peakHour?.day} {peakHour?.hour}:00 ({peakHour?.count} members)
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Daily Average: </span>
            <span className="font-semibold">{averageDaily.toFixed(0)} members</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Heatmap Grid */}
          <div className="grid grid-cols-8 gap-1 text-xs">
            {/* Header row */}
            <div></div>
            {days.map((day) => (
              <div key={day} className="text-center font-medium p-2">
                {day}
              </div>
            ))}

            {/* Data rows */}
            {hours.map((hour) => (
              <>
                <div key={hour} className="text-right pr-2 py-1 text-muted-foreground">
                  {hour}:00
                </div>
                {days.map((day) => {
                  const cellData = getDataForDayHour(day, hour)
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className={`aspect-square rounded ${getIntensityColor(cellData?.intensity || 0)} 
                        border border-gray-200 flex items-center justify-center cursor-pointer
                        hover:ring-2 hover:ring-blue-300 transition-all`}
                      title={cellData ? `${day} ${hour}:00 - ${cellData.count} members` : "No data"}
                    >
                      {cellData && cellData.count > 0 && <span className="text-xs font-medium">{cellData.count}</span>}
                    </div>
                  )
                })}
              </>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs">
              <span>Less</span>
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
                <div className="w-3 h-3 bg-blue-100 border border-gray-200 rounded"></div>
                <div className="w-3 h-3 bg-blue-200 border border-gray-200 rounded"></div>
                <div className="w-3 h-3 bg-blue-300 border border-gray-200 rounded"></div>
                <div className="w-3 h-3 bg-blue-400 border border-gray-200 rounded"></div>
                <div className="w-3 h-3 bg-blue-500 border border-gray-200 rounded"></div>
              </div>
              <span>More</span>
            </div>

            {/* Peak times badges */}
            <div className="flex gap-2">
              <Badge variant="secondary">Morning Peak: 9-10 AM</Badge>
              <Badge variant="secondary">Evening Peak: 6-7 PM</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
