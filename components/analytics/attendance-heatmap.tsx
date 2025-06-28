"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const heatmapData = [
  { day: "Mon", hours: [2, 5, 8, 12, 15, 18, 22, 25, 20, 15, 10, 5] },
  { day: "Tue", hours: [3, 6, 9, 14, 17, 20, 24, 27, 22, 16, 11, 6] },
  { day: "Wed", hours: [4, 7, 10, 15, 18, 21, 25, 28, 23, 17, 12, 7] },
  { day: "Thu", hours: [3, 6, 9, 13, 16, 19, 23, 26, 21, 15, 10, 5] },
  { day: "Fri", hours: [5, 8, 11, 16, 19, 22, 26, 29, 24, 18, 13, 8] },
  { day: "Sat", hours: [8, 12, 15, 20, 23, 26, 30, 32, 28, 22, 16, 10] },
  { day: "Sun", hours: [6, 10, 13, 18, 21, 24, 28, 30, 26, 20, 14, 9] },
]

const timeLabels = ["6AM", "7AM", "8AM", "9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM"]

export function AttendanceHeatmap() {
  const maxValue = Math.max(...heatmapData.flatMap((d) => d.hours))

  const getIntensity = (value: number) => {
    const intensity = value / maxValue
    if (intensity > 0.8) return "bg-blue-600"
    if (intensity > 0.6) return "bg-blue-500"
    if (intensity > 0.4) return "bg-blue-400"
    if (intensity > 0.2) return "bg-blue-300"
    return "bg-blue-100"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-13 gap-1 text-xs">
            <div></div>
            {timeLabels.map((time) => (
              <div key={time} className="text-center text-gray-500">
                {time}
              </div>
            ))}
          </div>
          {heatmapData.map((dayData) => (
            <div key={dayData.day} className="grid grid-cols-13 gap-1">
              <div className="text-xs text-gray-500 flex items-center">{dayData.day}</div>
              {dayData.hours.map((value, index) => (
                <div
                  key={index}
                  className={`h-6 rounded ${getIntensity(value)} flex items-center justify-center text-xs text-white font-medium`}
                  title={`${dayData.day} ${timeLabels[index]}: ${value} visits`}
                >
                  {value > 15 ? value : ""}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
          <span>Less</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-blue-100 rounded"></div>
            <div className="w-3 h-3 bg-blue-300 rounded"></div>
            <div className="w-3 h-3 bg-blue-400 rounded"></div>
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  )
}
