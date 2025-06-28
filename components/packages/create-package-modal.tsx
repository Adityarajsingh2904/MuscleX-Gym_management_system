"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, X, Package, Crown, Zap, Shield } from "lucide-react"
import type { MembershipPackage } from "@/types/gym"

interface CreatePackageModalProps {
  open: boolean
  onClose: () => void
  onCreate: (packageData: Omit<MembershipPackage, "id" | "memberCount">) => void
}

export function CreatePackageModal({ open, onClose, onCreate }: CreatePackageModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    durationType: "days" as "days" | "months" | "years",
    features: [] as string[],
    limitations: [] as string[],
    status: "active" as "active" | "inactive",
    color: "blue",
    icon: "package",
    popular: false,
  })

  const [newFeature, setNewFeature] = useState("")
  const [newLimitation, setNewLimitation] = useState("")

  const colorOptions = [
    { value: "blue", label: "Blue", class: "bg-blue-500" },
    { value: "purple", label: "Purple", class: "bg-purple-500" },
    { value: "green", label: "Green", class: "bg-green-500" },
    { value: "orange", label: "Orange", class: "bg-orange-500" },
    { value: "red", label: "Red", class: "bg-red-500" },
    { value: "gold", label: "Gold", class: "bg-yellow-500" },
  ]

  const iconOptions = [
    { value: "package", label: "Package", icon: Package },
    { value: "crown", label: "Crown", icon: Crown },
    { value: "zap", label: "Zap", icon: Zap },
    { value: "shield", label: "Shield", icon: Shield },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.description || !formData.price || !formData.duration) {
      return
    }

    onCreate({
      name: formData.name,
      description: formData.description,
      price: Number.parseFloat(formData.price),
      duration: Number.parseInt(formData.duration),
      durationType: formData.durationType,
      features: formData.features,
      limitations: formData.limitations,
      status: formData.status,
      color: formData.color,
      icon: formData.icon,
      popular: formData.popular,
    })

    // Reset form
    setFormData({
      name: "",
      description: "",
      price: "",
      duration: "",
      durationType: "days",
      features: [],
      limitations: [],
      status: "active",
      color: "blue",
      icon: "package",
      popular: false,
    })
    setNewFeature("")
    setNewLimitation("")
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }))
      setNewFeature("")
    }
  }

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }

  const addLimitation = () => {
    if (newLimitation.trim()) {
      setFormData((prev) => ({
        ...prev,
        limitations: [...prev.limitations, newLimitation.trim()],
      }))
      setNewLimitation("")
    }
  }

  const removeLimitation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      limitations: prev.limitations.filter((_, i) => i !== index),
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Package</DialogTitle>
          <DialogDescription>Create a new membership package with custom features and pricing.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Package Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Premium, Basic, VIP"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="99.99"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the package benefits..."
              required
            />
          </div>

          {/* Duration */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                placeholder="30"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationType">Duration Type</Label>
              <Select
                value={formData.durationType}
                onValueChange={(value: "days" | "months" | "years") =>
                  setFormData((prev) => ({ ...prev, durationType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="months">Months</SelectItem>
                  <SelectItem value="years">Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Appearance */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Color Theme</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, color: color.value }))}
                    className={`w-8 h-8 rounded-full ${color.class} ${
                      formData.color === color.value ? "ring-2 ring-offset-2 ring-gray-400" : ""
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map((icon) => {
                  const IconComponent = icon.icon
                  return (
                    <button
                      key={icon.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, icon: icon.value }))}
                      className={`p-2 rounded-lg border ${
                        formData.icon === icon.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      title={icon.label}
                    >
                      <IconComponent className="h-4 w-4" />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <Label>Features</Label>
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Add a feature..."
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
              />
              <Button type="button" onClick={addFeature} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {feature}
                  <button type="button" onClick={() => removeFeature(index)} className="ml-1 hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Limitations */}
          <div className="space-y-2">
            <Label>Limitations</Label>
            <div className="flex gap-2">
              <Input
                value={newLimitation}
                onChange={(e) => setNewLimitation(e.target.value)}
                placeholder="Add a limitation..."
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLimitation())}
              />
              <Button type="button" onClick={addLimitation} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.limitations.map((limitation, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {limitation}
                  <button type="button" onClick={() => removeLimitation(index)} className="ml-1 hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Popular Package</Label>
                <p className="text-sm text-gray-500">Mark this package as popular choice</p>
              </div>
              <Switch
                checked={formData.popular}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, popular: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") => setFormData((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <Card className="border-2 border-dashed">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-${formData.color}-100 text-${formData.color}-600`}>
                      {iconOptions.find((icon) => icon.value === formData.icon)?.icon && (
                        <Package className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{formData.name || "Package Name"}</h3>
                        {formData.popular && <Badge className="bg-orange-100 text-orange-800 text-xs">Popular</Badge>}
                      </div>
                      <p className="text-sm text-gray-600">{formData.description || "Package description"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">${formData.price || "0"}</div>
                    <div className="text-sm text-gray-500">
                      /{formData.duration || "0"} {formData.durationType}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Create Package
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
