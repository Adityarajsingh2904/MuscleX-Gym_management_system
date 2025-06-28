"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface Franchise {
  id: string
  name: string
  location: string
  account_id: string
  created_at: string
  memberCount: number
  revenue: number
  manager?: {
    id: string
    name: string
    email: string
  }
}

interface EditFranchiseModalProps {
  open: boolean
  onClose: () => void
  franchise: Franchise
  onUpdate: (franchiseId: string, data: { name: string; location: string }) => Promise<void>
}

export function EditFranchiseModal({ open, onClose, franchise, onUpdate }: EditFranchiseModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (franchise) {
      setFormData({
        name: franchise.name,
        location: franchise.location,
      })
    }
  }, [franchise])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.location.trim()) {
      return
    }

    setLoading(true)
    try {
      await onUpdate(franchise.id, formData)
    } catch (error) {
      console.error("Error updating franchise:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Franchise</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Franchise Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Downtown Branch"
                required
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location/Address</Label>
              <Textarea
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="123 Fitness Street, Gym City, GC 12345"
                required
                disabled={loading}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim() || !formData.location.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Franchise"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
