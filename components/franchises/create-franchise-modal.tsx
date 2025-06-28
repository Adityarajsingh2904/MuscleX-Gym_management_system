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
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import type { Franchise } from "@/types/franchise"

interface CreateFranchiseModalProps {
  open: boolean
  onClose: () => void
  onAdd: (franchise: Omit<Franchise, "id" | "createdAt">) => void
}

export function CreateFranchiseModal({ open, onClose, onAdd }: CreateFranchiseModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    gymId: "gym_1", // Default gym ID
    managerId: "",
    managerName: "",
    status: "pending" as const,
    memberCount: 0,
    revenue: 0,
    settings: {
      capacity: 200,
      operatingHours: {
        monday: { start: "06:00", end: "22:00" },
        tuesday: { start: "06:00", end: "22:00" },
        wednesday: { start: "06:00", end: "22:00" },
        thursday: { start: "06:00", end: "22:00" },
        friday: { start: "06:00", end: "22:00" },
        saturday: { start: "08:00", end: "20:00" },
        sunday: { start: "08:00", end: "18:00" },
      },
      amenities: [] as string[],
    },
  })

  const [newAmenity, setNewAmenity] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd(formData)
    setFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
      gymId: "gym_1",
      managerId: "",
      managerName: "",
      status: "pending",
      memberCount: 0,
      revenue: 0,
      settings: {
        capacity: 200,
        operatingHours: {
          monday: { start: "06:00", end: "22:00" },
          tuesday: { start: "06:00", end: "22:00" },
          wednesday: { start: "06:00", end: "22:00" },
          thursday: { start: "06:00", end: "22:00" },
          friday: { start: "06:00", end: "22:00" },
          saturday: { start: "08:00", end: "20:00" },
          sunday: { start: "08:00", end: "18:00" },
        },
        amenities: [],
      },
    })
  }

  const addAmenity = () => {
    if (newAmenity.trim() && !formData.settings.amenities.includes(newAmenity.trim())) {
      setFormData((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          amenities: [...prev.settings.amenities, newAmenity.trim()],
        },
      }))
      setNewAmenity("")
    }
  }

  const removeAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        amenities: prev.settings.amenities.filter((a) => a !== amenity),
      },
    }))
  }

  const updateOperatingHours = (day: string, field: "start" | "end", value: string) => {
    setFormData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        operatingHours: {
          ...prev.settings.operatingHours,
          [day]: {
            ...prev.settings.operatingHours[day as keyof typeof prev.settings.operatingHours],
            [field]: value,
          },
        },
      },
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Franchise</DialogTitle>
          <DialogDescription>Add a new franchise location to your gym network.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Franchise Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Downtown Branch"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="123 Main St, Downtown, City 12345"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 234-567-8900"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="franchise@fitflow.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.settings.capacity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    settings: { ...prev.settings, capacity: Number.parseInt(e.target.value) || 0 },
                  }))
                }
                placeholder="200"
                min="1"
              />
            </div>
          </div>

          {/* Operating Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Operating Hours</h3>
            <div className="space-y-3">
              {Object.entries(formData.settings.operatingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center space-x-4">
                  <div className="w-20 text-sm font-medium capitalize">{day}</div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="time"
                      value={hours.start}
                      onChange={(e) => updateOperatingHours(day, "start", e.target.value)}
                      className="w-32"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type="time"
                      value={hours.end}
                      onChange={(e) => updateOperatingHours(day, "end", e.target.value)}
                      className="w-32"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Amenities</h3>
            <div className="flex space-x-2">
              <Input
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                placeholder="Add amenity (e.g., Pool, Sauna)"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addAmenity())}
              />
              <Button type="button" onClick={addAmenity}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.settings.amenities.map((amenity) => (
                <Badge key={amenity} variant="secondary" className="flex items-center space-x-1">
                  <span>{amenity}</span>
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeAmenity(amenity)} />
                </Badge>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Create Franchise
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
