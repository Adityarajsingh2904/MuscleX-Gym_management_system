"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Calendar, Clock, Users, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import { ScheduleCalendar } from "@/components/scheduling/schedule-calendar"
import { CreateEventModal } from "@/components/scheduling/create-event-modal"
import { UpcomingEventsCard } from "@/components/scheduling/upcoming-events-card"
import { RoomBookingsCard } from "@/components/scheduling/room-bookings-card"
import { TrainerScheduleCard } from "@/components/scheduling/trainer-schedule-card"
import type { ScheduleEvent } from "@/types/gym"

export default function SchedulingPage() {
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"week" | "month">("week")
  const [filterType, setFilterType] = useState("all")

  useEffect(() => {
    const savedEvents = JSON.parse(localStorage.getItem("gym_schedule_events") || "[]")
    if (savedEvents.length === 0) {
      // Initialize with sample data
      const sampleEvents: ScheduleEvent[] = [
        {
          id: "1",
          title: "Morning Yoga",
          type: "class",
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
          instructor: "Sarah Wilson",
          instructorId: "1",
          room: "Studio A",
          capacity: 20,
          enrolled: 15,
          description: "Peaceful morning yoga session",
          status: "scheduled",
          recurring: true,
          recurrencePattern: "weekly",
        },
        {
          id: "2",
          title: "Personal Training - Mike Chen",
          type: "personal_training",
          startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
          instructor: "Mike Johnson",
          instructorId: "2",
          room: "Training Room 1",
          capacity: 1,
          enrolled: 1,
          description: "One-on-one strength training session",
          status: "confirmed",
          recurring: false,
        },
        {
          id: "3",
          title: "Equipment Maintenance",
          type: "maintenance",
          startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
          instructor: "Maintenance Team",
          instructorId: "maintenance",
          room: "Gym Floor",
          capacity: 0,
          enrolled: 0,
          description: "Monthly equipment inspection and maintenance",
          status: "scheduled",
          recurring: true,
          recurrencePattern: "monthly",
        },
      ]
      setEvents(sampleEvents)
      localStorage.setItem("gym_schedule_events", JSON.stringify(sampleEvents))
    } else {
      setEvents(savedEvents)
    }
  }, [])

  const handleCreateEvent = (eventData: Omit<ScheduleEvent, "id">) => {
    const event: ScheduleEvent = {
      ...eventData,
      id: Date.now().toString(),
    }
    const updatedEvents = [...events, event]
    setEvents(updatedEvents)
    localStorage.setItem("gym_schedule_events", JSON.stringify(updatedEvents))
    setShowCreateEvent(false)
  }

  const filteredEvents = events.filter((event) => {
    if (filterType === "all") return true
    return event.type === filterType
  })

  const todayEvents = events.filter((event) => {
    const eventDate = new Date(event.startTime).toDateString()
    const today = new Date().toDateString()
    return eventDate === today
  })

  const upcomingEvents = events
    .filter((event) => {
      const eventDate = new Date(event.startTime)
      const now = new Date()
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      return eventDate > now && eventDate <= nextWeek
    })
    .slice(0, 5)

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scheduling</h1>
          <p className="text-gray-600">Manage classes, appointments, and facility bookings</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => setShowCreateEvent(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Events</p>
                <p className="text-2xl font-bold text-gray-900">{todayEvents.length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Classes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {events.filter((e) => e.type === "class" && e.status === "scheduled").length}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-green-100 text-green-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">PT Sessions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {events.filter((e) => e.type === "personal_training").length}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-100 text-purple-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Room Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{new Set(events.map((e) => e.room)).size}</p>
              </div>
              <div className="p-3 rounded-2xl bg-orange-100 text-orange-600">
                <MapPin className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold">
                  {currentDate.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                    ...(viewMode === "week" && { day: "numeric" }),
                  })}
                </h2>
                <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Events</option>
                <option value="class">Classes</option>
                <option value="personal_training">Personal Training</option>
                <option value="maintenance">Maintenance</option>
                <option value="event">Special Events</option>
              </select>

              <div className="flex rounded-lg border border-gray-200 p-1">
                <Button
                  variant={viewMode === "week" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("week")}
                  className={viewMode === "week" ? "bg-purple-600 hover:bg-purple-700" : ""}
                >
                  Week
                </Button>
                <Button
                  variant={viewMode === "month" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("month")}
                  className={viewMode === "month" ? "bg-purple-600 hover:bg-purple-700" : ""}
                >
                  Month
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Calendar */}
        <div className="lg:col-span-3">
          <ScheduleCalendar
            events={filteredEvents}
            currentDate={currentDate}
            viewMode={viewMode}
            onEventClick={(event) => console.log("Event clicked:", event)}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <UpcomingEventsCard events={upcomingEvents} />
          <RoomBookingsCard events={events} />
          <TrainerScheduleCard events={events} />
        </div>
      </div>

      <CreateEventModal open={showCreateEvent} onClose={() => setShowCreateEvent(false)} onCreate={handleCreateEvent} />
    </div>
  )
}
