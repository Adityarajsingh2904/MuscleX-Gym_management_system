"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Trash2, ExternalLink, Clock, AlertTriangle } from "lucide-react"
import type { Notification } from "@/types/gym"

interface NotificationCardProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  getTypeIcon: (type: string) => React.ComponentType<any>
  getPriorityColor: (priority: string) => string
}

export function NotificationCard({ notification, onMarkAsRead, getTypeIcon, getPriorityColor }: NotificationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const TypeIcon = getTypeIcon(notification.type)

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const handleAction = (action: string) => {
    switch (action) {
      case "mark-read":
        onMarkAsRead(notification.id)
        break
      case "delete":
        // Handle delete notification
        console.log("Delete notification:", notification.id)
        break
      case "view-details":
        // Handle view details
        console.log("View details:", notification.relatedId)
        break
    }
  }

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md ${
        notification.status === "unread"
          ? "border-l-4 border-l-blue-500 bg-blue-50/30"
          : "border-l-4 border-l-transparent"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Icon */}
            <div
              className={`p-2 rounded-lg ${
                notification.priority === "high"
                  ? "bg-red-100 text-red-600"
                  : notification.priority === "medium"
                    ? "bg-yellow-100 text-yellow-600"
                    : "bg-green-100 text-green-600"
              }`}
            >
              <TypeIcon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className={`font-medium ${notification.status === "unread" ? "text-gray-900" : "text-gray-700"}`}>
                  {notification.title}
                </h3>
                <Badge variant="outline" className={`text-xs ${getPriorityColor(notification.priority)}`}>
                  {notification.priority}
                </Badge>
                {notification.actionRequired && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Action Required
                  </Badge>
                )}
              </div>

              <p
                className={`text-sm mb-2 ${
                  notification.status === "unread" ? "text-gray-700" : "text-gray-600"
                } ${isExpanded ? "" : "line-clamp-2"}`}
              >
                {notification.message}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeAgo(notification.timestamp)}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {notification.type}
                  </Badge>
                  <span className="capitalize">{notification.recipient}</span>
                </div>

                <div className="flex items-center space-x-2">
                  {notification.message.length > 100 && (
                    <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="text-xs">
                      {isExpanded ? "Show less" : "Show more"}
                    </Button>
                  )}

                  {notification.status === "unread" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMarkAsRead(notification.id)}
                      className="text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Mark Read
                    </Button>
                  )}

                  {notification.actionRequired && (
                    <Button
                      size="sm"
                      onClick={() => handleAction("view-details")}
                      className="text-xs bg-blue-600 hover:bg-blue-700"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Take Action
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {notification.status === "unread" && (
                <DropdownMenuItem onClick={() => handleAction("mark-read")}>
                  <Eye className="mr-2 h-4 w-4" />
                  Mark as Read
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleAction("view-details")}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction("delete")} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
