"use client"

import { useState, useEffect } from "react"
import { useGymContext } from "@/lib/gym-context"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"

export default function EditAssignmentModal({ open, onClose, onSuccess, assignment }) {
  const { currentSubaccountId } = useGymContext()
  const [loading, setLoading] = useState(false)
  const [trainers, setTrainers] = useState([])
  const [members, setMembers] = useState([])
  const [formData, setFormData] = useState({
    trainer_id: "",
    member_id: "",
    notes: "",
    is_active: true,
  })

  useEffect(() => {
    if (open && assignment && currentSubaccountId) {
      loadTrainers()
      loadMembers()

      // Set form data from assignment
      setFormData({
        trainer_id: assignment.trainer_id || "",
        member_id: assignment.member_id || "",
        notes: assignment.notes || "",
        is_active: assignment.is_active ?? true,
      })
    }
  }, [open, assignment, currentSubaccountId])

  const loadTrainers = async () => {
    try {
      // Get trainer role ID
      const { data: roles, error: roleError } = await supabase.from("roles").select("id, name").eq("name", "TRAINER")

      if (roleError) {
        console.error("Error fetching trainer roles:", roleError)
        throw roleError
      }

      if (!roles || roles.length === 0) {
        console.log("No trainer role found")
        setTrainers([])
        return
      }

      const trainerRoleId = roles[0].id

      // Get user_accounts with trainer role for this subaccount
      const { data: userAccounts, error: userAccountsError } = await supabase
        .from("user_accounts")
        .select(`
          id,
          user_id,
          role_id
        `)
        .eq("subaccount_id", currentSubaccountId)
        .eq("role_id", trainerRoleId)

      if (userAccountsError) {
        console.error("Error fetching user accounts:", userAccountsError)
        throw userAccountsError
      }

      if (!userAccounts || userAccounts.length === 0) {
        console.log("No trainer user accounts found")
        setTrainers([])
        return
      }

      // Get user details for trainers
      const userIds = userAccounts.map((ua) => ua.user_id).filter(Boolean)

      if (userIds.length === 0) {
        setTrainers([])
        return
      }

      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", userIds)

      if (usersError) {
        console.error("Error fetching users:", usersError)
        throw usersError
      }

      // Combine data - use user.id as the trainer_id (not user_account.id)
      const trainersWithDetails = userAccounts.map((ua) => {
        const user = users?.find((u) => u.id === ua.user_id)
        return {
          id: ua.user_id, // Use user_id as the trainer_id (this references users.id)
          user_account_id: ua.id,
          users: user || { name: "Unknown", email: "unknown@email.com" },
        }
      })

      console.log("Final trainers data for edit modal:", trainersWithDetails)
      setTrainers(trainersWithDetails)
    } catch (error) {
      console.error("Error loading trainers:", error)
      toast({
        title: "Error",
        description: "Failed to load trainers",
        variant: "destructive",
      })
      setTrainers([])
    }
  }

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("id, name, email")
        .eq("subaccount_id", currentSubaccountId)
        .eq("is_active", true)
        .order("name")

      if (error) throw error

      setMembers(data || [])
    } catch (error) {
      console.error("Error loading members:", error)
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive",
      })
      setMembers([])
    }
  }

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.trainer_id) {
      toast({
        title: "Error",
        description: "Please select a trainer",
        variant: "destructive",
      })
      return
    }

    if (!formData.member_id) {
      toast({
        title: "Error",
        description: "Please select a member",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Validate that the trainer_id exists in users table
      const { data: trainerExists, error: trainerCheckError } = await supabase
        .from("users")
        .select("id")
        .eq("id", formData.trainer_id)
        .single()

      if (trainerCheckError || !trainerExists) {
        console.error("Trainer validation failed:", trainerCheckError)
        throw new Error("Selected trainer is not valid. Please refresh and try again.")
      }

      // Validate that the member_id exists in members
      const { data: memberExists, error: memberCheckError } = await supabase
        .from("members")
        .select("id")
        .eq("id", formData.member_id)
        .single()

      if (memberCheckError || !memberExists) {
        console.error("Member validation failed:", memberCheckError)
        throw new Error("Selected member is not valid. Please refresh and try again.")
      }

      const assignmentData = {
        trainer_id: formData.trainer_id, // This references users.id
        member_id: formData.member_id,
        notes: formData.notes.trim() || null,
        is_active: formData.is_active,
      }

      console.log("Updating assignment with data:", assignmentData)

      const { data, error } = await supabase
        .from("trainer_assignments")
        .update(assignmentData)
        .eq("id", assignment.id)
        .select()
        .single()

      if (error) throw error

      console.log("Assignment updated successfully:", data)

      toast({
        title: "Success",
        description: "Trainer assignment updated successfully",
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error updating assignment:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update assignment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!assignment) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Trainer Assignment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="trainer_id">Trainer *</Label>
            <Select value={formData.trainer_id} onValueChange={(value) => handleChange("trainer_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select trainer" />
              </SelectTrigger>
              <SelectContent>
                {trainers.map((trainer) => (
                  <SelectItem key={trainer.id} value={trainer.id}>
                    {trainer.users?.name || "Unknown Trainer"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {trainers.length === 0 && (
              <p className="text-sm text-gray-500">No trainers found. Please add trainers first.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="member_id">Member *</Label>
            <Select value={formData.member_id} onValueChange={(value) => handleChange("member_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {members.length === 0 && (
              <p className="text-sm text-gray-500">No active members found. Please add members first.</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange("is_active", checked)}
            />
            <Label htmlFor="is_active">Active Assignment</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
              placeholder="Additional notes about this assignment..."
            />
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
