"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserCheck, CreditCard, Calendar, UserPlus } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "checkin",
    user: "Sarah Johnson",
    action: "checked in",
    time: "2 minutes ago",
    icon: UserCheck,
    color: "bg-green-100 text-green-600",
  },
  {
    id: 2,
    type: "payment",
    user: "Mike Chen",
    action: "made a payment of $89",
    time: "15 minutes ago",
    icon: CreditCard,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: 3,
    type: "booking",
    user: "Emma Wilson",
    action: "booked a PT session",
    time: "1 hour ago",
    icon: Calendar,
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: 4,
    type: "registration",
    user: "David Brown",
    action: "registered as new member",
    time: "2 hours ago",
    icon: UserPlus,
    color: "bg-teal-100 text-teal-600",
  },
  {
    id: 5,
    type: "checkin",
    user: "Lisa Garcia",
    action: "checked in",
    time: "3 hours ago",
    icon: UserCheck,
    color: "bg-green-100 text-green-600",
  },
]

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className={`p-2 rounded-lg ${activity.color}`}>
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  <span className="font-semibold">{activity.user}</span> {activity.action}
                </p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {activity.type}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
