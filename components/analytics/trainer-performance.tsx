"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Users, Calendar, TrendingUp } from "lucide-react"

const trainerData = [
  {
    id: 1,
    name: "Sarah Johnson",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 4.9,
    classes: 45,
    members: 120,
    revenue: 8500,
    growth: 12.5,
    specialties: ["HIIT", "Yoga"],
  },
  {
    id: 2,
    name: "Mike Chen",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 4.8,
    classes: 38,
    members: 95,
    revenue: 7200,
    growth: 8.3,
    specialties: ["Strength", "Boxing"],
  },
  {
    id: 3,
    name: "Emily Davis",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 4.7,
    classes: 42,
    members: 110,
    revenue: 7800,
    growth: 15.2,
    specialties: ["Pilates", "Dance"],
  },
  {
    id: 4,
    name: "Alex Rodriguez",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 4.6,
    classes: 35,
    members: 85,
    revenue: 6500,
    growth: 5.7,
    specialties: ["CrossFit", "Cardio"],
  },
]

export function TrainerPerformance() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trainer Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trainerData.map((trainer) => (
            <div key={trainer.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={trainer.avatar || "/placeholder.svg"} alt={trainer.name} />
                  <AvatarFallback>
                    {trainer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{trainer.name}</h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      {trainer.rating}
                    </div>
                    <span>•</span>
                    <div className="flex space-x-1">
                      {trainer.specialties.map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center text-blue-600 mb-1">
                    <Calendar className="h-4 w-4 mr-1" />
                  </div>
                  <div className="font-semibold">{trainer.classes}</div>
                  <div className="text-xs text-gray-500">Classes</div>
                </div>
                <div>
                  <div className="flex items-center justify-center text-green-600 mb-1">
                    <Users className="h-4 w-4 mr-1" />
                  </div>
                  <div className="font-semibold">{trainer.members}</div>
                  <div className="text-xs text-gray-500">Members</div>
                </div>
                <div>
                  <div className="font-semibold">${trainer.revenue.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Revenue</div>
                </div>
                <div>
                  <div className="flex items-center justify-center text-purple-600 mb-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                  </div>
                  <div className="font-semibold text-green-600">+{trainer.growth}%</div>
                  <div className="text-xs text-gray-500">Growth</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
