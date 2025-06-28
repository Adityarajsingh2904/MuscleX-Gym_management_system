"use client"

import { useState, useEffect } from "react"
import { useGym } from "@/lib/gym-context"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { getCurrencySymbol } from "@/lib/currency"

const EXPENSE_TYPES = ["maintenance", "rent", "utility", "equipment", "marketing", "salary", "insurance", "other"]

export default function EditExpenseModal({ open, onClose, onSuccess, expense }) {
  const gymContext = useGym()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    expense_type: "",
    description: "",
    incurred_on: "",
    receipt_url: "",
  })

  // Get the current subaccount ID from multiple possible sources
  const currentSubaccountId =
    gymContext?.currentSubaccountId ||
    gymContext?.currentSubaccount?.id ||
    localStorage.getItem("current_subaccount_id")

  useEffect(() => {
    if (expense && open) {
      setFormData({
        title: expense.title || "",
        amount: expense.amount?.toString() || "",
        expense_type: expense.expense_type || "",
        description: expense.description || "",
        incurred_on: expense.incurred_on || "",
        receipt_url: expense.receipt_url || "",
      })
    }
  }, [expense, open])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title || !formData.amount) {
      toast({
        title: "Error",
        description: "Title and amount are required",
        variant: "destructive",
      })
      return
    }

    if (!expense?.id) {
      toast({
        title: "Error",
        description: "No expense selected for editing",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Prepare expense data
      const expenseData = {
        title: formData.title.trim(),
        amount: Number.parseFloat(formData.amount),
        expense_type: formData.expense_type || null,
        description: formData.description?.trim() || null,
        incurred_on: formData.incurred_on,
        receipt_url: formData.receipt_url?.trim() || null,
      }

      console.log("Updating expense data:", expenseData)

      // Update the expense
      const { data, error } = await supabase.from("expenses").update(expenseData).eq("id", expense.id).select().single()

      if (error) {
        console.error("Database error:", error)
        throw error
      }

      console.log("Expense updated successfully:", data)

      toast({
        title: "Success",
        description: "Expense updated successfully",
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error updating expense:", error)

      let errorMessage = "Failed to update expense"

      if (error.message.includes("violates")) {
        errorMessage = "Data validation failed. Please check your input and try again."
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Monthly Rent"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({getCurrencySymbol()}) *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense_type">Category</Label>
              <Select
                value={formData.expense_type}
                onValueChange={(value) => handleSelectChange("expense_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="incurred_on">Date</Label>
              <Input
                id="incurred_on"
                name="incurred_on"
                type="date"
                value={formData.incurred_on}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt_url">Receipt URL (optional)</Label>
            <Input
              id="receipt_url"
              name="receipt_url"
              type="url"
              placeholder="https://..."
              value={formData.receipt_url}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Additional details about this expense..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
