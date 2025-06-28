"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Clock, Users, MapPin } from "lucide-react"

interface ClassEvent {
  id: string
  name: string
  instructor: string
  time: string
  duration: number
  capacity: number
  enrolled: number
  room: string
  type: string
  color: string
}

interface ClassScheduleCalendarProps {
  classes?: ClassEvent[]
  onClassClick?: (classEvent: ClassEvent) => void
}

const mockClasses: ClassEvent[] = [
  {
    id: "1",
    name: "Morning Yoga",
    instructor: "Sarah Johnson",
    time: "07:00",
    duration: 60,
    capacity: 20,
    enrolled: 15,
    room: "Studio A",
    type: "yoga",
    color: "bg-green-500",
  },
  {
    id: "2",
    name: "HIIT Cardio",
    instructor: "Mike Chen",
    time: "09:00",
    duration: 45,
    capacity: 25,
    enrolled: 22,
    room: "Main Floor",
    type: "cardio",
    color: "bg-red-500",
  },
  {
    id: "3",
    name: "Strength Training",
    instructor: "David Wilson",
    time: "11:00",
    duration: 75,
    capacity: 15,
    enrolled: 12,
    room: "Weight Room",
    type: "strength",
    color: "bg-blue-500",
  },
  {
    id: "4",
    name: "Pilates",
    instructor: "Emma Davis",
    time: "14:00",
    duration: 60,
    capacity: 18,
    enrolled: 16,
    room: "Studio B",
    type: "pilates",
    color: "bg-purple-500",
  },
  {
    id: "5",
    name: "Evening Yoga",
    instructor: "Sarah Johnson",
    time: "18:00",
    duration: 60,
    capacity: 20,
    enrolled: 18,
    room: "Studio A",
    type: "yoga",
    color: "bg-green-500",
  },
]

const timeSlots = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
]

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function ClassScheduleCalendar({ classes = mockClasses, onClassClick }: ClassScheduleCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(0)

  const getClassesForTimeSlot = (day: number, time: string) => {
    return classes.filter((cls) => cls.time === time)
  }

  const getStatusColor = (enrolled: number, capacity: number) => {
    const percentage = (enrolled / capacity) * 100
    if (percentage >= 90) return "bg-red-100 text-red-800"
    if (percentage >= 70) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Class Schedule</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentWeek(currentWeek - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">This Week</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentWeek(currentWeek + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-8 gap-2">
          {/* Header */}
          <div className="font-medium text-sm text-muted-foreground p-2">Time</div>
          {weekDays.map((day) => (
            <div key={day} className="font-medium text-sm text-center p-2">
              {day}
            </div>
          ))}

          {/* Time slots */}
          {timeSlots.map((time) => (
            <>
              <div key={time} className="text-sm text-muted-foreground p-2 border-r">
                {time}
              </div>
              {weekDays.map((day, dayIndex) => {
                const dayClasses = getClassesForTimeSlot(dayIndex, time)
                return (
                  <div key={`${day}-${time}`} className="p-1 min-h-[60px] border-r border-b">
                    {dayClasses.map((classEvent) => (
                      <div
                        key={classEvent.id}
                        className={`p-2 rounded-md cursor-pointer hover:opacity-80 transition-opacity ${classEvent.color} text-white text-xs mb-1`}
                        onClick={() => onClassClick?.(classEvent)}
                      >
                        <div className="font-medium truncate">{classEvent.name}</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {classEvent.enrolled}/{classEvent.capacity}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {classEvent.duration}m
                          </span>
                        </div>
                        <div className="flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate">{classEvent.room}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span>Yoga</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
            <span>Cardio</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
            <span>Strength</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
            <span>Pilates</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
