"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AlertTriangle, PenToolIcon as Tool, Clock } from "lucide-react"

interface NotificationSettingsProps {
  open: boolean
  onClose: () => void
  settings: {
    maintenanceDays: number
    membershipDays: number
  }
  onSave: (settings: { maintenanceDays: number; membershipDays: number }) => void
}

export function NotificationSettingsModal({ open, onClose, settings, onSave }: NotificationSettingsProps) {
  const [maintenanceDays, setMaintenanceDays] = useState(settings.maintenanceDays)
  const [membershipDays, setMembershipDays] = useState(settings.membershipDays)

  const handleSave = () => {
    onSave({
      maintenanceDays,
      membershipDays,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Notification Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-3">
              <Tool className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Maintenance Notifications</h3>
                <p className="text-sm text-blue-700">Show equipment maintenance due within the next X days</p>
                <div className="mt-2">
                  <Label htmlFor="maintenance-days" className="text-sm text-blue-800">
                    Days in advance
                  </Label>
                  <Input
                    id="maintenance-days"
                    type="number"
                    min="1"
                    max="30"
                    value={maintenanceDays}
                    onChange={(e) => setMaintenanceDays(Number.parseInt(e.target.value) || 7)}
                    className="mt-1 h-8 bg-white border-blue-200"
                  />
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 flex items-start gap-3">
              <Clock className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-purple-900">Membership Expiration</h3>
                <p className="text-sm text-purple-700">Show memberships expiring within the next X days</p>
                <div className="mt-2">
                  <Label htmlFor="membership-days" className="text-sm text-purple-800">
                    Days in advance
                  </Label>
                  <Input
                    id="membership-days"
                    type="number"
                    min="1"
                    max="30"
                    value={membershipDays}
                    onChange={(e) => setMembershipDays(Number.parseInt(e.target.value) || 3)}
                    className="mt-1 h-8 bg-white border-purple-200"
                  />
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-900">Payment Notifications</h3>
                <p className="text-sm text-orange-700">Overdue payments and payments due today are always shown</p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
