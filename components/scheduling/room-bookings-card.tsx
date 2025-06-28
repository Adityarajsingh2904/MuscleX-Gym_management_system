"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"
import type { ScheduleEvent } from "@/types/gym"

interface RoomBookingsCardProps {
  events: ScheduleEvent[]
}

export function RoomBookingsCard({ events }: RoomBookingsCardProps) {
  const today = new Date().toDateString()
  const todayEvents = events.filter((event) => new Date(event.startTime).toDateString() === today)

  const roomUsage = todayEvents.reduce(
    (acc, event) => {
      acc[event.room] = (acc[event.room] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const rooms = Object.entries(roomUsage).map(([room, count]) => ({
    name: room,
    bookings: count,
    status: count > 3 ? "busy" : count > 1 ? "moderate" : "available",
  }))

  const getStatusColor = (status: string) => {
    switch (status) {
      case "busy":
        return "bg-red-100 text-red-800"
      case "moderate":
        return "bg-yellow-100 text-yellow-800"
      case "available":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Room Bookings Today</CardTitle>
      </CardHeader>
      <CardContent>
        {rooms.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No room bookings today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <div key={room.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="font-medium text-sm">{room.name}</div>
                    <div className="text-xs text-gray-500">
                      {room.bookings} booking{room.bookings !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
                <Badge className={`text-xs ${getStatusColor(room.status)}`}>{room.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
