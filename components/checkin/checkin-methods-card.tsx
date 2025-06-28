"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QrCode, Smartphone, Fingerprint, Clock, Wifi, Settings } from "lucide-react"

export function CheckInMethodsCard() {
  const methods = [
    {
      id: "qr",
      name: "QR Code",
      icon: QrCode,
      description: "Scan member QR codes",
      status: "active",
      color: "bg-blue-100 text-blue-600",
    },
    {
      id: "rfid",
      name: "RFID Cards",
      icon: Smartphone,
      description: "Tap RFID membership cards",
      status: "active",
      color: "bg-green-100 text-green-600",
    },
    {
      id: "biometric",
      name: "Biometric",
      icon: Fingerprint,
      description: "Fingerprint scanning",
      status: "maintenance",
      color: "bg-orange-100 text-orange-600",
    },
    {
      id: "manual",
      name: "Manual Entry",
      icon: Clock,
      description: "Staff-assisted check-in",
      status: "active",
      color: "bg-purple-100 text-purple-600",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Check-in Methods</span>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {methods.map((method) => (
            <div key={method.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${method.color}`}>
                  <method.icon className="h-5 w-5" />
                </div>
                <div className="flex items-center space-x-1">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      method.status === "active"
                        ? "bg-green-500"
                        : method.status === "maintenance"
                          ? "bg-orange-500"
                          : "bg-red-500"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      method.status === "active"
                        ? "text-green-600"
                        : method.status === "maintenance"
                          ? "text-orange-600"
                          : "text-red-600"
                    }`}
                  >
                    {method.status}
                  </span>
                </div>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{method.name}</h3>
              <p className="text-sm text-gray-500">{method.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Wifi className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">System Status</span>
          </div>
          <p className="text-sm text-blue-700">All check-in systems are operational. Last sync: 2 minutes ago</p>
        </div>
      </CardContent>
    </Card>
  )
}
