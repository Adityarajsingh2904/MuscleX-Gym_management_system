"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Users, DollarSign, Calendar, Settings, AlertCircle, Clock, Send, X } from "lucide-react"
import type { Notification } from "@/types/gym"

interface CreateNotificationModalProps {
  open: boolean
  onClose: () => void
  onCreate: (notification: Omit<Notification, "id" | "timestamp">) => void
}

export function CreateNotificationModal({ open, onClose, onCreate }: CreateNotificationModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "",
    priority: "medium",
    recipient: "admin",
    actionRequired: false,
    relatedId: "",
  })

  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(["admin"])

  const notificationTypes = [
    { value: "payment", label: "Payment", icon: DollarSign },
    { value: "member", label: "Member", icon: Users },
    { value: "class", label: "Class", icon: Calendar },
    { value: "maintenance", label: "Maintenance", icon: Settings },
    { value: "inventory", label: "Inventory", icon: AlertCircle },
    { value: "schedule", label: "Schedule", icon: Clock },
  ]

  const recipients = [
    { value: "admin", label: "Admin" },
    { value: "trainers", label: "All Trainers" },
    { value: "members", label: "All Members" },
    { value: "maintenance", label: "Maintenance Staff" },
    { value: "reception", label: "Reception" },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.message || !formData.type) return

    onCreate({
      ...formData,
      status: "unread",
    })

    // Reset form
    setFormData({
      title: "",
      message: "",
      type: "",
      priority: "medium",
      recipient: "admin",
      actionRequired: false,
      relatedId: "",
    })
    setSelectedRecipients(["admin"])
  }

  const handleRecipientToggle = (recipient: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(recipient) ? prev.filter((r) => r !== recipient) : [...prev, recipient],
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Send Notification</DialogTitle>
          <DialogDescription>Create and send a notification to gym staff or members.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter notification title"
                required
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Enter notification message"
                rows={4}
                required
              />
            </div>

            {/* Type and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <Badge variant="outline" className="text-green-600">
                        Low
                      </Badge>
                    </SelectItem>
                    <SelectItem value="medium">
                      <Badge variant="outline" className="text-yellow-600">
                        Medium
                      </Badge>
                    </SelectItem>
                    <SelectItem value="high">
                      <Badge variant="outline" className="text-red-600">
                        High
                      </Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Recipients */}
            <div className="space-y-2">
              <Label>Recipients</Label>
              <div className="grid grid-cols-2 gap-2">
                {recipients.map((recipient) => (
                  <div key={recipient.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={recipient.value}
                      checked={selectedRecipients.includes(recipient.value)}
                      onCheckedChange={() => handleRecipientToggle(recipient.value)}
                    />
                    <Label htmlFor={recipient.value} className="text-sm">
                      {recipient.label}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedRecipients.map((recipient) => (
                  <Badge key={recipient} variant="secondary" className="text-xs">
                    {recipients.find((r) => r.value === recipient)?.label}
                    <button
                      type="button"
                      onClick={() => handleRecipientToggle(recipient)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Action Required */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="actionRequired"
                checked={formData.actionRequired}
                onCheckedChange={(checked) => setFormData({ ...formData, actionRequired: checked as boolean })}
              />
              <Label htmlFor="actionRequired" className="text-sm">
                This notification requires action
              </Label>
            </div>

            {/* Related ID (optional) */}
            <div className="space-y-2">
              <Label htmlFor="relatedId">Related ID (Optional)</Label>
              <Input
                id="relatedId"
                value={formData.relatedId}
                onChange={(e) => setFormData({ ...formData, relatedId: e.target.value })}
                placeholder="e.g., member-123, class-456"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Send className="mr-2 h-4 w-4" />
              Send Notification
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
