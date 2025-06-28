"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"

const CATEGORIES = [
  "Cardio Equipment",
  "Strength Equipment",
  "Free Weights",
  "Machines",
  "Accessories",
  "Electronics",
  "Furniture",
  "Other",
]

const STATUS_OPTIONS = [
  { value: "working", label: "Working" },
  { value: "maintenance", label: "Needs Maintenance" },
  { value: "broken", label: "Broken" },
  { value: "retired", label: "Retired" },
]

const MAINTENANCE_INTERVALS = [
  { value: "30", label: "Monthly (30 days)" },
  { value: "60", label: "Every 2 months (60 days)" },
  { value: "90", label: "Quarterly (90 days)" },
  { value: "180", label: "Every 6 months (180 days)" },
  { value: "365", label: "Yearly (365 days)" },
  { value: "730", label: "Every 2 years (730 days)" },
]

export default function EditInventoryModal({ open, onClose, onSuccess, item }) {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    brand: "",
    purchase_date: "",
    warranty_expiry: "",
    last_maintenance: "",
    maintenance_interval_days: 90,
    status: "working",
    notes: "",
  })

  useEffect(() => {
    if (item) {
      // Format dates for input fields
      const formatDate = (dateString) => {
        if (!dateString) return ""
        const date = new Date(dateString)
        return date.toISOString().split("T")[0]
      }

      setFormData({
        name: item.name || "",
        category: item.category || "",
        brand: item.brand || "",
        purchase_date: formatDate(item.purchase_date),
        warranty_expiry: formatDate(item.warranty_expiry),
        last_maintenance: formatDate(item.last_maintenance),
        maintenance_interval_days: item.maintenance_interval_days || 90,
        status: item.status || "working",
        notes: item.notes || "",
      })
    }
  }, [item])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name) {
      toast({
        title: "Error",
        description: "Equipment name is required",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase
        .from("inventory_items")
        .update({
          ...formData,
          maintenance_interval_days: Number.parseInt(formData.maintenance_interval_days),
        })
        .eq("id", item.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Equipment updated successfully",
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error updating inventory item:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update equipment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Equipment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Equipment Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" name="brand" value={formData.brand} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                id="purchase_date"
                name="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
              <Input
                id="warranty_expiry"
                name="warranty_expiry"
                type="date"
                value={formData.warranty_expiry}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_maintenance">Last Maintenance</Label>
              <Input
                id="last_maintenance"
                name="last_maintenance"
                type="date"
                value={formData.last_maintenance}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance_interval_days">Maintenance Interval</Label>
              <Select
                value={formData.maintenance_interval_days.toString()}
                onValueChange={(value) => handleSelectChange("maintenance_interval_days", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  {MAINTENANCE_INTERVALS.map((interval) => (
                    <SelectItem key={interval.value} value={interval.value}>
                      {interval.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
