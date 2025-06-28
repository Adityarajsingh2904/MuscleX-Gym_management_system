"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import type { Invoice } from "@/types/gym"
import { formatCurrency } from "@/lib/currency"

interface CreateInvoiceModalProps {
  open: boolean
  onClose: () => void
  onCreate: (invoice: Omit<Invoice, "id">) => void
}

export function CreateInvoiceModal({ open, onClose, onCreate }: CreateInvoiceModalProps) {
  const [formData, setFormData] = useState({
    memberName: "",
    memberId: "",
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "",
  })

  const [items, setItems] = useState([{ description: "", amount: 0 }])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const total = items.reduce((sum, item) => sum + item.amount, 0)

    onCreate({
      ...formData,
      amount: total,
      status: "pending",
      issueDate: new Date().toISOString(),
      items: items.filter((item) => item.description && item.amount > 0),
    })

    // Reset form
    setFormData({
      memberName: "",
      memberId: "",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: "",
    })
    setItems([{ description: "", amount: 0 }])
  }

  const addItem = () => {
    setItems([...items, { description: "", amount: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: string | number) => {
    const updatedItems = items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    setItems(updatedItems)
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="memberName">Member Name *</Label>
              <Input
                id="memberName"
                value={formData.memberName}
                onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="memberId">Member ID</Label>
              <Input
                id="memberId"
                value={formData.memberId}
                onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          <div>
            <Label>Invoice Items</Label>
            <div className="space-y-3 mt-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={item.amount || ""}
                    onChange={(e) => updateItem(index, "amount", Number.parseFloat(e.target.value) || 0)}
                    className="w-32"
                  />
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={addItem} className="mt-3">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Amount:</span>
              <span className="text-xl font-bold text-green-600">{formatCurrency(total)}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Additional notes or terms..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Create Invoice
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
