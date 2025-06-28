"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { X } from "lucide-react"
import type { Manager, Franchise } from "@/types/franchise"

interface AddManagerModalProps {
  open: boolean
  onClose: () => void
  onAdd: (manager: Omit<Manager, "id">) => void
}

export function AddManagerModal({ open, onClose, onAdd }: AddManagerModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "assistant_manager" as Manager["role"],
    franchiseId: "",
    permissions: [] as string[],
  })
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const availablePermissions = [
    { id: "member_management", label: "Member Management" },
    { id: "staff_management", label: "Staff Management" },
    { id: "billing", label: "Billing & Payments" },
    { id: "inventory", label: "Inventory Management" },
    { id: "reports", label: "Reports & Analytics" },
    { id: "settings", label: "Settings" },
    { id: "access_control", label: "Access Control" },
    { id: "notifications", label: "Notifications" },
  ]

  useEffect(() => {
    if (open) {
      // Load franchises from localStorage
      const savedFranchises = JSON.parse(localStorage.getItem("gym_franchises") || "[]")
      setFranchises(savedFranchises)
    }
  }, [open])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: checked ? [...prev.permissions, permission] : prev.permissions.filter((p) => p !== permission),
    }))
  }

  const removePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.filter((p) => p !== permission),
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    }

    if (!formData.franchiseId) {
      newErrors.franchiseId = "Please select a franchise"
    }

    if (formData.permissions.length === 0) {
      newErrors.permissions = "Please select at least one permission"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const selectedFranchise = franchises.find((f) => f.id === formData.franchiseId)

    const newManager: Omit<Manager, "id"> = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      franchiseId: formData.franchiseId,
      franchiseName: selectedFranchise?.name || "",
      gymId: selectedFranchise?.gymId || "gym_1",
      permissions: formData.permissions,
      status: "active",
      joinDate: new Date().toISOString().split("T")[0],
    }

    onAdd(newManager)

    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "assistant_manager",
      franchiseId: "",
      permissions: [],
    })
    setErrors({})
  }

  const handleClose = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "assistant_manager",
      franchiseId: "",
      permissions: [],
    })
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Manager</DialogTitle>
          <DialogDescription>
            Create a new manager account and assign them to a franchise with specific permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter full name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="franchise_manager">Franchise Manager</SelectItem>
                    <SelectItem value="assistant_manager">Assistant Manager</SelectItem>
                    <SelectItem value="shift_supervisor">Shift Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Franchise Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Franchise Assignment</h3>

            <div className="space-y-2">
              <Label htmlFor="franchise">Assign to Franchise *</Label>
              <Select value={formData.franchiseId} onValueChange={(value) => handleInputChange("franchiseId", value)}>
                <SelectTrigger className={errors.franchiseId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select franchise" />
                </SelectTrigger>
                <SelectContent>
                  {franchises.map((franchise) => (
                    <SelectItem key={franchise.id} value={franchise.id}>
                      <div className="flex flex-col">
                        <span>{franchise.name}</span>
                        <span className="text-sm text-gray-500">{franchise.address}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.franchiseId && <p className="text-sm text-red-500">{errors.franchiseId}</p>}
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Permissions</h3>
              {errors.permissions && <p className="text-sm text-red-500">{errors.permissions}</p>}
            </div>

            {/* Selected Permissions */}
            {formData.permissions.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Permissions</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.permissions.map((permission) => {
                    const permissionLabel = availablePermissions.find((p) => p.id === permission)?.label || permission
                    return (
                      <Badge key={permission} variant="secondary" className="flex items-center gap-1">
                        {permissionLabel}
                        <button
                          type="button"
                          onClick={() => removePermission(permission)}
                          className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Available Permissions */}
            <div className="space-y-2">
              <Label>Available Permissions</Label>
              <div className="grid grid-cols-2 gap-3">
                {availablePermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission.id}
                      checked={formData.permissions.includes(permission.id)}
                      onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                    />
                    <Label htmlFor={permission.id} className="text-sm font-normal">
                      {permission.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              Add Manager
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
