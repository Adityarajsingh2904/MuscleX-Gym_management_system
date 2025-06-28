"use client"

import { useState, useEffect } from "react"
import { useGymContext } from "@/lib/gym-context"
import { supabase } from "@/lib/supabase"
import { CreditCard, Edit, ExternalLink, MoreHorizontal, Plus, PlusCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { SkeletonLoader } from "@/components/dashboard/skeleton-loader"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import AddAssignmentModal from "@/components/trainer-assignments/add-assignment-modal"
import EditAssignmentModal from "@/components/trainer-assignments/edit-assignment-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function TrainerAssignmentsPage() {
  const { currentSubaccountId, isLoading: contextLoading } = useGymContext()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState([])
  const [filteredAssignments, setFilteredAssignments] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [trainerFilter, setTrainerFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [trainers, setTrainers] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState(null)

  useEffect(() => {
    if (currentSubaccountId && !contextLoading) {
      loadAssignments()
      loadTrainers()
    } else if (!contextLoading) {
      setLoading(false)
    }
  }, [currentSubaccountId, contextLoading])

  useEffect(() => {
    if (assignments.length > 0) {
      filterAssignments()
    }
  }, [searchQuery, trainerFilter, statusFilter, assignments])

  const loadAssignments = async () => {
    try {
      setLoading(true)

      // First, get all trainer assignments for this subaccount
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("trainer_assignments")
        .select(`
          id, 
          trainer_id,
          member_id,
          subaccount_id,
          assigned_at,
          notes,
          is_active
        `)
        .eq("subaccount_id", currentSubaccountId)
        .order("assigned_at", { ascending: false })

      if (assignmentsError) throw assignmentsError

      console.log("Raw assignments data:", assignmentsData)

      if (!assignmentsData || assignmentsData.length === 0) {
        console.log("No assignments found")
        setAssignments([])
        setFilteredAssignments([])
        return
      }

      // Get all unique trainer IDs (these are user IDs) and member IDs
      const trainerUserIds = [...new Set(assignmentsData.map((a) => a.trainer_id).filter(Boolean))]
      const memberIds = [...new Set(assignmentsData.map((a) => a.member_id).filter(Boolean))]

      console.log("Trainer User IDs:", trainerUserIds)
      console.log("Member IDs:", memberIds)

      // Fetch trainer details from users table
      const trainersMap = {}
      if (trainerUserIds.length > 0) {
        const { data: usersData } = await supabase.from("users").select("id, name, email").in("id", trainerUserIds)

        if (usersData) {
          usersData.forEach((user) => {
            trainersMap[user.id] = {
              id: user.id,
              users: user,
            }
          })
        }
      }

      // Fetch member details
      const membersMap = {}
      if (memberIds.length > 0) {
        const { data: membersData } = await supabase.from("members").select("id, name, email").in("id", memberIds)

        if (membersData) {
          membersData.forEach((member) => {
            membersMap[member.id] = member
          })
        }
      }

      console.log("Trainers map:", trainersMap)
      console.log("Members map:", membersMap)

      // Combine the data
      const assignmentsWithDetails = assignmentsData.map((assignment) => ({
        ...assignment,
        trainer: trainersMap[assignment.trainer_id] || {
          id: assignment.trainer_id,
          users: { name: "Unknown Trainer", email: "" },
        },
        member: membersMap[assignment.member_id] || {
          id: assignment.member_id,
          name: "Unknown Member",
          email: "",
        },
      }))

      console.log("Final assignments with details:", assignmentsWithDetails)
      setAssignments(assignmentsWithDetails)
      setFilteredAssignments(assignmentsWithDetails)
    } catch (error) {
      console.error("Error loading assignments:", error)
      toast({
        title: "Error",
        description: "Failed to load trainer assignments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTrainers = async () => {
    try {
      // Get trainer role ID
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("id")
        .eq("name", "trainer")
        .maybeSingle()

      if (roleError) {
        console.error("Error fetching trainer role:", roleError)
        return
      }

      if (!roleData) {
        console.log("No trainer role found in database")
        setTrainers([])
        return
      }

      const trainerRoleId = roleData.id

      // Get user_accounts with trainer role for this subaccount
      const { data: userAccountsData, error } = await supabase
        .from("user_accounts")
        .select("id, user_id")
        .eq("subaccount_id", currentSubaccountId)
        .eq("role_id", trainerRoleId)

      if (error) {
        console.error("Error fetching user accounts:", error)
        return
      }

      if (!userAccountsData || userAccountsData.length === 0) {
        console.log("No trainer user accounts found")
        setTrainers([])
        return
      }

      // Get user details for each trainer
      const userIds = userAccountsData.map((ua) => ua.user_id).filter(Boolean)

      if (userIds.length === 0) {
        console.log("No valid user IDs found for trainers")
        setTrainers([])
        return
      }

      const { data: usersData } = await supabase.from("users").select("id, name, email").in("id", userIds)

      const trainersWithDetails = userAccountsData.map((account) => {
        const userData = usersData?.find((u) => u.id === account.user_id)
        return {
          id: account.user_id, // Use user_id for filtering (this matches trainer_id in assignments)
          user_account_id: account.id,
          users: userData || { name: "Unknown", email: "" },
        }
      })

      console.log("Loaded trainers:", trainersWithDetails)
      setTrainers(trainersWithDetails)
    } catch (error) {
      console.error("Error loading trainers:", error)
      setTrainers([])
    }
  }

  const filterAssignments = () => {
    let filtered = [...assignments]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (assignment) =>
          (assignment.trainer?.users?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (assignment.member?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (assignment.notes && assignment.notes.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Apply trainer filter
    if (trainerFilter !== "all") {
      filtered = filtered.filter((assignment) => assignment.trainer_id === trainerFilter)
    }

    // Apply status filter
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active"
      filtered = filtered.filter((assignment) => assignment.is_active === isActive)
    }

    setFilteredAssignments(filtered)
  }

  const handleEdit = (assignment) => {
    setSelectedAssignment(assignment)
    setShowEditModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this assignment?")) {
      try {
        const { error } = await supabase.from("trainer_assignments").delete().eq("id", id)

        if (error) throw error

        toast({
          title: "Success",
          description: "Assignment deleted successfully",
        })

        loadAssignments()
      } catch (error) {
        console.error("Error deleting assignment:", error)
        toast({
          title: "Error",
          description: "Failed to delete assignment",
          variant: "destructive",
        })
      }
    }
  }

  const handleModalSuccess = () => {
    loadAssignments()
  }

  const columns = [
    {
      accessorKey: "trainer",
      header: "Trainer",
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-purple-600 font-medium text-sm">
              {(row.original.trainer?.users?.name || "T").charAt(0)}
            </span>
          </div>
          <div>
            <div className="font-medium">{row.original.trainer?.users?.name || "Unknown Trainer"}</div>
            <div className="text-sm text-gray-500">{row.original.trainer?.users?.email || ""}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "member",
      header: "Member",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.member?.name || "No member assigned"}</div>
          <div className="text-sm text-gray-500">{row.original.member?.email || ""}</div>
        </div>
      ),
    },
    {
      accessorKey: "assigned_at",
      header: "Assigned Date",
      cell: ({ row }) => <div>{new Date(row.original.assigned_at).toLocaleDateString()}</div>,
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={row.original.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
          {row.original.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.original.notes}>
          {row.original.notes || "No notes"}
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
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(row.original.id)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (contextLoading || loading) {
    return <SkeletonLoader />
  }

  if (!currentSubaccountId) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <PlusCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No gym selected</h3>
              <p className="text-gray-500">Please select a gym to manage trainer assignments.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trainer Assignments</h1>
          <p className="text-gray-600">Assign trainers to members for personalized training</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Assignment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{assignments.length}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {assignments.filter((a) => a.is_active).length} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Active Trainers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{trainers.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Available for assignments</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {
                assignments.filter((a) => {
                  const assignedDate = new Date(a.assigned_at)
                  const now = new Date()
                  return assignedDate.getMonth() === now.getMonth() && assignedDate.getFullYear() === now.getFullYear()
                }).length
              }
            </div>
            <div className="text-sm text-muted-foreground mt-1">New assignments</div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="flex gap-4">
              <Select value={trainerFilter} onValueChange={setTrainerFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by trainer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trainers</SelectItem>
                  {trainers.map((trainer) => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      {trainer.users?.name || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredAssignments}
            searchKey="trainer"
            searchPlaceholder="Search assignments..."
          />
        </div>
      </div>

      <AddAssignmentModal open={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={handleModalSuccess} />

      <EditAssignmentModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleModalSuccess}
        assignment={selectedAssignment}
      />
    </div>
  )
}
