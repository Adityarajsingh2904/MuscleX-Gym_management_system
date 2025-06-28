"use client"

import { useState, useEffect } from "react"
import { useGym } from "@/lib/gym-context"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { PlusCircle, AlertCircle, Download, Filter, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import AddExpenseModal from "@/components/expenses/add-expense-modal"
import EditExpenseModal from "@/components/expenses/edit-expense-modal"
import { formatCurrency } from "@/lib/currency"

const LoadingSkeleton = () => (
  <div className="space-y-6 p-6">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
    <div className="bg-white rounded-lg shadow p-6">
      <Skeleton className="h-64 w-full" />
    </div>
  </div>
)

export default function ExpensesPage() {
  const gymContext = useGym()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [filteredExpenses, setFilteredExpenses] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [totalAmount, setTotalAmount] = useState(0)
  const [monthlyTotal, setMonthlyTotal] = useState(0)
  const [expenseTypes, setExpenseTypes] = useState([])
  const [initialized, setInitialized] = useState(false)

  // Get the current subaccount ID from multiple possible sources
  const currentSubaccountId = gymContext?.currentSubaccountId || gymContext?.currentSubaccount?.id

  useEffect(() => {
    // Only run this effect once when the component mounts
    if (initialized) return

    console.log("Initializing expenses page...")
    console.log("Gym context:", gymContext)
    console.log("Current subaccount ID:", currentSubaccountId)

    const initializePage = async () => {
      try {
        // Check if we have a subaccount ID from context
        if (currentSubaccountId) {
          console.log("Found subaccount ID from context:", currentSubaccountId)
          await loadExpensesWithId(currentSubaccountId)
          setInitialized(true)
          return
        }

        // Check localStorage as fallback
        const storedSubaccountId = localStorage.getItem("current_subaccount_id")
        if (storedSubaccountId) {
          console.log("Found subaccount ID from localStorage:", storedSubaccountId)
          await loadExpensesWithId(storedSubaccountId)
          setInitialized(true)
          return
        }

        // If no subaccount ID found anywhere, show error
        console.log("No subaccount ID found")
        setError("No gym selected. Please select a gym first.")
        setLoading(false)
        setInitialized(true)
      } catch (error) {
        console.error("Error initializing page:", error)
        setError(`Failed to initialize page: ${error.message}`)
        setLoading(false)
        setInitialized(true)
      }
    }

    // Add a small delay to allow context to load
    const timer = setTimeout(() => {
      initializePage()
    }, 100)

    // Cleanup timeout
    return () => clearTimeout(timer)
  }, [currentSubaccountId, gymContext, initialized])

  useEffect(() => {
    if (expenses.length > 0) {
      filterExpenses()
    } else {
      setFilteredExpenses([])
    }
  }, [searchQuery, typeFilter, dateFilter, expenses])

  const loadExpensesWithId = async (subaccountId) => {
    try {
      setLoading(true)
      setError(null)

      console.log("Loading expenses for subaccount ID:", subaccountId)

      // Fetch expenses with user account information
      const { data, error } = await supabase
        .from("expenses")
        .select(`
    *,
    user_accounts!created_by (
      id,
      users (
        id,
        name,
        email
      ),
      roles (
        id,
        name
      )
    )
  `)
        .eq("subaccount_id", subaccountId)
        .order("incurred_on", { ascending: false })

      if (error) {
        console.error("Error fetching expenses:", error)

        // Handle specific error cases
        if (error.message.includes("does not exist")) {
          setError("Expenses table does not exist. Please run the database setup scripts.")
        } else if (error.message.includes("permission denied")) {
          setError("Permission denied. Please check your access rights.")
        } else {
          setError(`Error loading expenses: ${error.message}`)
        }

        setExpenses([])
        setLoading(false)
        return
      }

      console.log("Successfully loaded expenses:", data?.length || 0, "items")
      setExpenses(data || [])

      // Calculate totals
      const total = (data || []).reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
      setTotalAmount(total)

      // Calculate monthly total
      const today = new Date()
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const monthlyExpenses = (data || []).filter((expense) => {
        const expenseDate = new Date(expense.incurred_on)
        return expenseDate >= firstDayOfMonth
      })
      const monthlySum = monthlyExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
      setMonthlyTotal(monthlySum)

      // Extract unique expense types
      const uniqueTypes = [...new Set(data.map((expense) => expense.expense_type).filter(Boolean))]
      setExpenseTypes(uniqueTypes)

      setLoading(false)
    } catch (error) {
      console.error("Error in loadExpensesWithId:", error)
      setError(`Failed to load expenses: ${error.message}`)
      setExpenses([])
      setLoading(false)
    }
  }

  const loadExpenses = () => {
    const subaccountId = currentSubaccountId || localStorage.getItem("current_subaccount_id")
    if (subaccountId) {
      loadExpensesWithId(subaccountId)
    } else {
      setError("No gym selected. Please select a gym first.")
      setLoading(false)
    }
  }

  const filterExpenses = () => {
    let filtered = [...expenses]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (expense) =>
          expense.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (expense.description && expense.description.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((expense) => expense.expense_type === typeFilter)
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const today = new Date()
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1)

      switch (dateFilter) {
        case "this_month":
          filtered = filtered.filter((expense) => {
            const expenseDate = new Date(expense.incurred_on)
            return expenseDate >= firstDayOfMonth
          })
          break
        case "this_year":
          filtered = filtered.filter((expense) => {
            const expenseDate = new Date(expense.incurred_on)
            return expenseDate >= firstDayOfYear
          })
          break
        case "last_30":
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(today.getDate() - 30)
          filtered = filtered.filter((expense) => {
            const expenseDate = new Date(expense.incurred_on)
            return expenseDate >= thirtyDaysAgo
          })
          break
      }
    }

    setFilteredExpenses(filtered)
  }

  const handleEdit = (expense) => {
    setSelectedExpense(expense)
    setShowEditModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      try {
        const { error } = await supabase.from("expenses").delete().eq("id", id)

        if (error) throw error

        toast({
          title: "Success",
          description: "Expense deleted successfully",
        })

        loadExpenses()
      } catch (error) {
        console.error("Error deleting expense:", error)
        toast({
          title: "Error",
          description: `Failed to delete expense: ${error.message}`,
          variant: "destructive",
        })
      }
    }
  }

  const exportToCSV = () => {
    try {
      // Create CSV content
      const headers = ["Date", "Title", "Amount", "Category", "Description", "Created By", "Role"]
      const csvRows = [headers]

      filteredExpenses.forEach((expense) => {
        const row = [
          new Date(expense.incurred_on).toLocaleDateString(),
          expense.title,
          expense.amount,
          expense.expense_type || "",
          expense.description || "",
          expense.user_accounts?.users?.name || "Unknown",
          expense.user_accounts?.roles?.name || "Unknown",
        ]
        csvRows.push(row)
      })

      // Convert to CSV string
      const csvContent = csvRows
        .map((row) => row.map((cell) => (typeof cell === "string" ? `"${cell.replace(/"/g, '""')}"` : cell)).join(","))
        .join("\n")

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `expenses-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Success",
        description: "Expenses exported successfully",
      })
    } catch (error) {
      console.error("Error exporting expenses:", error)
      toast({
        title: "Error",
        description: "Failed to export expenses",
        variant: "destructive",
      })
    }
  }

  const formatCurrencyAmount = (amount) => {
    return formatCurrency(amount || 0)
  }

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    setInitialized(false)
    loadExpenses()
  }

  const getRoleBadgeVariant = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case "owner":
        return "default"
      case "manager":
        return "secondary"
      case "trainer":
        return "outline"
      case "staff":
        return "outline"
      default:
        return "outline"
    }
  }

  const columns = [
    {
      accessorKey: "incurred_on",
      header: "Date",
      cell: ({ row }) => <div>{new Date(row.original.incurred_on).toLocaleDateString()}</div>,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <div className="font-medium">{row.original.title}</div>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <div className="font-medium">{formatCurrencyAmount(row.original.amount)}</div>,
    },
    {
      accessorKey: "expense_type",
      header: "Category",
      cell: ({ row }) => (
        <div>
          {row.original.expense_type ? (
            <Badge variant="outline" className="capitalize">
              {row.original.expense_type}
            </Badge>
          ) : (
            "-"
          )}
        </div>
      ),
    },
    {
      accessorKey: "created_by",
      header: "Created By",
      cell: ({ row }) => {
        const userAccount = row.original.user_accounts
        const userName = userAccount?.users?.name || "Unknown User"
        const roleName = userAccount?.roles?.name || "Unknown"

        return (
          <div className="flex flex-col gap-1">
            <div className="font-medium text-sm">{userName}</div>
            <Badge variant={getRoleBadgeVariant(roleName)} className="w-fit text-xs">
              {roleName}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.original.description}>
          {row.original.description || "-"}
        </div>
      ),
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

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Expense Tracker</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button onClick={handleRetry}>Try Again</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              console.log("Debug info:")
              console.log("Gym context:", gymContext)
              console.log("Current subaccount ID:", currentSubaccountId)
              console.log("LocalStorage subaccount ID:", localStorage.getItem("current_subaccount_id"))
            }}
          >
            Debug Info
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Expense Tracker</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} disabled={filteredExpenses.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrencyAmount(totalAmount)}</div>
            <div className="text-sm text-muted-foreground mt-1">All time</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrencyAmount(monthlyTotal)}</div>
            <div className="text-sm text-muted-foreground mt-1">Current month expenses</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Expense Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{expenses.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Total transactions</div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type">
                    <div className="flex items-center">
                      <Filter className="mr-2 h-4 w-4" />
                      {typeFilter === "all" ? "All Types" : typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {[
                    "maintenance",
                    "rent",
                    "utility",
                    "equipment",
                    "marketing",
                    "salary",
                    "insurance",
                    "other",
                    ...expenseTypes.filter(
                      (type) =>
                        ![
                          "maintenance",
                          "rent",
                          "utility",
                          "equipment",
                          "marketing",
                          "salary",
                          "insurance",
                          "other",
                        ].includes(type),
                    ),
                  ].map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_30">Last 30 Days</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredExpenses.length > 0 ? (
            <DataTable
              columns={columns}
              data={filteredExpenses}
              searchKey="title"
              searchPlaceholder="Search expenses..."
            />
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                {expenses.length === 0
                  ? "No expenses found. Add your first expense to get started."
                  : "No expenses match your current filters."}
              </p>
              {expenses.length === 0 && (
                <Button className="mt-4" onClick={() => setShowAddModal(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddExpenseModal open={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={loadExpenses} />
      )}

      {showEditModal && selectedExpense && (
        <EditExpenseModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={loadExpenses}
          expense={selectedExpense}
        />
      )}
    </div>
  )
}
