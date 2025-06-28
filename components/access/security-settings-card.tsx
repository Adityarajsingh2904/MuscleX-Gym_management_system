"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Settings, Shield, Bell, Lock, Key, AlertTriangle, CheckCircle } from "lucide-react"

export function SecuritySettingsCard() {
  const [settings, setSettings] = useState({
    rfidEnabled: true,
    qrCodeEnabled: true,
    biometricEnabled: false,
    manualOverride: true,
    autoLockEnabled: true,
    alertsEnabled: true,
    emergencyAccess: true,
    maintenanceMode: false,
  })

  const [securityLevel, setSecurityLevel] = useState("medium")

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const securityLevels = [
    { value: "low", label: "Low", color: "bg-yellow-100 text-yellow-800" },
    { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-800" },
    { value: "high", label: "High", color: "bg-red-100 text-red-800" },
  ]

  const accessMethods = [
    {
      key: "rfidEnabled",
      label: "RFID Cards",
      description: "Physical access cards",
      icon: <Key className="h-4 w-4" />,
    },
    {
      key: "qrCodeEnabled",
      label: "QR Codes",
      description: "Mobile app QR scanning",
      icon: <Shield className="h-4 w-4" />,
    },
    {
      key: "biometricEnabled",
      label: "Biometric",
      description: "Fingerprint scanning",
      icon: <Shield className="h-4 w-4" />,
    },
    {
      key: "manualOverride",
      label: "Manual Override",
      description: "Staff manual entry",
      icon: <Key className="h-4 w-4" />,
    },
  ]

  const systemSettings = [
    {
      key: "autoLockEnabled",
      label: "Auto-Lock",
      description: "Automatically lock doors after hours",
      icon: <Lock className="h-4 w-4" />,
    },
    {
      key: "alertsEnabled",
      label: "Security Alerts",
      description: "Real-time security notifications",
      icon: <Bell className="h-4 w-4" />,
    },
    {
      key: "emergencyAccess",
      label: "Emergency Access",
      description: "Allow emergency override",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      key: "maintenanceMode",
      label: "Maintenance Mode",
      description: "Disable access restrictions",
      icon: <Settings className="h-4 w-4" />,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Security Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security Level */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Security Level</Label>
          <div className="flex space-x-2">
            {securityLevels.map((level) => (
              <Badge
                key={level.value}
                variant={securityLevel === level.value ? "default" : "outline"}
                className={`cursor-pointer ${securityLevel === level.value ? level.color : ""}`}
                onClick={() => setSecurityLevel(level.value)}
              >
                {level.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Access Methods */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Access Methods</Label>
          <div className="space-y-3">
            {accessMethods.map((method) => (
              <div key={method.key} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gray-100">{method.icon}</div>
                  <div>
                    <div className="font-medium text-sm">{method.label}</div>
                    <div className="text-xs text-gray-500">{method.description}</div>
                  </div>
                </div>
                <Switch
                  checked={settings[method.key as keyof typeof settings] as boolean}
                  onCheckedChange={(checked) => handleSettingChange(method.key, checked)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* System Settings */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">System Settings</Label>
          <div className="space-y-3">
            {systemSettings.map((setting) => (
              <div key={setting.key} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gray-100">{setting.icon}</div>
                  <div>
                    <div className="font-medium text-sm">{setting.label}</div>
                    <div className="text-xs text-gray-500">{setting.description}</div>
                  </div>
                </div>
                <Switch
                  checked={settings[setting.key as keyof typeof settings] as boolean}
                  onCheckedChange={(checked) => handleSettingChange(setting.key, checked)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">System Status</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-sm font-medium text-green-800">Online</div>
                <div className="text-xs text-green-600">All systems operational</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-blue-50">
              <Shield className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-sm font-medium text-blue-800">Secure</div>
                <div className="text-xs text-blue-600">No security issues</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="flex-1">
            Test System
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            View Logs
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
