"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  Plus,
  TrendingUp,
  TrendingDown,
  Building2,
  Settings,
  PenToolIcon as Tool,
  Clock,
} from "lucide-react"
import { supabase, getCurrentSession } from "@/lib/supabase"
import { AddMemberModal } from "@/components/members/add-member-modal"
import { useToast } from "@/hooks/use-toast"
import { useGymContext } from "@/lib/gym-context"
import type { Member } from "@/types/database"
import { NotificationSettingsModal } from "@/components/dashboard/notification-settings-modal"
import { useRouter } from "next/navigation"
import { EditMemberModal } from "@/components/members/edit-member-modal"
import { formatCurrency } from "@/lib/currency"

interface DashboardStats {
  totalMembers: number
  activeSubscriptions: number
  monthlyRevenue: number
  overduePayments: Member[]
  memberGrowth: number
  revenueGrowth: number
  subscriptionGrowth: number
  currentMonthPaymentsCount: number
  subaccountName: string
}

interface MaintenanceItem {
  id: string
  title: string
  description: string
  scheduled_date: string
  status: string
  priority: string
  equipment_name?: string
  brand?: string
  category?: string
  days_until?: number
  is_overdue?: boolean
  days_overdue?: number
}

interface ExpiringMembership {
  id: string
  name: string
  email: string
  phone: string
  plan_name: string
  expiry_date: string
  days_remaining: number
  is_expired?: boolean
  days_expired?: number
}

interface NotificationSettings {
  maintenanceDays: number
  membershipDays: number
}

export default function Dashboard() {
  const { toast } = useToast()
  const router = useRouter()
  const { currentSubaccountId, isLoading: contextLoading, contextVersion } = useGymContext()
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    overduePayments: [],
    memberGrowth: 0,
    revenueGrowth: 0,
    subscriptionGrowth: 0,
    currentMonthPaymentsCount: 0,
    subaccountName: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<MaintenanceItem[]>([])
  const [expiringMemberships, setExpiringMemberships] = useState<ExpiringMembership[]>([])
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    maintenanceDays: 7,
    membershipDays: 3,
  })
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showEditMemberModal, setShowEditMemberModal] = useState(false)
  const [selectedMemberForEdit, setSelectedMemberForEdit] = useState<Member | null>(null)

  // Load data when subaccount changes OR when context version changes (franchise switching)
  useEffect(() => {
    if (currentSubaccountId && !contextLoading) {
      console.log("Loading dashboard data due to context change:", { currentSubaccountId, contextVersion })
      loadDashboardData(currentSubaccountId)
    } else if (!currentSubaccountId && !contextLoading) {
      setIsLoading(false)
    }
  }, [currentSubaccountId, contextLoading, contextVersion]) // Added contextVersion dependency

  const loadDashboardData = async (subaccountId: string) => {
    if (!subaccountId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      console.log("Loading dashboard data for subaccount:", subaccountId)

      // Verify session is still valid
      const session = await getCurrentSession()
      if (!session) {
        router.push("/auth")
        return
      }

      // Get subaccount details
      const { data: subaccount, error: subaccountError } = await supabase
        .from("subaccounts")
        .select("name, location")
        .eq("id", subaccountId)
        .maybeSingle()

      if (subaccountError) {
        console.error("Error fetching subaccount:", subaccountError)
        throw subaccountError
      }

      // Load notification settings first (only once)
      await loadNotificationSettings(subaccountId)

      // Fetch members for this specific subaccount only
      const { data: members, error: membersError } = await supabase
        .from("members")
        .select(`
        *,
        plan:plans(*)
      `)
        .eq("subaccount_id", subaccountId)
        .order("created_at", { ascending: false })

      if (membersError) {
        console.error("Error fetching members:", membersError)
        throw membersError
      }

      console.log("Fetched members for subaccount:", members?.length || 0)

      // Fetch payments for this specific subaccount only (through members)
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select(`
        *,
        member:members!inner(
          id,
          name,
          subaccount_id
        ),
        plan:plans(*),
        payment_method:payment_methods(*)
      `)
        .eq("member.subaccount_id", subaccountId)
        .order("paid_at", { ascending: false })

      if (paymentsError) {
        console.error("Error fetching payments:", paymentsError)
        // Don't throw error for payments, just log it
      }

      console.log("Fetched payments for subaccount:", payments?.length || 0)

      // Calculate current month stats
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

      // Total members for this subaccount
      const totalMembers = members?.length || 0

      // Active subscriptions (members with active plans) for this subaccount
      const activeSubscriptions = members?.filter((member) => member.active_plan && member.is_active).length || 0

      // Monthly revenue (payments made this month) for this subaccount
      const currentMonthPayments =
        payments?.filter((payment) => {
          const paymentDate = new Date(payment.paid_at)
          return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
        }) || []

      const monthlyRevenue = currentMonthPayments.reduce((sum, payment) => {
        return sum + Number(payment.final_amount || payment.amount || 0)
      }, 0)

      console.log(`Subaccount Monthly Revenue: $${monthlyRevenue}`)
      console.log(`Number of payments this month: ${currentMonthPayments.length}`)

      // Last month revenue for growth calculation
      const lastMonthPayments =
        payments?.filter((payment) => {
          const paymentDate = new Date(payment.paid_at)
          return paymentDate.getMonth() === lastMonth && paymentDate.getFullYear() === lastMonthYear
        }) || []
      const lastMonthRevenue = lastMonthPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

      // Overdue payments (members whose next_payment is today or past) for this subaccount
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const overduePayments =
        members?.filter((member) => {
          if (!member.next_payment || !member.is_active) return false
          const nextPaymentDate = new Date(member.next_payment)
          nextPaymentDate.setHours(0, 0, 0, 0)
          return nextPaymentDate <= today
        }) || []

      // Growth calculations for this subaccount
      const lastMonthMembers =
        members?.filter((member) => {
          const joinDate = new Date(member.join_date)
          return joinDate.getMonth() === lastMonth && joinDate.getFullYear() === lastMonthYear
        }).length || 0

      const lastMonthActiveSubscriptions =
        members?.filter((member) => {
          if (!member.active_plan || !member.is_active) return false
          const joinDate = new Date(member.join_date)
          return joinDate.getMonth() === lastMonth && joinDate.getFullYear() === lastMonthYear
        }).length || 0

      const memberGrowth = lastMonthMembers > 0 ? ((totalMembers - lastMonthMembers) / lastMonthMembers) * 100 : 0
      const revenueGrowth = lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0
      const subscriptionGrowth =
        lastMonthActiveSubscriptions > 0
          ? ((activeSubscriptions - lastMonthActiveSubscriptions) / lastMonthActiveSubscriptions) * 100
          : 0

      const currentMonthPaymentsCount = currentMonthPayments.length

      setStats({
        totalMembers,
        activeSubscriptions,
        monthlyRevenue,
        overduePayments,
        memberGrowth,
        revenueGrowth,
        subscriptionGrowth,
        currentMonthPaymentsCount,
        subaccountName: subaccount?.name || "Unknown Gym",
      })

      // Fetch notifications after setting stats
      await fetchUpcomingMaintenance(subaccountId)
      await fetchExpiringMemberships(subaccountId)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUpcomingMaintenance = async (subaccountId: string) => {
    try {
      const today = new Date()
      const futureDate = new Date()
      futureDate.setDate(today.getDate() + notificationSettings.maintenanceDays)

      // Fetch inventory items that need maintenance soon
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("subaccount_id", subaccountId)
        .in("status", ["working", "maintenance"])
        .not("last_maintenance", "is", null)
        .not("maintenance_interval_days", "is", null)

      if (error) {
        console.error("Error fetching inventory items:", error)
        return
      }

      // Calculate which items need maintenance soon OR are overdue
      const upcomingMaintenanceItems = (data || [])
        .map((item) => {
          if (!item.last_maintenance || !item.maintenance_interval_days) return null

          const lastMaintenanceDate = new Date(item.last_maintenance)
          const nextMaintenanceDate = new Date(lastMaintenanceDate)
          nextMaintenanceDate.setDate(lastMaintenanceDate.getDate() + item.maintenance_interval_days)

          const daysUntilMaintenance = Math.ceil(
            (nextMaintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          )

          // Include items that are overdue (negative days) OR within notification window
          if (daysUntilMaintenance <= notificationSettings.maintenanceDays) {
            const isOverdue = daysUntilMaintenance < 0
            const daysOverdue = Math.abs(daysUntilMaintenance)

            return {
              id: item.id,
              title: `${item.name} Maintenance`,
              description: `${item.category || "Equipment"} maintenance ${isOverdue ? "overdue" : "due"}`,
              scheduled_date: nextMaintenanceDate.toISOString().split("T")[0],
              status: isOverdue ? "overdue" : "scheduled",
              priority: isOverdue
                ? "critical"
                : daysUntilMaintenance <= 2
                  ? "high"
                  : daysUntilMaintenance <= 5
                    ? "medium"
                    : "low",
              equipment_name: item.name,
              brand: item.brand,
              category: item.category,
              days_until: daysUntilMaintenance,
              is_overdue: isOverdue,
              days_overdue: isOverdue ? daysOverdue : 0,
            }
          }
          return null
        })
        .filter(Boolean)
        .sort((a, b) => {
          // Sort by priority: overdue first, then by urgency
          if (a.is_overdue && !b.is_overdue) return -1
          if (!a.is_overdue && b.is_overdue) return 1
          if (a.is_overdue && b.is_overdue) return b.days_overdue - a.days_overdue
          return a.days_until - b.days_until
        })

      setUpcomingMaintenance(upcomingMaintenanceItems)
    } catch (error) {
      console.error("Error in fetchUpcomingMaintenance:", error)
    }
  }

  const fetchExpiringMemberships = async (subaccountId: string) => {
    try {
      const today = new Date()
      const futureDate = new Date()
      futureDate.setDate(today.getDate() + notificationSettings.membershipDays)

      // Fetch members with memberships expiring soon OR already expired
      const { data: members, error } = await supabase
        .from("members")
        .select(`
      id,
      name,
      email,
      phone,
      next_payment,
      plan:plans(name, duration, price)
    `)
        .eq("subaccount_id", subaccountId)
        .eq("is_active", true)
        .not("next_payment", "is", null)
        .order("next_payment", { ascending: true })

      if (error) {
        console.error("Error fetching expiring memberships:", error)
        return
      }

      // Calculate days remaining for each membership, including expired ones
      const expiringMembers =
        members
          ?.filter((member) => {
            const expiryDate = new Date(member.next_payment)
            const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

            // Include expired memberships (negative days) OR memberships expiring within notification window
            return daysRemaining <= notificationSettings.membershipDays
          })
          .map((member) => {
            const expiryDate = new Date(member.next_payment)
            const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            const isExpired = daysRemaining < 0
            const daysExpired = Math.abs(daysRemaining)

            return {
              id: member.id,
              name: member.name,
              email: member.email,
              phone: member.phone,
              plan_name: member.plan?.name || "Unknown Plan",
              expiry_date: member.next_payment,
              days_remaining: daysRemaining,
              is_expired: isExpired,
              days_expired: isExpired ? daysExpired : 0,
            }
          })
          .sort((a, b) => {
            // Sort by priority: expired first, then by urgency
            if (a.is_expired && !b.is_expired) return -1
            if (!a.is_expired && b.is_expired) return 1
            if (a.is_expired && b.is_expired) return b.days_expired - a.days_expired
            return a.days_remaining - b.days_remaining
          }) || []

      setExpiringMemberships(expiringMembers)
    } catch (error) {
      console.error("Error in fetchExpiringMemberships:", error)
    }
  }

  const loadNotificationSettings = async (subaccountId: string) => {
    try {
      const { data, error } = await supabase
        .from("notification_rules")
        .select("*")
        .eq("subaccount_id", subaccountId)
        .eq("is_active", true)

      if (error) {
        console.error("Error fetching notification rules:", error)
        return
      }

      // Set notification settings based on database rules
      const maintenanceRule = data?.find((rule) => rule.event_type === "maintenance_due")
      const membershipRule = data?.find((rule) => rule.event_type === "membership_expiry")

      setNotificationSettings({
        maintenanceDays: maintenanceRule?.days_before || 7,
        membershipDays: membershipRule?.days_before || 3,
      })
    } catch (error) {
      console.error("Error loading notification settings:", error)
    }
  }

  const handleMemberAdded = () => {
    if (currentSubaccountId) {
      // Reload data for current subaccount
      loadDashboardData(currentSubaccountId)
    }
    setShowAddMemberModal(false)
    toast({
      title: "Success",
      description: "Member added successfully",
    })
  }

  const handleSettingsSaved = async (settings: NotificationSettings) => {
    try {
      if (!currentSubaccountId) return

      // Update notification rules in database
      const { error: maintenanceError } = await supabase.from("notification_rules").upsert(
        {
          subaccount_id: currentSubaccountId,
          event_type: "maintenance_due",
          days_before: settings.maintenanceDays,
          is_active: true,
        },
        {
          onConflict: "subaccount_id,event_type",
        },
      )

      const { error: membershipError } = await supabase.from("notification_rules").upsert(
        {
          subaccount_id: currentSubaccountId,
          event_type: "membership_expiry",
          days_before: settings.membershipDays,
          is_active: true,
        },
        {
          onConflict: "subaccount_id,event_type",
        },
      )

      if (maintenanceError || membershipError) {
        console.error("Error saving notification rules:", maintenanceError || membershipError)
        toast({
          title: "Error",
          description: "Failed to save notification settings",
          variant: "destructive",
        })
        return
      }

      // Update local settings
      setNotificationSettings(settings)
      setShowSettingsModal(false)

      // Manually refresh notifications with new settings
      await fetchUpcomingMaintenance(currentSubaccountId)
      await fetchExpiringMemberships(currentSubaccountId)

      toast({
        title: "Settings Updated",
        description: "Notification settings have been updated",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive",
      })
    }
  }

  const markMaintenanceDone = async (maintenanceItem: MaintenanceItem) => {
    try {
      if (!currentSubaccountId) return

      // Update the last_maintenance date to today
      const today = new Date().toISOString().split("T")[0]

      const { error } = await supabase
        .from("inventory_items")
        .update({
          last_maintenance: today,
          status: "working", // Set status to working after maintenance
        })
        .eq("id", maintenanceItem.id)
        .eq("subaccount_id", currentSubaccountId)

      if (error) {
        console.error("Error updating maintenance:", error)
        toast({
          title: "Error",
          description: "Failed to mark maintenance as done",
          variant: "destructive",
        })
        return
      }

      // Remove the item from the upcoming maintenance list
      setUpcomingMaintenance((prev) => prev.filter((item) => item.id !== maintenanceItem.id))

      toast({
        title: "Success",
        description: `Maintenance for ${maintenanceItem.equipment_name} marked as complete`,
      })
    } catch (error) {
      console.error("Error in markMaintenanceDone:", error)
      toast({
        title: "Error",
        description: "Failed to mark maintenance as done",
        variant: "destructive",
      })
    }
  }

  const handleTakeAction = async (membershipItem: ExpiringMembership) => {
    try {
      // Find the full member object
      const { data: member, error } = await supabase
        .from("members")
        .select(`
        *,
        plan:plans(*)
      `)
        .eq("id", membershipItem.id)
        .single()

      if (error || !member) {
        console.error("Error fetching member:", error)
        toast({
          title: "Error",
          description: "Failed to load member details",
          variant: "destructive",
        })
        return
      }

      setSelectedMemberForEdit(member)
      setShowEditMemberModal(true)
    } catch (error) {
      console.error("Error in handleTakeAction:", error)
      toast({
        title: "Error",
        description: "Failed to open member details",
        variant: "destructive",
      })
    }
  }

  const handleMemberUpdated = () => {
    // Reload data for current subaccount
    if (currentSubaccountId) {
      loadDashboardData(currentSubaccountId)
    }
    setShowEditMemberModal(false)
    setSelectedMemberForEdit(null)

    toast({
      title: "Success",
      description: "Member updated successfully",
    })
  }

  // Calculate total notifications count
  const totalNotifications = stats.overduePayments.length + upcomingMaintenance.length + expiringMemberships.length

  if (contextLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!currentSubaccountId) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No gym selected</h3>
              <p className="text-gray-500 mb-4">Please select a gym to view the dashboard.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back! Here's what's happening at <span className="font-medium">{stats.subaccountName}</span>.
          </p>
        </div>
        <Button onClick={() => setShowAddMemberModal(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      {/* Subaccount Info Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Building2 className="h-3 w-3 mr-1" />
          {stats.subaccountName}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalMembers}</p>
                <div className="flex items-center mt-2">
                  {stats.memberGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${stats.memberGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {Math.abs(stats.memberGrowth).toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
                <div className="flex items-center mt-2">
                  {stats.subscriptionGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      stats.subscriptionGrowth >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {Math.abs(stats.subscriptionGrowth).toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-green-100 text-green-600">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.monthlyRevenue)}</p>
                <div className="flex items-center mt-2">
                  {stats.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${stats.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {Math.abs(stats.revenueGrowth).toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-teal-100 text-teal-600">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
              Notifications ({totalNotifications})
            </CardTitle>
            <div className="flex items-center gap-2">
              {totalNotifications > 0 && (
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  Action Required
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowSettingsModal(true)} className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {totalNotifications === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                <p className="text-gray-500">No notifications at this time.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* Overdue Payments Section */}
                {stats.overduePayments.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-red-500" />
                      Overdue Payments ({stats.overduePayments.length})
                    </h3>
                    <div className="space-y-2">
                      {stats.overduePayments.map((member) => {
                        const daysOverdue = Math.floor(
                          (new Date().getTime() - new Date(member.next_payment!).getTime()) / (1000 * 60 * 60 * 24),
                        )
                        const isToday = daysOverdue === 0
                        const isOverdue = daysOverdue > 0

                        return (
                          <div
                            key={`payment-${member.id}`}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              isOverdue
                                ? "bg-red-50 border-red-200"
                                : isToday
                                  ? "bg-orange-50 border-orange-200"
                                  : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">{member.name.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                                <p className="text-xs text-gray-500">{member.email || member.phone || "No contact"}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={isOverdue ? "destructive" : isToday ? "default" : "secondary"}
                                className={
                                  isOverdue
                                    ? "bg-red-100 text-red-800"
                                    : isToday
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-gray-100 text-gray-800"
                                }
                              >
                                {isOverdue
                                  ? `${daysOverdue} day${daysOverdue > 1 ? "s" : ""} overdue`
                                  : isToday
                                    ? "Due today"
                                    : "Due"}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                Due: {new Date(member.next_payment!).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Upcoming Maintenance Section */}
                {upcomingMaintenance.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Tool className="h-4 w-4 mr-1 text-blue-500" />
                      Maintenance Alerts ({upcomingMaintenance.length})
                    </h3>
                    <div className="space-y-2">
                      {upcomingMaintenance.map((item) => {
                        const scheduledDate = new Date(item.scheduled_date)
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const daysUntil = item.days_until
                        const isToday = daysUntil === 0
                        const isOverdue = item.is_overdue

                        return (
                          <div
                            key={`maintenance-${item.id}`}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              isOverdue
                                ? "bg-red-50 border-red-200"
                                : isToday
                                  ? "bg-blue-50 border-blue-200"
                                  : item.priority === "high"
                                    ? "bg-orange-50 border-orange-200"
                                    : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center
                              ${
                                isOverdue
                                  ? "bg-red-100 text-red-600"
                                  : item.priority === "high"
                                    ? "bg-orange-100 text-orange-600"
                                    : item.priority === "medium"
                                      ? "bg-yellow-100 text-yellow-600"
                                      : "bg-blue-100 text-blue-600"
                              }`}
                              >
                                <Tool className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                                <p className="text-xs text-gray-500">
                                  {item.equipment_name
                                    ? `Equipment: ${item.equipment_name}`
                                    : item.description.substring(0, 30)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 justify-end mb-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                  onClick={() => markMaintenanceDone(item)}
                                >
                                  Mark Done
                                </Button>
                                <Badge
                                  variant={isOverdue ? "destructive" : isToday ? "default" : "secondary"}
                                  className={
                                    isOverdue
                                      ? "bg-red-100 text-red-800"
                                      : isToday
                                        ? "bg-blue-100 text-blue-800"
                                        : item.priority === "high"
                                          ? "bg-orange-100 text-orange-800"
                                          : "bg-gray-100 text-gray-800"
                                  }
                                >
                                  {isOverdue
                                    ? `${item.days_overdue} day${item.days_overdue > 1 ? "s" : ""} overdue`
                                    : isToday
                                      ? "Today"
                                      : `In ${daysUntil} day${daysUntil > 1 ? "s" : ""}`}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500">{scheduledDate.toLocaleDateString()}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Expiring Memberships Section */}
                {expiringMemberships.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-purple-500" />
                      Membership Alerts ({expiringMemberships.length})
                    </h3>
                    <div className="space-y-2">
                      {expiringMemberships.map((member) => {
                        const isToday = member.days_remaining === 0
                        const isExpired = member.is_expired

                        return (
                          <div
                            key={`expiry-${member.id}`}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              isExpired
                                ? "bg-red-50 border-red-200"
                                : isToday
                                  ? "bg-purple-50 border-purple-200"
                                  : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                  isExpired ? "bg-red-100 text-red-600" : "bg-purple-100 text-purple-600"
                                }`}
                              >
                                <Clock className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                                <p className="text-xs text-gray-500">Plan: {member.plan_name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 justify-end mb-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                  onClick={() => handleTakeAction(member)}
                                >
                                  Take Action
                                </Button>
                                <Badge
                                  variant={isExpired ? "destructive" : isToday ? "default" : "secondary"}
                                  className={
                                    isExpired
                                      ? "bg-red-100 text-red-800"
                                      : isToday
                                        ? "bg-purple-100 text-purple-800"
                                        : "bg-gray-100 text-gray-800"
                                  }
                                >
                                  {isExpired
                                    ? `Expired ${member.days_expired} day${member.days_expired > 1 ? "s" : ""} ago`
                                    : isToday
                                      ? "Expires today"
                                      : `Expires in ${member.days_remaining} day${member.days_remaining > 1 ? "s" : ""}`}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500">
                                {new Date(member.expiry_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Account Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-900">Subscription Rate</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.totalMembers > 0 ? Math.round((stats.activeSubscriptions / stats.totalMembers) * 100) : 0}%
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-900">Avg. Payment Amount (Per Payment)</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(
                    stats.currentMonthPaymentsCount > 0
                      ? Math.round(stats.monthlyRevenue / stats.currentMonthPaymentsCount)
                      : 0,
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-orange-900">Notifications</p>
                <p className="text-2xl font-bold text-orange-900">{totalNotifications}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>

            <Button onClick={() => setShowAddMemberModal(true)} className="w-full bg-teal-600 hover:bg-teal-700 mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add New Member
            </Button>
          </CardContent>
        </Card>
      </div>

      <AddMemberModal
        open={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onMemberAdded={handleMemberAdded}
      />

      <NotificationSettingsModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={notificationSettings}
        onSave={handleSettingsSaved}
      />

      <EditMemberModal
        open={showEditMemberModal}
        onClose={() => {
          setShowEditMemberModal(false)
          setSelectedMemberForEdit(null)
        }}
        onMemberUpdated={handleMemberUpdated}
        member={selectedMemberForEdit}
        initialTab="payments"
      />
    </div>
  )
}
