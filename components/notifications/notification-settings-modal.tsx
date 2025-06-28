"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Mail, MessageSquare, Smartphone, Settings, Save } from "lucide-react"

interface NotificationSettingsModalProps {
  open: boolean
  onClose: () => void
}

export function NotificationSettingsModal({ open, onClose }: NotificationSettingsModalProps) {
  const [settings, setSettings] = useState({
    // General Settings
    enableNotifications: true,
    enableSounds: true,
    enableDesktop: true,

    // Email Settings
    enableEmail: true,
    emailFrequency: "immediate",

    // SMS Settings
    enableSMS: false,
    smsUrgentOnly: true,

    // Push Settings
    enablePush: true,
    pushQuietHours: true,
    quietStart: "22:00",
    quietEnd: "08:00",

    // Notification Types
    paymentNotifications: true,
    memberNotifications: true,
    classNotifications: true,
    maintenanceNotifications: true,
    inventoryNotifications: true,
    scheduleNotifications: true,

    // Priority Settings
    highPriorityOnly: false,
    actionRequiredOnly: false,
  })

  const handleSave = () => {
    // Save settings to localStorage or API
    localStorage.setItem("gym_notification_settings", JSON.stringify(settings))
    onClose()
  }

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Notification Settings</span>
          </DialogTitle>
          <DialogDescription>Configure how and when you receive notifications.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Bell className="h-5 w-5" />
                <span>General Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-gray-600">Turn on/off all notifications</p>
                </div>
                <Switch
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => updateSetting("enableNotifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Sound Notifications</Label>
                  <p className="text-sm text-gray-600">Play sound for new notifications</p>
                </div>
                <Switch
                  checked={settings.enableSounds}
                  onCheckedChange={(checked) => updateSetting("enableSounds", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Desktop Notifications</Label>
                  <p className="text-sm text-gray-600">Show browser notifications</p>
                </div>
                <Switch
                  checked={settings.enableDesktop}
                  onCheckedChange={(checked) => updateSetting("enableDesktop", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Email Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Mail className="h-5 w-5" />
                <span>Email Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Email</Label>
                  <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
                <Switch
                  checked={settings.enableEmail}
                  onCheckedChange={(checked) => updateSetting("enableEmail", checked)}
                />
              </div>

              {settings.enableEmail && (
                <div className="space-y-2">
                  <Label>Email Frequency</Label>
                  <Select
                    value={settings.emailFrequency}
                    onValueChange={(value) => updateSetting("emailFrequency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="hourly">Hourly Digest</SelectItem>
                      <SelectItem value="daily">Daily Digest</SelectItem>
                      <SelectItem value="weekly">Weekly Digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SMS Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <MessageSquare className="h-5 w-5" />
                <span>SMS Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable SMS</Label>
                  <p className="text-sm text-gray-600">Receive notifications via SMS</p>
                </div>
                <Switch
                  checked={settings.enableSMS}
                  onCheckedChange={(checked) => updateSetting("enableSMS", checked)}
                />
              </div>

              {settings.enableSMS && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Urgent Only</Label>
                    <p className="text-sm text-gray-600">Only send SMS for urgent notifications</p>
                  </div>
                  <Switch
                    checked={settings.smsUrgentOnly}
                    onCheckedChange={(checked) => updateSetting("smsUrgentOnly", checked)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Push Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Smartphone className="h-5 w-5" />
                <span>Push Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Push</Label>
                  <p className="text-sm text-gray-600">Receive push notifications</p>
                </div>
                <Switch
                  checked={settings.enablePush}
                  onCheckedChange={(checked) => updateSetting("enablePush", checked)}
                />
              </div>

              {settings.enablePush && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Quiet Hours</Label>
                    <p className="text-sm text-gray-600">Disable notifications during quiet hours</p>
                  </div>
                  <Switch
                    checked={settings.pushQuietHours}
                    onCheckedChange={(checked) => updateSetting("pushQuietHours", checked)}
                  />
                </div>
              )}

              {settings.enablePush && settings.pushQuietHours && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quiet Start</Label>
                    <Select value={settings.quietStart} onValueChange={(value) => updateSetting("quietStart", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, "0")
                          return (
                            <SelectItem key={hour} value={`${hour}:00`}>
                              {hour}:00
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quiet End</Label>
                    <Select value={settings.quietEnd} onValueChange={(value) => updateSetting("quietEnd", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, "0")
                          return (
                            <SelectItem key={hour} value={`${hour}:00`}>
                              {hour}:00
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  key: "paymentNotifications",
                  label: "Payment Notifications",
                  desc: "Payment reminders, overdue alerts",
                },
                { key: "memberNotifications", label: "Member Notifications", desc: "New registrations, cancellations" },
                { key: "classNotifications", label: "Class Notifications", desc: "Class updates, capacity alerts" },
                {
                  key: "maintenanceNotifications",
                  label: "Maintenance Notifications",
                  desc: "Equipment maintenance alerts",
                },
                { key: "inventoryNotifications", label: "Inventory Notifications", desc: "Low stock, reorder alerts" },
                { key: "scheduleNotifications", label: "Schedule Notifications", desc: "Schedule changes, updates" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <Label>{item.label}</Label>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                  <Switch
                    checked={settings[item.key as keyof typeof settings] as boolean}
                    onCheckedChange={(checked) => updateSetting(item.key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Priority Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Priority Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>High Priority Only</Label>
                  <p className="text-sm text-gray-600">Only show high priority notifications</p>
                </div>
                <Switch
                  checked={settings.highPriorityOnly}
                  onCheckedChange={(checked) => updateSetting("highPriorityOnly", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Action Required Only</Label>
                  <p className="text-sm text-gray-600">Only show notifications requiring action</p>
                </div>
                <Switch
                  checked={settings.actionRequiredOnly}
                  onCheckedChange={(checked) => updateSetting("actionRequiredOnly", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
