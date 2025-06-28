"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Bell,
  Search,
  BookMarkedIcon as MarkAsRead,
  Settings,
  Send,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  Calendar,
} from "lucide-react"
import { NotificationCard } from "@/components/notifications/notification-card"
import { CreateNotificationModal } from "@/components/notifications/create-notification-modal"
import { NotificationSettingsModal } from "@/components/notifications/notification-settings-modal"
import type { Notification } from "@/types/gym"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  useEffect(() => {
    const savedNotifications = JSON.parse(localStorage.getItem("gym_notifications") || "[]")
    if (savedNotifications.length === 0) {
      // Initialize with sample data
      const sampleNotifications: Notification[] = [
        {
          id: "1",
          title: "Payment Overdue",
          message: "Mike Chen's subscription payment is 3 days overdue. Please follow up.",
          type: "payment",
          priority: "high",
          status: "unread",
          timestamp: new Date().toISOString(),
          recipient: "admin",
          actionRequired: true,
          relatedId: "member-2",
        },
        {
          id: "2",
          title: "New Member Registration",
          message: "Sarah Johnson has successfully registered for the Premium package.",
          type: "member",
          priority: "medium",
          status: "unread",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          recipient: "admin",
          actionRequired: false,
          relatedId: "member-1",
        },
        {
          id: "3",
          title: "Class Capacity Reached",
          message: "Morning Yoga class has reached full capacity (20/20). Consider adding another session.",
          type: "class",
          priority: "medium",
          status: "read",
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          recipient: "admin",
          actionRequired: true,
          relatedId: "class-1",
        },
        {
          id: "4",
          title: "Equipment Maintenance Due",
          message: "Treadmill #3 is due for monthly maintenance check.",
          type: "maintenance",
          priority: "medium",
          status: "unread",
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          recipient: "maintenance",
          actionRequired: true,
          relatedId: "equipment-3",
        },
        {
          id: "5",
          title: "Low Stock Alert",
          message: "Whey Protein Powder stock is running low (5 units remaining).",
          type: "inventory",
          priority: "high",
          status: "unread",
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          recipient: "admin",
          actionRequired: true,
          relatedId: "product-1",
        },
        {
          id: "6",
          title: "Trainer Schedule Update",
          message: "Emma Garcia has updated her availability for next week.",
          type: "schedule",
          priority: "low",
          status: "read",
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          recipient: "admin",
          actionRequired: false,
          relatedId: "trainer-3",
        },
      ]
      setNotifications(sampleNotifications)
      localStorage.setItem("gym_notifications", JSON.stringify(sampleNotifications))
    } else {
      setNotifications(savedNotifications)
    }
  }, [])

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || notification.type === filterType
    const matchesStatus = filterStatus === "all" || notification.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const handleMarkAsRead = (notificationId: string) => {
    const updatedNotifications = notifications.map((notification) =>
      notification.id === notificationId ? { ...notification, status: "read" as const } : notification,
    )
    setNotifications(updatedNotifications)
    localStorage.setItem("gym_notifications", JSON.stringify(updatedNotifications))
  }

  const handleMarkAllAsRead = () => {
    const updatedNotifications = notifications.map((notification) => ({
      ...notification,
      status: "read" as const,
    }))
    setNotifications(updatedNotifications)
    localStorage.setItem("gym_notifications", JSON.stringify(updatedNotifications))
  }

  const handleCreateNotification = (notificationData: Omit<Notification, "id" | "timestamp">) => {
    const notification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    }
    const updatedNotifications = [notification, ...notifications]
    setNotifications(updatedNotifications)
    localStorage.setItem("gym_notifications", JSON.stringify(updatedNotifications))
    setShowCreateModal(false)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "payment":
        return DollarSign
      case "member":
        return Users
      case "class":
        return Calendar
      case "maintenance":
        return Settings
      case "inventory":
        return AlertCircle
      case "schedule":
        return Clock
      default:
        return Info
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600"
      case "medium":
        return "text-yellow-600"
      case "low":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  const unreadCount = notifications.filter((n) => n.status === "unread").length
  const highPriorityCount = notifications.filter((n) => n.priority === "high" && n.status === "unread").length
  const actionRequiredCount = notifications.filter((n) => n.actionRequired && n.status === "unread").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Stay updated with important gym activities and alerts</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setShowSettingsModal(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
            <Send className="mr-2 h-4 w-4" />
            Send Notification
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                <Bell className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-gray-900">{highPriorityCount}</p>
              </div>
              <div className="p-3 rounded-2xl bg-red-100 text-red-600">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Action Required</p>
                <p className="text-2xl font-bold text-gray-900">{actionRequiredCount}</p>
              </div>
              <div className="p-3 rounded-2xl bg-orange-100 text-orange-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-green-100 text-green-600">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="payment">Payment</option>
                <option value="member">Member</option>
                <option value="class">Class</option>
                <option value="maintenance">Maintenance</option>
                <option value="inventory">Inventory</option>
                <option value="schedule">Schedule</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <MarkAsRead className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-600">
                {searchTerm || filterType !== "all" || filterStatus !== "all"
                  ? "Try adjusting your filters to see more notifications."
                  : "You're all caught up! No new notifications at the moment."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              getTypeIcon={getTypeIcon}
              getPriorityColor={getPriorityColor}
            />
          ))
        )}
      </div>

      <CreateNotificationModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateNotification}
      />

      <NotificationSettingsModal open={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </div>
  )
}
