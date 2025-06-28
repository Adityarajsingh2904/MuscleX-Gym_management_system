"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Lock, Unlock, AlertTriangle, CheckCircle, Clock } from "lucide-react"

export function AccessControlCard() {
  const [systemStatus, setSystemStatus] = useState("active")
  const [emergencyMode, setEmergencyMode] = useState(false)

  const handleEmergencyLockdown = () => {
    setEmergencyMode(!emergencyMode)
    setSystemStatus(emergencyMode ? "active" : "lockdown")
  }

  const accessPoints = [
    { name: "Main Entrance", status: "active", lastAccess: "2 min ago" },
    { name: "Gym Floor", status: "active", lastAccess: "5 min ago" },
    { name: "Locker Rooms", status: "active", lastAccess: "1 min ago" },
    { name: "Studio A", status: "inactive", lastAccess: "30 min ago" },
  ]

  const recentEvents = [
    { type: "success", message: "Sarah Johnson accessed Gym Floor", time: "2 min ago" },
    { type: "warning", message: "Failed access attempt at Main Entrance", time: "5 min ago" },
    { type: "success", message: "Mike Chen accessed Locker Rooms", time: "8 min ago" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Access Control</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">System Status</span>
            <Badge
              variant={systemStatus === "active" ? "default" : "destructive"}
              className={systemStatus === "active" ? "bg-green-100 text-green-800" : ""}
            >
              {systemStatus === "active" ? "Active" : "Lockdown"}
            </Badge>
          </div>

          <Button
            variant={emergencyMode ? "destructive" : "outline"}
            size="sm"
            onClick={handleEmergencyLockdown}
            className="w-full"
          >
            {emergencyMode ? (
              <>
                <Unlock className="mr-2 h-4 w-4" />
                Disable Lockdown
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Emergency Lockdown
              </>
            )}
          </Button>
        </div>

        {/* Access Points */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Access Points</h4>
          <div className="space-y-2">
            {accessPoints.map((point, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2">
                  {point.status === "active" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium">{point.name}</span>
                </div>
                <span className="text-xs text-gray-500">{point.lastAccess}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Events */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Recent Events</h4>
          <div className="space-y-2">
            {recentEvents.map((event, index) => (
              <div key={index} className="flex items-start space-x-2 p-2 rounded-lg bg-gray-50">
                {event.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{event.message}</p>
                  <p className="text-xs text-gray-500">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-blue-50">
            <div className="text-lg font-bold text-blue-600">24</div>
            <div className="text-xs text-blue-600">Active Members</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-50">
            <div className="text-lg font-bold text-green-600">156</div>
            <div className="text-xs text-green-600">Today's Access</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
