"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  X,
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  AlertCircle,
  User,
  CreditCard,
  Calendar,
  Settings,
  Check,
} from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  category: "member" | "payment" | "class" | "system" | "general"
  read: boolean
  timestamp: string
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    // Load notifications from localStorage or generate mock data
    const storedNotifications = localStorage.getItem("notifications")

    if (storedNotifications) {
      setNotifications(JSON.parse(storedNotifications))
    } else {
      // Generate mock notifications
      const mockNotifications: Notification[] = [
        {
          id: "1",
          title: "New Member Registration",
          message: "Sarah Johnson has registered for a Premium membership package.",
          type: "info",
          category: "member",
          read: false,
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
          action: {
            label: "View Profile",
            onClick: () => console.log("View profile"),
          },
        },
        {
          id: "2",
          title: "Payment Overdue",
          message: "Mike Chen's subscription payment is 3 days overdue.",
          type: "warning",
          category: "payment",
          read: false,
          timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
          action: {
            label: "Send Reminder",
            onClick: () => console.log("Send reminder"),
          },
        },
        {
          id: "3",
          title: "Class Capacity Reached",
          message: "Morning Yoga class is now full for tomorrow.",
          type: "success",
          category: "class",
          read: true,
          timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
        },
        {
          id: "4",
          title: "System Update",
          message: "The system will undergo maintenance tonight at 2 AM.",
          type: "info",
          category: "system",
          read: false,
          timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
        },
        {
          id: "5",
          title: "New Feature Available",
          message: "Check out the new attendance tracking feature.",
          type: "info",
          category: "general",
          read: true,
          timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
          action: {
            label: "Explore",
            onClick: () => console.log("Explore feature"),
          },
        },
      ]

      setNotifications(mockNotifications)
      localStorage.setItem("notifications", JSON.stringify(mockNotifications))
    }
  }, [])

  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification,
    )
    setNotifications(updatedNotifications)
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications))
  }

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map((notification) => ({ ...notification, read: true }))
    setNotifications(updatedNotifications)
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications))
  }

  const deleteNotification = (id: string) => {
    const updatedNotifications = notifications.filter((notification) => notification.id !== id)
    setNotifications(updatedNotifications)
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications))
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const notificationTime = new Date(timestamp)
    const diffMs = now.getTime() - notificationTime.getTime()
    const diffMins = Math.round(diffMs / 60000)

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`
    }

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
    }

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
  }

  const getNotificationIcon = (type: string, category: string) => {
    // First determine icon by type
    if (type === "success") return <CheckCircle className="h-5 w-5 text-green-500" />
    if (type === "warning") return <AlertTriangle className="h-5 w-5 text-amber-500" />
    if (type === "error") return <AlertCircle className="h-5 w-5 text-red-500" />

    // If type is info, determine by category
    if (category === "member") return <User className="h-5 w-5 text-blue-500" />
    if (category === "payment") return <CreditCard className="h-5 w-5 text-blue-500" />
    if (category === "class") return <Calendar className="h-5 w-5 text-blue-500" />
    if (category === "system") return <Settings className="h-5 w-5 text-blue-500" />

    // Default
    return <Info className="h-5 w-5 text-blue-500" />
  }

  const getCategoryBadge = (category: string) => {
    const styles = {
      member: "bg-blue-100 text-blue-800",
      payment: "bg-emerald-100 text-emerald-800",
      class: "bg-purple-100 text-purple-800",
      system: "bg-gray-100 text-gray-800",
      general: "bg-teal-100 text-teal-800",
    }

    return (
      <Badge className={`${styles[category as keyof typeof styles]} font-normal`}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    )
  }

  const filteredNotifications = activeTab === "unread" ? notifications.filter((n) => !n.read) : notifications

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? "flex" : "hidden"}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-lg flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Notifications</h2>
            {unreadCount > 0 && <Badge className="bg-red-500">{unreadCount}</Badge>}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-4 pt-2">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">
                All
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex-1">
                Unread
                {unreadCount > 0 && <Badge className="ml-2 bg-red-500">{unreadCount}</Badge>}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="flex-1 p-0">
            <ScrollArea className="h-full">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <Bell className="h-12 w-12 text-gray-300 mb-2" />
                  <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
                  <p className="text-gray-500">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <div key={notification.id} className={`p-4 ${notification.read ? "bg-white" : "bg-blue-50"}`}>
                      <div className="flex">
                        <div className="mr-3 mt-0.5">
                          {getNotificationIcon(notification.type, notification.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-medium text-gray-900">{notification.title}</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getCategoryBadge(notification.category)}
                              <span className="text-xs text-gray-500">{getTimeAgo(notification.timestamp)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  Mark read
                                </Button>
                              )}
                              {notification.action && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={notification.action.onClick}
                                >
                                  {notification.action.label}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unread" className="flex-1 p-0">
            <ScrollArea className="h-full">
              {filteredNotifications.filter((n) => !n.read).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-300 mb-2" />
                  <h3 className="text-lg font-medium text-gray-900">No unread notifications</h3>
                  <p className="text-gray-500">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications
                    .filter((n) => !n.read)
                    .map((notification) => (
                      <div key={notification.id} className="p-4 bg-blue-50">
                        <div className="flex">
                          <div className="mr-3 mt-0.5">
                            {getNotificationIcon(notification.type, notification.category)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-1">
                              <h3 className="font-medium text-gray-900">{notification.title}</h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => deleteNotification(notification.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getCategoryBadge(notification.category)}
                                <span className="text-xs text-gray-500">{getTimeAgo(notification.timestamp)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  Mark read
                                </Button>
                                {notification.action && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={notification.action.onClick}
                                  >
                                    {notification.action.label}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
