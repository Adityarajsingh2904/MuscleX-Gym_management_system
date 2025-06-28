"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QrCode, Smartphone, Fingerprint, Clock } from "lucide-react"

interface CheckInModalProps {
  open: boolean
  onClose: () => void
  onCheckIn: (memberName: string, method: string) => void
}

export function CheckInModal({ open, onClose, onCheckIn }: CheckInModalProps) {
  const [memberName, setMemberName] = useState("")
  const [selectedMethod, setSelectedMethod] = useState("manual")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (memberName.trim()) {
      onCheckIn(memberName, selectedMethod)
      setMemberName("")
    }
  }

  const methods = [
    { id: "manual", label: "Manual", icon: Clock },
    { id: "qr", label: "QR Code", icon: QrCode },
    { id: "rfid", label: "RFID", icon: Smartphone },
    { id: "biometric", label: "Biometric", icon: Fingerprint },
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manual Check-in</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="memberName">Member Name *</Label>
            <Input
              id="memberName"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="Enter member name"
              required
            />
          </div>

          <div>
            <Label>Check-in Method</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {methods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethod(method.id)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    selectedMethod === method.id
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <method.icon className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
              Check In
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
