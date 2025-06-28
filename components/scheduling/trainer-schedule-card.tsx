"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User } from "lucide-react"
import type { ScheduleEvent } from "@/types/gym"

interface TrainerScheduleCardProps {
  events: ScheduleEvent[]
}

export function TrainerScheduleCard({ events }: TrainerScheduleCardProps) {
  const today = new Date().toDateString()
  const todayEvents = events.filter((event) => new Date(event.startTime).toDateString() === today)

  const trainerSchedule = todayEvents.reduce(
    (acc, event) => {
      if (event.instructor && event.instructor !== "Maintenance Team") {
        acc[event.instructor] = (acc[event.instructor] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const trainers = Object.entries(trainerSchedule).map(([name, sessions]) => ({
    name,
    sessions,
    status: sessions > 4 ? "busy" : sessions > 2 ? "moderate" : "available",
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
        <CardTitle>Trainer Schedule Today</CardTitle>
      </CardHeader>
      <CardContent>
        {trainers.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No trainer sessions today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trainers.map((trainer) => (
              <div key={trainer.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-600 font-medium text-sm">{trainer.name.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{trainer.name}</div>
                    <div className="text-xs text-gray-500">
                      {trainer.sessions} session{trainer.sessions !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
                <Badge className={`text-xs ${getStatusColor(trainer.status)}`}>{trainer.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
