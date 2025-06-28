"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Edit, Trash2, Eye, Users, DollarSign, MapPin, Loader2, Plus, Store, CreditCard, ExternalLink, MoreHorizontal } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { EditFranchiseModal } from "@/components/franchises/edit-franchise-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { useGymContext } from "@/lib/gym-context"
import { getCurrencySymbol } from "@/lib/currency"
import { toast } from "@/components/ui/use-toast"
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

export default function FranchisesPage() {
  const { currentAccountId, currentSubaccountId } = useGymContext()
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [editingFranchise, setEditingFranchise] = useState<Franchise | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creatingFranchise, setCreatingFranchise] = useState(false)
  const [newFranchise, setNewFranchise] = useState({
    name: "",
    location: "",
  })

  useEffect(() => {
    if (currentAccountId) {
      loadFranchises()
    }
  }, [currentAccountId])

  const loadFranchises = async () => {
    if (!currentAccountId) return

    try {
      setLoading(true)

      // Fetch subaccounts (franchises) for current account
      const { data: subaccounts, error: subaccountsError } = await supabase
        .from("subaccounts")
        .select(`
          id,
          name,
          location,
          account_id,
          created_at
        `)
        .eq("account_id", currentAccountId)
        .order("created_at", { ascending: false })

      if (subaccountsError) {
        console.error("Error fetching franchises:", subaccountsError)
        toast({
          title: "Error",
          description: "Failed to load franchises",
          variant: "destructive",
        })
        return
      }

      // For each franchise, get member count and revenue
      const franchisesWithStats = await Promise.all(
        (subaccounts || []).map(async (franchise) => {
          // Get member count
          const { data: members, error: membersError } = await supabase
            .from("members")
            .select("id")
            .eq("subaccount_id", franchise.id)

          const memberCount = members?.length || 0

          // Get revenue from payments
          const { data: payments, error: paymentsError } = await supabase
            .from("payments")
            .select(`
              final_amount,
              member:members!inner(subaccount_id)
            `)
            .eq("member.subaccount_id", franchise.id)

          const revenue =
            payments?.reduce((sum, payment) => {
              return sum + Number(payment.final_amount || 0)
            }, 0) || 0

          // Get manager info (owner of this franchise)
          const { data: managerData } = await supabase
            .from("user_accounts")
            .select(`
              user_id,
              users:users(id, name, email)
            `)
            .eq("subaccount_id", franchise.id)
            .eq("is_owner", true)
            .single()

          const manager = managerData?.users
            ? {
                id: managerData.users.id,
                name: managerData.users.name || managerData.users.email,
                email: managerData.users.email,
              }
            : undefined

          return {
            ...franchise,
            memberCount,
            revenue,
            manager,
          }
        }),
      )

      setFranchises(franchisesWithStats)
    } catch (error) {
      console.error("Error loading franchises:", error)
      toast({
        title: "Error",
        description: "Failed to load franchise data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFranchise = async () => {
    if (!currentAccountId || creatingFranchise) return

    setCreatingFranchise(true)

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Check if franchise with same name already exists for this account
      const { data: existingFranchise } = await supabase
        .from("subaccounts")
        .select("id")
        .eq("account_id", currentAccountId)
        .eq("name", newFranchise.name)
        .single()

      if (existingFranchise) {
        toast({
          title: "Error",
          description: "A franchise with this name already exists",
          variant: "destructive",
        })
        return
      }

      // Get OWNER role ID
      const { data: ownerRole } = await supabase.from("roles").select("id").eq("name", "OWNER").single()

      if (!ownerRole) {
        toast({
          title: "Error",
          description: "Error getting owner role",
          variant: "destructive",
        })
        return
      }

      // Create new subaccount
      const { data: newSubaccountData, error: subaccountError } = await supabase
        .from("subaccounts")
        .insert({
          account_id: currentAccountId,
          name: newFranchise.name,
          location: newFranchise.location,
        })
        .select()
        .single()

      if (subaccountError) {
        console.error("Error creating subaccount:", subaccountError)
        toast({
          title: "Error",
          description: "Error creating franchise",
          variant: "destructive",
        })
        return
      }

      // Create user_account entry for this new subaccount
      const { error: userAccountError } = await supabase.from("user_accounts").insert({
        user_id: user.id,
        account_id: currentAccountId,
        subaccount_id: newSubaccountData.id,
        role_id: ownerRole.id,
        is_owner: true,
      })

      if (userAccountError) {
        console.error("Error creating user account:", userAccountError)
        toast({
          title: "Error",
          description: "Error linking user to franchise",
          variant: "destructive",
        })
        return
      }

      // Close dialog and reset form
      setShowCreateModal(false)
      setNewFranchise({
        name: "",
        location: "",
      })

      toast({
        title: "Success",
        description: "Franchise created successfully",
      })

      // Reload franchises
      await loadFranchises()
    } catch (error) {
      console.error("Error creating franchise:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setCreatingFranchise(false)
    }
  }

  const handleEditFranchise = (franchise: Franchise) => {
    setEditingFranchise(franchise)
    setShowEditModal(true)
  }

  const handleUpdateFranchise = async (franchiseId: string, updatedData: { name: string; location: string }) => {
    try {
      const { error } = await supabase
        .from("subaccounts")
        .update({
          name: updatedData.name,
          location: updatedData.location,
        })
        .eq("id", franchiseId)

      if (error) {
        console.error("Error updating franchise:", error)
        toast({
          title: "Error",
          description: "Failed to update franchise",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Franchise updated successfully",
      })

      // Reload franchises
      await loadFranchises()
      setShowEditModal(false)
      setEditingFranchise(null)
    } catch (error) {
      console.error("Error updating franchise:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleDeleteFranchise = async (franchiseId: string) => {
    if (!confirm("Are you sure you want to delete this franchise? This action cannot be undone.")) {
      return
    }

    try {
      const { error } = await supabase.from("subaccounts").delete().eq("id", franchiseId)

      if (error) {
        console.error("Error deleting franchise:", error)
        toast({
          title: "Error",
          description: "Failed to delete franchise",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Franchise deleted successfully",
      })

      // Reload franchises
      await loadFranchises()
    } catch (error) {
      console.error("Error deleting franchise:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  // Filter franchises based on search term
  const filteredFranchises = franchises.filter((franchise) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      franchise.name.toLowerCase().includes(searchLower) ||
      franchise.location.toLowerCase().includes(searchLower) ||
      franchise.manager?.name.toLowerCase().includes(searchLower) ||
      franchise.manager?.email.toLowerCase().includes(searchLower)
    )
  })

  // Calculate stats
  const totalMembers = franchises.reduce((sum, f) => sum + f.memberCount, 0)
  const totalRevenue = franchises.reduce((sum, f) => sum + f.revenue, 0)
  const activeFranchises = franchises.length // All fetched franchises are considered active

  const columns = [
    {
      header: "Franchise",
      accessorKey: "name",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-medium">{row.original.name.charAt(0)}</span>
          </div>
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-sm text-gray-500 flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              {row.original.location}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Manager",
      accessorKey: "manager",
      cell: ({ row }: any) => (
        <div>
          {row.original.manager ? (
            <div>
              <div className="font-medium">{row.original.manager.name}</div>
              <div className="text-sm text-gray-500">{row.original.manager.email}</div>
            </div>
          ) : (
            <Badge variant="outline" className="text-orange-600">
              Not Assigned
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: "Members",
      accessorKey: "memberCount",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-1">
          <Users className="h-4 w-4 text-gray-400" />
          <span>{row.original.memberCount}</span>
        </div>
      ),
    },
    {
      header: "Revenue",
      accessorKey: "revenue",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-1">
          {/* <DollarSign className="h-4 w-4 text-gray-400" /> */}
          <span>{getCurrencySymbol()}{row.original.revenue.toLocaleString()}</span>
        </div>
      ),
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditFranchise(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDeleteFranchise(row.original.id)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (!currentAccountId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">No Gym Selected</h3>
          <p className="text-gray-500">Please select a gym to view franchises</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Franchises</h1>
            <p className="text-gray-600">Manage your gym franchises and locations</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading franchises...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Franchises</h1>
          <p className="text-gray-600">Manage your gym franchises and locations</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <Button variant={viewMode === "cards" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("cards")}>
              Cards
            </Button>
            <Button variant={viewMode === "table" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("table")}>
              Table
            </Button>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Franchise
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Franchises</p>
                <p className="text-2xl font-bold text-gray-900">{franchises.length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                <MapPin className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Franchises</p>
                <p className="text-2xl font-bold text-gray-900">{activeFranchises}</p>
              </div>
              <div className="p-3 rounded-2xl bg-green-100 text-green-600">
                <MapPin className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{totalMembers.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-100 text-purple-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{getCurrencySymbol()}{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-2xl bg-teal-100 text-teal-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search franchises by name, location, or manager..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Franchises Display */}
      {filteredFranchises.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Franchises Found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? "No franchises match your search criteria." : "You don't have any franchises yet."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Franchise
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredFranchises.map((franchise) => (
            <Card key={franchise.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-lg">{franchise.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{franchise.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {franchise.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditFranchise(franchise)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDeleteFranchise(franchise.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Manager</span>
                    <span className="text-sm font-medium">
                      {franchise.manager ? franchise.manager.name : "Not Assigned"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Members</span>
                    <span className="text-sm font-medium">{franchise.memberCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Revenue</span>
                    <span className="text-sm font-medium">{getCurrencySymbol()}{franchise.revenue.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Franchises ({filteredFranchises.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={filteredFranchises} searchKey="name" />
          </CardContent>
        </Card>
      )}

      {/* Create Franchise Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Franchise</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="franchiseName">Franchise Name</Label>
              <Input
                id="franchiseName"
                value={newFranchise.name}
                onChange={(e) => setNewFranchise({ ...newFranchise, name: e.target.value })}
                placeholder="Downtown Branch"
                required
                disabled={creatingFranchise}
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="franchiseLocation">Address/Location</Label>
              <Textarea
                id="franchiseLocation"
                value={newFranchise.location}
                onChange={(e) => setNewFranchise({ ...newFranchise, location: e.target.value })}
                placeholder="123 Fitness Street, Gym City, GC 12345"
                required
                disabled={creatingFranchise}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={creatingFranchise}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateFranchise}
              disabled={!newFranchise.name || !newFranchise.location || creatingFranchise}
            >
              {creatingFranchise ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Store className="mr-2 h-4 w-4" />
                  Add Franchise
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      {editingFranchise && (
        <EditFranchiseModal
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingFranchise(null)
          }}
          franchise={editingFranchise}
          onUpdate={handleUpdateFranchise}
        />
      )}
    </div>
  )
}
