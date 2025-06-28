"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Download, Edit, Trash2, Eye, Users, Shield, Mail, Loader2 } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { InviteManagerModal } from "@/components/managers/invite-manager-modal"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Manager {
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

export default function ManagersPage() {
  const [managers, setManagers] = useState<Manager[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get user's subaccounts (where they are owner)
      const { data: userAccountsData, error: userAccountsError } = await supabase
        .from("user_accounts")
        .select("subaccount_id")
        .eq("user_id", user.id)
        .eq("is_owner", true)

      if (userAccountsError) {
        setError("Error loading user accounts")
        return
      }

      const subaccountIds = userAccountsData.map((ua) => ua.subaccount_id)

      if (subaccountIds.length === 0) {
        setManagers([])
        setInvitations([])
        return
      }

      // Get managers for these subaccounts
      const { data: managersData, error: managersError } = await supabase
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
        .in("subaccount_id", subaccountIds)
        .neq("id", user.id) // Exclude current user

      if (managersError) {
        console.error("Error loading managers:", managersError)
        setError("Error loading managers")
        return
      }

      setManagers(managersData || [])

      // Get pending invitations for these subaccounts
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
        .in("subaccount_id", subaccountIds)
        .eq("status.name", "pending")

      if (invitationsError) {
        console.error("Error loading invitations:", invitationsError)
      } else {
        setInvitations(invitationsData || [])
      }
    } catch (err) {
      console.error("Error:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const filteredManagers = managers.filter((manager) => {
    const matchesSearch =
      manager.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.subaccount?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = filterRole === "all" || manager.role?.name === filterRole
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && manager.is_active) ||
      (filterStatus === "inactive" && !manager.is_active)

    return matchesSearch && matchesRole && matchesStatus
  })

  const handleInviteManager = async (inviteData: any) => {
    console.log("Manager invited:", inviteData)
    // Reload data to show new invitation
    await loadData()
    setShowInviteModal(false)
  }

  const exportCSV = () => {
    const headers = ["Name", "Email", "Role", "Franchise", "Status", "Join Date"]
    const csvContent = [
      headers.join(","),
      ...filteredManagers.map((manager) =>
        [
          manager.name || "",
          manager.email || "",
          manager.role?.name || "",
          manager.subaccount?.name || "",
          manager.is_active ? "Active" : "Inactive",
          new Date(manager.created_at).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "managers.csv"
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
      header: "Manager",
      accessorKey: "name",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-600 font-medium">
              {(row.original.name || row.original.email || "U").charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium">{row.original.name || "No name"}</div>
            <div className="text-sm text-gray-500">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Role",
      accessorKey: "role",
      cell: ({ row }: any) => (
        <Badge variant="outline" className={getRoleColor(row.original.role?.name || "")}>
          {row.original.role?.name || "No role"}
        </Badge>
      ),
    },
    {
      header: "Franchise",
      accessorKey: "subaccount",
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.subaccount?.name || "No franchise"}</div>
          <div className="text-sm text-gray-500">{row.original.subaccount?.location || ""}</div>
        </div>
      ),
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
      cell: ({ row }: any) => new Date(row.original.created_at).toLocaleDateString(),
    },
    {
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-red-600">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading managers...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Managers</h1>
          <p className="text-gray-600">Manage franchise managers and their permissions</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setShowInviteModal(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Invite Manager
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
                <p className="text-sm font-medium text-gray-600">Total Managers</p>
                <p className="text-2xl font-bold text-gray-900">{managers.length}</p>
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
                <p className="text-sm font-medium text-gray-600">Active Managers</p>
                <p className="text-2xl font-bold text-gray-900">{managers.filter((m) => m.is_active).length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-green-100 text-green-600">
                <Shield className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Invitations</p>
                <p className="text-2xl font-bold text-gray-900">{invitations.length}</p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {managers.filter((m) => m.role?.name === "MANAGER").length}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                <Shield className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations ({invitations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
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
                placeholder="Search managers..."
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

      {/* Managers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Managers ({filteredManagers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredManagers} searchKey="name" />
        </CardContent>
      </Card>

      <InviteManagerModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInviteManager}
      />
    </div>
  )
}
