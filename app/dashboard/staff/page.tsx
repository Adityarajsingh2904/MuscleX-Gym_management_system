"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Download, Edit, Trash2, Eye, Users, Shield, Mail, Loader2, Plus, Star, Calendar } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { InviteManagerModal } from "@/components/managers/invite-manager-modal"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useGymContext } from "@/lib/gym-context"
import type { Trainer } from "@/types/gym"

interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  role: {
    name: string
  }
  subaccount: {
    id: string
    name: string
    location: string
  }
  user_accounts: {
    is_owner: boolean
  }[]
  is_active: boolean
  created_at: string
  // Trainer specific fields
  specializations?: string[]
  certifications?: string[]
  experience?: string
  rating?: number
  hourlyRate?: number
  bio?: string
  joinDate?: string
  status?: string
}

interface Invitation {
  id: string
  email: string
  role: {
    name: string
  }
  subaccount: {
    name: string
    location: string
  }
  status: {
    name: string
  }
  invited_at: string
}

export default function StaffPage() {
  const { currentSubaccountId } = useGymContext()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    if (currentSubaccountId) {
      loadData()
    }
  }, [currentSubaccountId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      setCurrentUser(user)

      // Load database staff (including current user)
      const { data: staffData, error: staffError } = await supabase
        .from("users")
        .select(`
          id,
          name,
          email,
          phone,
          is_active,
          created_at,
          role:roles(name),
          subaccount:subaccounts(id, name, location),
          user_accounts!inner(is_owner)
        `)
        .eq("subaccount_id", currentSubaccountId)
      // Removed the .neq("id", user.id) filter to include current user

      if (staffError) {
        console.error("Error loading staff:", staffError)
        setError("Error loading staff")
        return
      }

      setStaff(staffData || [])

      // Load trainers from localStorage (existing trainer data)
      const savedTrainers = JSON.parse(localStorage.getItem("gym_trainers") || "[]")
      setTrainers(savedTrainers)

      // Get pending invitations only (exclude accepted/completed ones)
      const { data: invitationsData, error: invitationsError } = await supabase
        .from("user_invitations")
        .select(`
          id,
          email,
          invited_at,
          role:roles(name),
          subaccount:subaccounts(name, location),
          status:status(name)
        `)
        .eq("subaccount_id", currentSubaccountId)
        .in("status.name", ["pending", "sent"]) // Only show pending/sent, not accepted/completed
        .neq("status.name", "accepted")
        .neq("status.name", "completed")
        .neq("status.name", "used")

      console.log("Invitations data:", invitationsData) // Debug log to see what we're getting

      if (invitationsError) {
        console.error("Error loading invitations:", invitationsError)
      } else {
        console.log(
          "All invitations with status:",
          invitationsData?.map((inv) => ({
            email: inv.email,
            status: inv.status?.name,
          })),
        )
        setInvitations(invitationsData || [])
      }
    } catch (err) {
      console.error("Error:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Combine staff and trainers for filtering
  const allStaff = [
    ...staff.map((s) => ({
      ...s,
      type: "database",
      role_name: s.role?.name || "STAFF",
      is_current_user: s.id === currentUser?.id,
    })),
    ...trainers.map((t) => ({
      ...t,
      type: "trainer",
      role_name: "TRAINER",
      is_active: t.status === "active",
      created_at: t.joinDate,
      is_current_user: false,
    })),
  ]

  const filteredStaff = allStaff.filter((member) => {
    const matchesSearch =
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.type === "trainer" &&
        member.specializations?.some((spec: string) => spec.toLowerCase().includes(searchTerm.toLowerCase())))

    const matchesRole = filterRole === "all" || member.role_name === filterRole
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && member.is_active) ||
      (filterStatus === "inactive" && !member.is_active)

    return matchesSearch && matchesRole && matchesStatus
  })

  const handleInviteStaff = async (inviteData: any) => {
    console.log("Staff invited:", inviteData)
    await loadData()
    setShowInviteModal(false)
  }

  const exportCSV = () => {
    const headers = ["Name", "Email", "Role", "Status", "Join Date"]
    const csvContent = [
      headers.join(","),
      ...filteredStaff.map((member) =>
        [
          member.name || "",
          member.email || "",
          member.role_name || "",
          member.is_active ? "Active" : "Inactive",
          member.created_at ? new Date(member.created_at).toLocaleDateString() : "",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "staff.csv"
    a.click()
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "MANAGER":
        return "bg-blue-100 text-blue-800"
      case "TRAINER":
        return "bg-green-100 text-green-800"
      case "OWNER":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const columns = [
    {
      header: "Staff Member",
      accessorKey: "name",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-600 font-medium">
              {(row.original.name || row.original.email || "U").charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium">
              {row.original.name || "No name"}
              {row.original.is_current_user && (
                <Badge variant="outline" className="ml-2 bg-indigo-100 text-indigo-800">
                  You
                </Badge>
              )}
            </div>
            <div className="text-sm text-gray-500">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Role",
      accessorKey: "role_name",
      cell: ({ row }: any) => (
        <Badge variant="outline" className={getRoleColor(row.original.role_name || "")}>
          {row.original.role_name || "No role"}
        </Badge>
      ),
    },
    {
      header: "Details",
      accessorKey: "details",
      cell: ({ row }: any) => {
        if (row.original.type === "trainer") {
          return (
            <div>
              <div className="flex flex-wrap gap-1 mb-1">
                {row.original.specializations?.slice(0, 2).map((spec: string) => (
                  <Badge key={spec} variant="outline" className="text-xs">
                    {spec}
                  </Badge>
                ))}
                {row.original.specializations?.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{row.original.specializations.length - 2}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-500">{row.original.experience}</div>
            </div>
          )
        } else {
          return (
            <div>
              <div className="font-medium">{row.original.subaccount?.name || "No franchise"}</div>
              <div className="text-sm text-gray-500">{row.original.subaccount?.location || ""}</div>
            </div>
          )
        }
      },
    },
    {
      header: "Status",
      accessorKey: "is_active",
      cell: ({ row }: any) => (
        <Badge
          variant={row.original.is_active ? "default" : "secondary"}
          className={row.original.is_active ? "bg-green-100 text-green-800" : ""}
        >
          {row.original.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Join Date",
      accessorKey: "created_at",
      cell: ({ row }: any) =>
        row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : "N/A",
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading staff...</span>
      </div>
    )
  }

  // Count totals including current user
  const totalStaff = allStaff.length
  const managerCount = allStaff.filter((s) => s.role_name === "MANAGER").length
  const trainerCount = allStaff.filter((s) => s.role_name === "TRAINER").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff</h1>
          <p className="text-gray-600">Manage your gym staff, trainers, and team members</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => setShowInviteModal(true)} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-2 h-4 w-4" />
            Invite Staff
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">{totalStaff}</p>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Invitations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invitations.filter((invitation) => invitation.status?.name === "pending").length}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-yellow-100 text-yellow-600">
                <Mail className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Managers</p>
                <p className="text-2xl font-bold text-gray-900">{managerCount}</p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                <Shield className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trainers</p>
                <p className="text-2xl font-bold text-gray-900">{trainerCount}</p>
              </div>
              <div className="p-3 rounded-2xl bg-green-100 text-green-600">
                <Star className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invitations */}
      {invitations.filter((invitation) => invitation.status?.name === "pending").length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Pending Invitations ({invitations.filter((invitation) => invitation.status?.name === "pending").length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations
                .filter((invitation) => invitation.status?.name === "pending")
                .map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                  >
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-yellow-600" />
                      <div>
                        <div className="font-medium">{invitation.email}</div>
                        <div className="text-sm text-gray-500">
                          {invitation.role.name} • {invitation.subaccount.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Sent {new Date(invitation.invited_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Roles</option>
              <option value="MANAGER">Manager</option>
              <option value="TRAINER">Trainer</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button variant="outline" onClick={exportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Staff ({filteredStaff.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredStaff} searchKey="name" />
        </CardContent>
      </Card>

      {/* Single Invite Modal for All Staff Types */}
      <InviteManagerModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInviteStaff}
      />
    </div>
  )
}
