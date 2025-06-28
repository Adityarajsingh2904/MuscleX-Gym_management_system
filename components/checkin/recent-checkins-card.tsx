"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, QrCode, Smartphone, Fingerprint } from "lucide-react"
import type { CheckIn } from "@/types/gym"

interface RecentCheckInsCardProps {
  recentCheckIns: CheckIn[]
}

export function RecentCheckInsCard({ recentCheckIns }: RecentCheckInsCardProps) {
  const getMethodIcon = (method: string) => {
    switch (method) {
      case "qr":
        return QrCode
      case "rfid":
        return Smartphone
      case "biometric":
        return Fingerprint
      default:
        return Clock
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 1) return "Just now"
    if (diffMinutes < 60) return `${diffMinutes}m ago`

    const diffHours = Math.floor(diffMinutes / 60)
    return `${diffHours}h ago`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Check-ins</CardTitle>
      </CardHeader>
      <CardContent>
        {recentCheckIns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent check-ins</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentCheckIns.map((checkIn) => {
              const MethodIcon = getMethodIcon(checkIn.method)
              return (
                <div
                  key={checkIn.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-600 font-medium text-sm">{checkIn.memberName.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">{checkIn.memberName}</div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <MethodIcon className="h-3 w-3" />
                        <span className="capitalize">{checkIn.method}</span>
                        <span>•</span>
                        <span>{formatTime(checkIn.checkInTime)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={checkIn.status === "active" ? "default" : "secondary"}
                      className={`text-xs ${checkIn.status === "active" ? "bg-green-100 text-green-800" : ""}`}
                    >
                      {checkIn.status}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">{getTimeAgo(checkIn.checkInTime)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
