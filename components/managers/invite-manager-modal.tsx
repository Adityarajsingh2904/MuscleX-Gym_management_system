"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Mail, Copy, Check, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Subaccount {
  id: string
  name: string
  location: string
  account_id: string
}

interface InviteManagerModalProps {
  open: boolean
  onClose: () => void
  onInvite: (inviteData: any) => void
}

export function InviteManagerModal({ open, onClose, onInvite }: InviteManagerModalProps) {
  const [formData, setFormData] = useState({
    email: "",
    role: "MANAGER",
    subaccountId: "",
    message: "",
    permissions: [] as string[],
  })
  const [subaccounts, setSubaccounts] = useState<Subaccount[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [inviteLink, setInviteLink] = useState("")
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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
      loadData()
    }
  }, [open])

  const loadData = async () => {
    try {
      setLoading(true)

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get user's subaccounts (franchises)
      const { data: userAccountsData, error: userAccountsError } = await supabase
        .from("user_accounts")
        .select(`
          subaccount_id,
          is_owner,
          subaccount:subaccounts(id, name, location, account_id)
        `)
        .eq("user_id", user.id)
        .eq("is_owner", true) // Only show subaccounts where user is owner

      if (userAccountsError) {
        console.error("Error fetching subaccounts:", userAccountsError)
        return
      }

      if (userAccountsData) {
        const subaccountsData = userAccountsData.map((ua) => ua.subaccount).filter(Boolean) as Subaccount[]
        setSubaccounts(subaccountsData)
      }

      // Get available roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("roles")
        .select("*")
        .in("name", ["MANAGER", "TRAINER"])

      if (rolesError) {
        console.error("Error fetching roles:", rolesError)
        return
      }

      if (rolesData) {
        setRoles(rolesData)
      }

      // Generate invite token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      setInviteLink(`${window.location.origin}/select-gym?token=${token}`)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!formData.subaccountId) {
      newErrors.subaccountId = "Please select a franchise"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || submitting) {
      return
    }

    setSubmitting(true)

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        console.error("No authenticated user found")
        setErrors({ general: "User not authenticated" })
        return
      }

      console.log("Current user:", user.id)

      // Get the role ID
      const selectedRole = roles.find((r) => r.name === formData.role)
      if (!selectedRole) {
        setErrors({ general: "Invalid role selected" })
        return
      }

      // Get pending status ID with better error handling
      const { data: statusData, error: statusError } = await supabase.from("status").select("id").eq("name", "pending")

      if (statusError) {
        console.error("Status query error:", statusError)
        setErrors({ general: `Error getting status information: ${statusError.message}` })
        return
      }

      if (!statusData || statusData.length === 0) {
        console.error("No pending status found")
        setErrors({ general: "Pending status not found in database" })
        return
      }

      const pendingStatus = statusData[0]

      // Check if invitation already exists for this email and subaccount
      const { data: existingInvitation, error: checkError } = await supabase
        .from("user_invitations")
        .select("id, status:status(name)")
        .eq("email", formData.email)
        .eq("subaccount_id", formData.subaccountId)
        .eq("status.name", "pending")

      if (checkError) {
        console.error("Error checking existing invitations:", checkError)
        setErrors({ general: "Error checking existing invitations" })
        return
      }

      if (existingInvitation && existingInvitation.length > 0) {
        setErrors({ email: "An invitation is already pending for this email and franchise" })
        return
      }

      // Generate unique token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      // Create invitation
      const { data: invitationData, error: invitationError } = await supabase
        .from("user_invitations")
        .insert({
          subaccount_id: formData.subaccountId,
          email: formData.email,
          role_id: selectedRole.id,
          status_id: pendingStatus.id,
          token: token,
          invited_by: user.id,
          invited_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (invitationError) {
        console.error("Error creating invitation:", invitationError)
        setErrors({ general: "Error creating invitation" })
        return
      }

      const selectedSubaccount = subaccounts.find((s) => s.id === formData.subaccountId)

      const inviteData = {
        id: invitationData.id,
        email: formData.email,
        role: formData.role,
        subaccountId: formData.subaccountId,
        subaccountName: selectedSubaccount?.name || "",
        message: formData.message,
        inviteLink: `${window.location.origin}/select-gym?token=${token}`,
        token: token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      }

      onInvite(inviteData)

      // Reset form
      setFormData({
        email: "",
        role: "MANAGER",
        subaccountId: "",
        message: "",
        permissions: [],
      })
      setErrors({})
    } catch (error) {
      console.error("Error sending invitation:", error)
      setErrors({ general: "An unexpected error occurred" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      email: "",
      role: "MANAGER",
      subaccountId: "",
      message: "",
      permissions: [],
    })
    setErrors({})
    setCopied(false)
    setSubmitting(false)
    onClose()
  }

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy link:", err)
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Manager
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join your team as a manager with access to a specific franchise.
          </DialogDescription>
        </DialogHeader>

        {errors.general && (
          <Alert variant="destructive">
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invitation Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Invitation Details</h3>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
                className={errors.email ? "border-red-500" : ""}
                disabled={submitting}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange("role", value)}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="TRAINER">Trainer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subaccount">Franchise *</Label>
                <Select
                  value={formData.subaccountId}
                  onValueChange={(value) => handleInputChange("subaccountId", value)}
                  disabled={submitting}
                >
                  <SelectTrigger className={errors.subaccountId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select franchise" />
                  </SelectTrigger>
                  <SelectContent>
                    {subaccounts.map((subaccount) => (
                      <SelectItem key={subaccount.id} value={subaccount.id}>
                        <div className="flex flex-col">
                          <span>{subaccount.name}</span>
                          <span className="text-sm text-gray-500">{subaccount.location}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subaccountId && <p className="text-sm text-red-500">{errors.subaccountId}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                placeholder="Add a personal message to the invitation..."
                rows={3}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Invite Link Preview */}
          {formData.email && formData.subaccountId && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Invitation Link</h3>
              <div className="flex items-center space-x-2">
                <Input value={inviteLink} readOnly className="flex-1 bg-gray-50" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={copyInviteLink}
                  className="flex items-center gap-2"
                  disabled={submitting}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                This link will expire in 7 days. The invited user can use this link to join your team.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
