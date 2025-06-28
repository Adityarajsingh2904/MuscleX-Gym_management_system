"use client"

import { useState } from "react"
import { useGym } from "@/lib/gym-context"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { getCurrencySymbol } from "@/lib/currency"

const EXPENSE_TYPES = ["maintenance", "rent", "utility", "equipment", "marketing", "salary", "insurance", "other"]

export default function AddExpenseModal({ open, onClose, onSuccess }) {
  const gymContext = useGym()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    expense_type: "",
    description: "",
    incurred_on: new Date().toISOString().split("T")[0],
    receipt_url: "",
  })

  // Get the current subaccount ID from multiple possible sources
  const currentSubaccountId =
    gymContext?.currentSubaccountId ||
    gymContext?.currentSubaccount?.id ||
    localStorage.getItem("current_subaccount_id")

  console.log("Add expense modal - current subaccount ID:", currentSubaccountId)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const getCurrentUserAccount = async (subaccountId) => {
    try {
      // Get the current logged in user using the same client as header
      const {
        data: { user },
      } = await supabase.auth.getUser()

      console.log("Current user:", user)

      if (user?.email) {
        console.log("Trying to find user_account for:", user.email)

        // Find the user record that matches the authenticated user's email
        const { data: userRecord, error: userError } = await supabase
          .from("users")
          .select("id, name, email")
          .eq("email", user.email)
          .maybeSingle()

        console.log("User record lookup result:", userRecord, userError)

        if (!userError && userRecord) {
          console.log("Found user record:", userRecord.id, userRecord.name)

          // Get the user_account for this specific user and subaccount
          const { data: userAccount, error: userAccountError } = await supabase
            .from("user_accounts")
            .select("id, role_id")
            .eq("subaccount_id", subaccountId)
            .eq("user_id", userRecord.id)
            .maybeSingle()

          console.log("User account lookup result:", userAccount, userAccountError)

          if (!userAccountError && userAccount) {
            console.log("Found current user's user_account:", userAccount.id)
            return userAccount.id
          }
        }
      }

      // Fallback: Get any user_account for this subaccount
      console.log("Using fallback - getting any user_account for subaccount")

      const { data: anyUserAccount, error: anyUserAccountError } = await supabase
        .from("user_accounts")
        .select("id")
        .eq("subaccount_id", subaccountId)
        .limit(1)
        .single()

      if (anyUserAccountError || !anyUserAccount) {
        throw new Error("No user accounts found for this gym. Please contact support.")
      }

      console.log("Using fallback user_account:", anyUserAccount.id)
      return anyUserAccount.id
    } catch (error) {
      console.error("Error getting user account:", error)
      throw error
    }
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

    if (!currentSubaccountId) {
      toast({
        title: "Error",
        description: "No gym selected. Please select a gym first.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Get the user_account_id (either current user's or fallback)
      const userAccountId = await getCurrentUserAccount(currentSubaccountId)

      // Prepare expense data
      const expenseData = {
        title: formData.title.trim(),
        amount: Number.parseFloat(formData.amount),
        expense_type: formData.expense_type || null,
        description: formData.description?.trim() || null,
        incurred_on: formData.incurred_on,
        receipt_url: formData.receipt_url?.trim() || null,
        subaccount_id: currentSubaccountId,
        created_by: userAccountId,
      }

      console.log("Inserting expense data:", expenseData)

      // Insert the expense
      const { data, error } = await supabase.from("expenses").insert(expenseData).select().single()

      if (error) {
        console.error("Database error:", error)
        throw error
      }

      console.log("Expense created successfully:", data)

      toast({
        title: "Success",
        description: "Expense added successfully",
      })

      // Reset form
      setFormData({
        title: "",
        amount: "",
        expense_type: "",
        description: "",
        incurred_on: new Date().toISOString().split("T")[0],
        receipt_url: "",
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error adding expense:", error)

      let errorMessage = "Failed to add expense"
      if (error.message) {
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
          <DialogTitle>Add New Expense</DialogTitle>
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
              {loading ? "Adding..." : "Add Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
