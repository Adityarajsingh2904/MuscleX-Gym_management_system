"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LogOut, Clock } from "lucide-react"
import type { CheckIn } from "@/types/gym"

interface ActiveMembersCardProps {
  activeCheckIns: CheckIn[]
  onCheckOut: (checkInId: string) => void
}

export function ActiveMembersCard({ activeCheckIns, onCheckOut }: ActiveMembersCardProps) {
  const getTimeElapsed = (checkInTime: string) => {
    const now = new Date()
    const checkIn = new Date(checkInTime)
    const diffMs = now.getTime() - checkIn.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`
    }
    return `${diffMinutes}m`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Active Members ({activeCheckIns.length})</span>
          <Badge className="bg-green-100 text-green-800">Live</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeCheckIns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No members currently checked in</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activeCheckIns.map((checkIn) => (
              <div key={checkIn.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <span className="text-teal-600 font-medium text-sm">{checkIn.memberName.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="font-medium">{checkIn.memberName}</div>
                    <div className="text-sm text-gray-500 flex items-center space-x-2">
                      <Clock className="h-3 w-3" />
                      <span>{getTimeElapsed(checkIn.checkInTime)}</span>
                      <span>•</span>
                      <span className="capitalize">{checkIn.method}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCheckOut(checkIn.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
