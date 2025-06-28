"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Users } from "lucide-react"

const classes = [
  {
    id: 1,
    name: "Morning Yoga",
    time: "7:00 AM",
    trainer: "Sarah Wilson",
    capacity: 20,
    booked: 18,
    status: "ongoing",
  },
  {
    id: 2,
    name: "HIIT Training",
    time: "9:00 AM",
    trainer: "Mike Johnson",
    capacity: 15,
    booked: 12,
    status: "upcoming",
  },
  {
    id: 3,
    name: "Zumba Dance",
    time: "11:00 AM",
    trainer: "Emma Garcia",
    capacity: 25,
    booked: 22,
    status: "upcoming",
  },
  {
    id: 4,
    name: "Strength Training",
    time: "2:00 PM",
    trainer: "David Brown",
    capacity: 12,
    booked: 8,
    status: "upcoming",
  },
  {
    id: 5,
    name: "Evening Pilates",
    time: "6:00 PM",
    trainer: "Lisa Chen",
    capacity: 18,
    booked: 15,
    status: "upcoming",
  },
]

export function TodaysClasses() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{"Today's Classes"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {classes.map((classItem) => (
            <div
              key={classItem.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-teal-200 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-gray-900">{classItem.name}</h4>
                  <Badge
                    variant={classItem.status === "ongoing" ? "default" : "secondary"}
                    className={classItem.status === "ongoing" ? "bg-green-100 text-green-800" : ""}
                  >
                    {classItem.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{classItem.time}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>
                      {classItem.booked}/{classItem.capacity}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Trainer: {classItem.trainer}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {Math.round((classItem.booked / classItem.capacity) * 100)}%
                </div>
                <div className="text-xs text-gray-500">capacity</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
