"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Edit, Trash2, Package, DollarSign, Users, Star } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { CreatePlanModal } from "@/components/packages/create-plan-modal"
import { PlanCard } from "@/components/packages/plan-card"
import { useGymContext } from "@/lib/gym-context"
import { getPlans } from "@/lib/supabase-queries"
import type { Plan } from "@/types/database"
import { DashboardSkeleton } from "@/components/dashboard/skeleton-loader"
import { getCurrencySymbol } from "@/lib/currency"

export default function PackagesPage() {
  const { currentSubaccountId, isLoading: contextLoading } = useGymContext()
  const [plans, setPlans] = useState<Plan[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (currentSubaccountId && !contextLoading) {
      loadPlans()
    }
  }, [currentSubaccountId, contextLoading])

  const loadPlans = async () => {
    try {
      setIsLoading(true)
      const data = await getPlans(currentSubaccountId!)
      setPlans(data || [])
    } catch (error) {
      console.error("Error loading plans:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPlans = plans.filter(
    (plan) =>
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (plan.description && plan.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handlePlanCreated = () => {
    loadPlans()
    setShowCreateModal(false)
  }

  const columns = [
    {
      header: "Plan",
      accessorKey: "name",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-sm text-gray-500">{row.original.description}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Price",
      accessorKey: "price",
      cell: ({ row }: any) => (
        <div>
          <span className="text-lg font-bold text-green-600">
            {getCurrencySymbol()}
            {row.original.price}
          </span>
          <span className="text-sm text-gray-500">/{row.original.duration} days</span>
        </div>
      ),
    },
    {
      header: "Duration",
      accessorKey: "duration",
      cell: ({ row }: any) => `${row.original.duration} days`,
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
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
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

  if (contextLoading || isLoading) {
    return <DashboardSkeleton />
  }

  const totalPlans = plans.length
  const activePlans = plans.filter((plan) => plan.is_active).length
  const avgPrice = plans.length > 0 ? plans.reduce((sum, plan) => sum + plan.price, 0) / plans.length : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-600">Create and manage membership plans and pricing</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex rounded-lg border border-gray-200 p-1">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className={viewMode === "cards" ? "bg-gray-900 hover:bg-black" : ""}
            >
              Cards
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className={viewMode === "table" ? "bg-gray-900 hover:bg-black" : ""}
            >
              Table
            </Button>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Plan
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Plans</p>
                <p className="text-2xl font-bold text-gray-900">{totalPlans}</p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Plans</p>
                <p className="text-2xl font-bold text-gray-900">{activePlans}</p>
              </div>
              <div className="p-3 rounded-2xl bg-green-100 text-green-600">
                <Star className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getCurrencySymbol()}
                  {avgPrice.toFixed(0)}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-orange-100 text-orange-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Members Enrolled</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-100 text-purple-600">
                <Users className="h-5 w-5" />
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
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Plans Display */}
      {viewMode === "cards" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onEdit={() => {}} onDelete={() => {}} />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Plans ({filteredPlans.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={filteredPlans} searchKey="name" />
          </CardContent>
        </Card>
      )}

      <CreatePlanModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPlanCreated={handlePlanCreated}
      />
    </div>
  )
}
