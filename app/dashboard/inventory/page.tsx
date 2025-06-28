"use client"

import { useState, useEffect } from "react"
import { useGymContext } from "@/lib/gym-context"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { PlusCircle, BadgeAlertIcon as AlertIcon, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import AddInventoryModal from "@/components/inventory/add-inventory-modal"
import EditInventoryModal from "@/components/inventory/edit-inventory-modal"
import { DataTable } from "@/components/ui/data-table"
import { SkeletonLoader } from "@/components/dashboard/skeleton-loader"

export default function InventoryPage() {
  const { currentSubaccountId, isLoading: contextLoading } = useGymContext()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [inventoryItems, setInventoryItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [categories, setCategories] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [maintenanceDue, setMaintenanceDue] = useState([])
  const [tableExists, setTableExists] = useState(true)
  const [error, setError] = useState(null)
  const [resourceError, setResourceError] = useState(false)

  useEffect(() => {
    // Reset any resource errors when component mounts
    setResourceError(false)
  }, [])

  useEffect(() => {
    if (currentSubaccountId && !contextLoading) {
      loadInventory()
    }
  }, [currentSubaccountId, contextLoading])

  useEffect(() => {
    if (inventoryItems.length > 0) {
      filterItems()
    }
  }, [searchQuery, statusFilter, categoryFilter, inventoryItems])

  const loadInventory = async () => {
    try {
      setLoading(true)
      setError(null)

      // First check if the table exists
      const { data: tableCheck, error: tableError } = await supabase.from("inventory_items").select("id").limit(1)

      if (tableError) {
        if (tableError.message.includes("does not exist")) {
          setTableExists(false)
          setError("Database tables not found. Please run the setup scripts first.")
          setLoading(false)
          return
        }
        throw tableError
      }

      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("subaccount_id", currentSubaccountId)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Process the data to calculate next maintenance date
      const processedData = data.map((item) => {
        let nextMaintenanceDate = null

        if (item.last_maintenance && item.maintenance_interval_days) {
          const lastMaintenance = new Date(item.last_maintenance)
          nextMaintenanceDate = new Date(lastMaintenance)
          nextMaintenanceDate.setDate(lastMaintenance.getDate() + item.maintenance_interval_days)
        }

        return {
          ...item,
          calculated_next_maintenance: nextMaintenanceDate,
        }
      })

      setInventoryItems(processedData || [])

      // Extract unique categories
      const uniqueCategories = [...new Set(data.map((item) => item.category).filter(Boolean))]
      setCategories(uniqueCategories)

      // Find items due for maintenance in the next 7 days
      const today = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(today.getDate() + 7)

      const dueItems = processedData.filter((item) => {
        if (!item.calculated_next_maintenance) return false
        return item.calculated_next_maintenance <= nextWeek && item.calculated_next_maintenance >= today
      })

      setMaintenanceDue(dueItems)
      setTableExists(true)
      setLoading(false)
    } catch (error) {
      console.error("Error loading inventory:", error)
      setError(error.message)
      setLoading(false)
    }
  }

  const filterItems = () => {
    let filtered = [...inventoryItems]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter)
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter)
    }

    setFilteredItems(filtered)
  }

  const handleEdit = (item) => {
    setSelectedItem(item)
    setShowEditModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        const { error } = await supabase.from("inventory_items").delete().eq("id", id)

        if (error) throw error

        loadInventory()
      } catch (error) {
        console.error("Error deleting inventory item:", error)
      }
    }
  }

  const columns = [
    {
      accessorKey: "name",
      header: "Equipment Name",
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <div>{row.original.category || "-"}</div>,
    },
    {
      accessorKey: "brand",
      header: "Brand",
      cell: ({ row }) => <div>{row.original.brand || "-"}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        let badgeClass = ""

        switch (status) {
          case "working":
            badgeClass = "bg-green-100 text-green-800"
            break
          case "maintenance":
            badgeClass = "bg-yellow-100 text-yellow-800"
            break
          case "broken":
            badgeClass = "bg-red-100 text-red-800"
            break
          case "retired":
            badgeClass = "bg-gray-100 text-gray-800"
            break
          default:
            badgeClass = "bg-blue-100 text-blue-800"
        }

        return <Badge className={badgeClass}>{status}</Badge>
      },
    },
    {
      accessorKey: "last_maintenance",
      header: "Last Maintenance",
      cell: ({ row }) => {
        const date = row.original.last_maintenance
        if (!date) return <span>-</span>
        return <div>{new Date(date).toLocaleDateString()}</div>
      },
    },
    {
      accessorKey: "maintenance_interval_days",
      header: "Maintenance Interval",
      cell: ({ row }) => {
        const days = row.original.maintenance_interval_days
        if (!days) return <span>-</span>

        if (days >= 365) {
          const years = Math.floor(days / 365)
          return (
            <span>
              {years} {years === 1 ? "year" : "years"}
            </span>
          )
        } else if (days >= 30) {
          const months = Math.floor(days / 30)
          return (
            <span>
              {months} {months === 1 ? "month" : "months"}
            </span>
          )
        } else {
          return <span>{days} days</span>
        }
      },
    },
    {
      accessorKey: "calculated_next_maintenance",
      header: "Next Maintenance",
      cell: ({ row }) => {
        const date = row.original.calculated_next_maintenance
        if (!date) return <span>-</span>

        const maintenanceDate = new Date(date)
        const today = new Date()
        const isOverdue = maintenanceDate < today

        return (
          <div className={isOverdue ? "text-red-600 font-medium" : ""}>
            {isOverdue ? "⚠️ " : ""}
            {maintenanceDate.toLocaleDateString()}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)}>
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id)}>
            Delete
          </Button>
        </div>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No gym selected</h3>
              <p className="text-gray-500">Please select a gym to manage inventory.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!tableExists || error) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Inventory Management</h1>
        </div>

        <Alert className="border-orange-200 bg-orange-50">
          <AlertIcon className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="space-y-2">
              <p className="font-medium">Database Setup Required</p>
              <p>
                The inventory management feature requires database tables that haven't been created yet. Please run the
                following SQL scripts in order:
              </p>
              <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
                <li>scripts/02-create-inventory-table.sql</li>
                <li>scripts/09-setup-row-level-security.sql (for security)</li>
              </ol>
              <p className="text-sm mt-2">
                You can run these scripts using the SQL execution feature in your Supabase dashboard or through the
                inline SQL blocks in this chat.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              {resourceError ? (
                <div className="h-12 w-12 text-orange-500 mx-auto mb-4 flex items-center justify-center">⚠️</div>
              ) : (
                <AlertIcon className="h-12 w-12 text-orange-500 mx-auto mb-4" onError={() => setResourceError(true)} />
              )}
              <h3 className="text-lg font-medium text-gray-900 mb-2">Setup Required</h3>
              <p className="text-gray-500 mb-4">Run the database setup scripts to enable inventory management.</p>
              <Button onClick={loadInventory} variant="outline">
                Retry Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventory Management</h1>

        <Button onClick={() => setShowAddModal(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Equipment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{inventoryItems.length}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {inventoryItems.filter((i) => i.status === "working").length} working
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Maintenance Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{maintenanceDue.length}</div>
            <div className="text-sm text-muted-foreground mt-1">In the next 7 days</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Needs Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {inventoryItems.filter((i) => i.status === "broken" || i.status === "maintenance").length}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {inventoryItems.filter((i) => i.status === "broken").length} broken items
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="working">Working</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="broken">Broken</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable columns={columns} data={filteredItems} searchKey="name" searchPlaceholder="Search equipment..." />
        </div>
      </div>

      {showAddModal && (
        <AddInventoryModal open={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={loadInventory} />
      )}

      {showEditModal && selectedItem && (
        <EditInventoryModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={loadInventory}
          item={selectedItem}
        />
      )}
    </div>
  )
}
