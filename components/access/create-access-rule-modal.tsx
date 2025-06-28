"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import type { AccessRule } from "@/types/gym"

interface CreateAccessRuleModalProps {
  open: boolean
  onClose: () => void
  onCreate: (rule: Omit<AccessRule, "id" | "createdAt" | "updatedAt">) => void
}

export function CreateAccessRuleModal({ open, onClose, onCreate }: CreateAccessRuleModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    membershipTypes: [] as string[],
    areas: [] as string[],
    timeRestrictions: {
      enabled: false,
      schedule: {} as Record<string, { start: string; end: string }>,
    },
    status: "active" as const,
  })

  const membershipTypeOptions = ["Basic", "Premium", "VIP Elite", "Student", "Senior", "Staff"]
  const areaOptions = [
    "Gym Floor",
    "Locker Rooms",
    "Studio A",
    "Studio B",
    "Pool",
    "Sauna",
    "Office",
    "Storage",
    "Equipment Room",
    "All Areas",
  ]

  const daysOfWeek = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ]

  const handleMembershipTypeToggle = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      membershipTypes: prev.membershipTypes.includes(type)
        ? prev.membershipTypes.filter((t) => t !== type)
        : [...prev.membershipTypes, type],
    }))
  }

  const handleAreaToggle = (area: string) => {
    setFormData((prev) => ({
      ...prev,
      areas: prev.areas.includes(area) ? prev.areas.filter((a) => a !== area) : [...prev.areas, area],
    }))
  }

  const handleTimeRestrictionChange = (day: string, field: "start" | "end", value: string) => {
    setFormData((prev) => ({
      ...prev,
      timeRestrictions: {
        ...prev.timeRestrictions,
        schedule: {
          ...prev.timeRestrictions.schedule,
          [day]: {
            ...prev.timeRestrictions.schedule[day],
            [field]: value,
          },
        },
      },
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.membershipTypes.length > 0 && formData.areas.length > 0) {
      onCreate(formData)
      setFormData({
        name: "",
        description: "",
        membershipTypes: [],
        areas: [],
        timeRestrictions: {
          enabled: false,
          schedule: {},
        },
        status: "active",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Access Rule</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Rule Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Premium Members 24/7"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this rule allows..."
                rows={3}
              />
            </div>
          </div>

          {/* Membership Types */}
          <div className="space-y-3">
            <Label>Membership Types *</Label>
            <div className="flex flex-wrap gap-2">
              {membershipTypeOptions.map((type) => (
                <Badge
                  key={type}
                  variant={formData.membershipTypes.includes(type) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleMembershipTypeToggle(type)}
                >
                  {type}
                  {formData.membershipTypes.includes(type) && <X className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Areas */}
          <div className="space-y-3">
            <Label>Accessible Areas *</Label>
            <div className="grid grid-cols-2 gap-2">
              {areaOptions.map((area) => (
                <div key={area} className="flex items-center space-x-2">
                  <Checkbox
                    id={area}
                    checked={formData.areas.includes(area)}
                    onCheckedChange={() => handleAreaToggle(area)}
                  />
                  <Label htmlFor={area} className="text-sm">
                    {area}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Time Restrictions */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="timeRestrictions"
                checked={formData.timeRestrictions.enabled}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    timeRestrictions: { ...prev.timeRestrictions, enabled: !!checked },
                  }))
                }
              />
              <Label htmlFor="timeRestrictions">Enable Time Restrictions</Label>
            </div>

            {formData.timeRestrictions.enabled && (
              <div className="space-y-3 p-4 border rounded-lg">
                <Label>Access Hours</Label>
                {daysOfWeek.map((day) => (
                  <div key={day.key} className="flex items-center space-x-3">
                    <div className="w-20 text-sm">{day.label}</div>
                    <Input
                      type="time"
                      value={formData.timeRestrictions.schedule[day.key]?.start || ""}
                      onChange={(e) => handleTimeRestrictionChange(day.key, "start", e.target.value)}
                      className="w-32"
                    />
                    <span className="text-sm text-gray-500">to</span>
                    <Input
                      type="time"
                      value={formData.timeRestrictions.schedule[day.key]?.end || ""}
                      onChange={(e) => handleTimeRestrictionChange(day.key, "end", e.target.value)}
                      className="w-32"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-3">
            <Label>Status</Label>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="active"
                  name="status"
                  value="active"
                  checked={formData.status === "active"}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as "active" }))}
                />
                <Label htmlFor="active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="inactive"
                  name="status"
                  value="inactive"
                  checked={formData.status === "inactive"}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as "inactive" }))}
                />
                <Label htmlFor="inactive">Inactive</Label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.name || formData.membershipTypes.length === 0 || formData.areas.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Rule
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
