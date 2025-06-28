"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Clock, Users, MapPin, Calendar } from "lucide-react"
import type { ScheduleEvent } from "@/types/gym"

interface ScheduleCalendarProps {
  events: ScheduleEvent[]
  currentDate: Date
  viewMode: "week" | "month"
  onEventClick: (event: ScheduleEvent) => void
}

export function ScheduleCalendar({ events, currentDate, viewMode, onEventClick }: ScheduleCalendarProps) {
  const getWeekDays = () => {
    const start = new Date(currentDate)
    start.setDate(start.getDate() - start.getDay()) // Start from Sunday

    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      days.push(day)
    }
    return days
  }

  const getEventsForDay = (date: Date) => {
    const dateStr = date.toDateString()
    return events.filter((event) => new Date(event.startTime).toDateString() === dateStr)
  }

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case "class":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "personal_training":
        return "bg-green-100 text-green-800 border-green-200"
      case "maintenance":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "event":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (viewMode === "week") {
    const weekDays = getWeekDays()

    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((day, index) => {
              const dayEvents = getEventsForDay(day)
              const isToday = day.toDateString() === new Date().toDateString()

              return (
                <div key={index} className="min-h-[400px]">
                  <div
                    className={`text-center p-2 rounded-lg mb-3 ${
                      isToday ? "bg-teal-100 text-teal-800" : "bg-gray-50"
                    }`}
                  >
                    <div className="text-sm font-medium">{day.toLocaleDateString([], { weekday: "short" })}</div>
                    <div className={`text-lg font-bold ${isToday ? "text-teal-600" : ""}`}>{day.getDate()}</div>
                  </div>

                  <div className="space-y-2">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className={`p-2 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${getEventColor(event.type)}`}
                      >
                        <div className="font-medium text-xs mb-1">{event.title}</div>
                        <div className="flex items-center space-x-1 text-xs opacity-75">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(event.startTime)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs opacity-75 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{event.room}</span>
                        </div>
                        {event.type === "class" && (
                          <div className="flex items-center space-x-1 text-xs opacity-75 mt-1">
                            <Users className="h-3 w-3" />
                            <span>
                              {event.enrolled}/{event.capacity}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Month view - simplified grid
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center py-12 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Month view coming soon</p>
          <p className="text-sm">Switch to week view to see detailed schedule</p>
        </div>
      </CardContent>
    </Card>
  )
}
