"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Download, BarChart3, Users, DollarSign, TrendingUp, TrendingDown, CreditCard, Receipt } from "lucide-react"
import { PaymentAnalytics } from "@/components/analytics/payment-analytics"
import { ExpenseAnalytics } from "@/components/analytics/expense-analytics"
import { MemberAnalytics } from "@/components/analytics/member-analytics"
import { OverviewAnalytics } from "@/components/analytics/overview-analytics"
import {
  MetricCardSkeleton,
  OverviewAnalyticsSkeleton,
  PaymentAnalyticsSkeleton,
  ExpenseAnalyticsSkeleton,
  MemberAnalyticsSkeleton,
} from "@/components/analytics/analytics-skeleton"
import { supabase } from "@/lib/supabase-queries"
import { useGymContext } from "@/lib/gym-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Import jsPDF only
import { jsPDF } from "jspdf"

// Import at the top
import { formatCurrency } from "@/lib/currency"

interface AnalyticsData {
  payments: {
    totalAmount: number
    totalCount: number
    payments: any[]
    paymentsByMonth: Record<string, number>
    paymentsByPlan: Record<string, number>
    paymentsByFranchise: Record<string, number>
    averagePayment: number
  }
  expenses: {
    totalAmount: number
    totalCount: number
    expenses: any[]
    expensesByMonth: Record<string, number>
    expensesByCategory: Record<string, number>
    expensesByFranchise: Record<string, number>
    averageExpense: number
  }
  members: {
    totalMembers: number
    activeMembers: number
    inactiveMembers: number
    newMembers: number
    churnRate: number
    members: any[]
    membersByPlan: Record<string, number>
    membersByMonth: Record<string, number>
    membersByFranchise: Record<string, number>
  }
  overview: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    totalMembers: number
    activeMembers: number
    newMembers: number
    churnRate: number
  }
}

const emptyAnalyticsData: AnalyticsData = {
  payments: {
    totalAmount: 0,
    totalCount: 0,
    payments: [],
    paymentsByMonth: {},
    paymentsByPlan: {},
    paymentsByFranchise: {},
    averagePayment: 0,
  },
  expenses: {
    totalAmount: 0,
    totalCount: 0,
    expenses: [],
    expensesByMonth: {},
    expensesByCategory: {},
    expensesByFranchise: {},
    averageExpense: 0,
  },
  members: {
    totalMembers: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    newMembers: 0,
    churnRate: 0,
    members: [],
    membersByPlan: {},
    membersByMonth: {},
    membersByFranchise: {},
  },
  overview: {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalMembers: 0,
    activeMembers: 0,
    newMembers: 0,
    churnRate: 0,
  },
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(),
  })
  const [activeTab, setActiveTab] = useState("overview")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(emptyAnalyticsData)
  const [initialLoading, setInitialLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [selectedFranchise, setSelectedFranchise] = useState<string>("all")
  const [franchises, setFranchises] = useState<any[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const { currentAccountId, currentSubaccountId } = useGymContext()

  // Ref to track if we're currently loading to prevent multiple simultaneous calls
  const loadingRef = useRef(false)
  const initializingRef = useRef(false)

  // Initialize data on component mount - only once
  useEffect(() => {
    const initializeData = async () => {
      if (initializingRef.current) return
      if (!currentAccountId || !currentSubaccountId) {
        setInitialLoading(false)
        return
      }

      initializingRef.current = true

      try {
        await checkOwnershipAndLoadFranchises()
      } catch (error) {
        console.error("Error during initialization:", error)
        setInitialLoading(false)
      } finally {
        initializingRef.current = false
      }
    }

    if (!initialized) {
      initializeData()
    }
  }, [currentAccountId, currentSubaccountId, initialized])

  // Load analytics data when franchise selection changes
  useEffect(() => {
    if (initialized && !loadingRef.current) {
      loadAnalyticsData()
    }
  }, [selectedFranchise, initialized])

  // Load analytics data when date range changes
  useEffect(() => {
    if (initialized && !loadingRef.current && dateRange.from && dateRange.to) {
      loadAnalyticsData()
    }
  }, [dateRange, initialized])

  const checkOwnershipAndLoadFranchises = async () => {
    try {
      console.log("Initializing analytics page...")

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setInitialLoading(false)
        setInitialized(true)
        return
      }

      // Check if user is owner of current account
      const { data: userAccount, error: userAccountError } = await supabase
        .from("user_accounts")
        .select("is_owner")
        .eq("user_id", user.id)
        .eq("account_id", currentAccountId)
        .eq("subaccount_id", currentSubaccountId)
        .single()

      if (userAccountError) {
        console.error("Error checking ownership:", userAccountError)
        setIsOwner(false)
        setFranchises([])
        setInitialized(true)
        await loadAnalyticsData() // Load data for current subaccount
        return
      }

      const ownerStatus = userAccount?.is_owner || false
      setIsOwner(ownerStatus)

      if (ownerStatus) {
        // Load all franchises for this account
        const { data: franchiseData, error: franchiseError } = await supabase
          .from("subaccounts")
          .select("id, name, location")
          .eq("account_id", currentAccountId)
          .order("name")

        if (franchiseError) {
          console.error("Error loading franchises:", franchiseError)
          setFranchises([])
          setInitialized(true)
          await loadAnalyticsData() // Load data for current subaccount
          return
        }

        if (franchiseData && franchiseData.length > 0) {
          setFranchises(franchiseData)
          // Set default selection
          const defaultSelection = franchiseData.length === 1 ? franchiseData[0].id : "all"
          setSelectedFranchise(defaultSelection)
          setInitialized(true)
          // Data will be loaded by the selectedFranchise useEffect
        } else {
          setFranchises([])
          setInitialized(true)
          await loadAnalyticsData() // Load data for current subaccount
        }
      } else {
        // Not owner, just load current subaccount
        setFranchises([])
        setInitialized(true)
        await loadAnalyticsData() // Load data for current subaccount
      }
    } catch (error) {
      console.error("Error initializing data:", error)
      setInitialLoading(false)
      setInitialized(true)
    }
  }

  const loadAnalyticsData = useCallback(async () => {
    if (loadingRef.current) {
      console.log("Already loading, skipping...")
      return
    }

    loadingRef.current = true

    try {
      // Set appropriate loading state
      if (initialLoading) {
        // Keep initial loading true for first load
      } else {
        setDataLoading(true)
      }

      console.log(`Loading analytics data for franchise selection: ${selectedFranchise}`)

      // Determine which subaccounts to query
      let subaccountIds: string[] = []

      if (isOwner && franchises.length > 0) {
        if (selectedFranchise === "all") {
          subaccountIds = franchises.map((f) => f.id)
        } else {
          subaccountIds = [selectedFranchise]
        }
      } else {
        subaccountIds = [currentSubaccountId!]
      }

      console.log("Loading data for subaccounts:", subaccountIds)

      // Format dates for SQL queries
      const fromDate = dateRange.from.toISOString().split("T")[0]
      const toDate = dateRange.to.toISOString().split("T")[0]

      console.log(fromDate, toDate, ":::: From Date, To Date")

      // Load all data in parallel
      const [paymentsResult, expensesResult, membersResult] = await Promise.allSettled([
        loadPaymentsData(subaccountIds, fromDate, toDate),
        loadExpensesData(subaccountIds, fromDate, toDate),
        loadMembersData(subaccountIds),
      ])

      // Process results
      const payments = paymentsResult.status === "fulfilled" ? paymentsResult.value : []
      const expenses = expensesResult.status === "fulfilled" ? expensesResult.value : []
      const members = membersResult.status === "fulfilled" ? membersResult.value : []

      // Log any errors
      if (paymentsResult.status === "rejected") {
        console.error("Error loading payments:", paymentsResult.reason)
      }
      if (expensesResult.status === "rejected") {
        console.error("Error loading expenses:", expensesResult.reason)
      }
      if (membersResult.status === "rejected") {
        console.error("Error loading members:", membersResult.reason)
      }

      // Process and set analytics data
      const processedData = processAnalyticsData(payments, expenses, members)
      setAnalyticsData(processedData)

      console.log("Analytics data loaded successfully")
    } catch (error) {
      console.error("Error loading analytics data:", error)
      // Set empty data on error
      setAnalyticsData(emptyAnalyticsData)
    } finally {
      loadingRef.current = false
      setInitialLoading(false)
      setDataLoading(false)
    }
  }, [selectedFranchise, dateRange, isOwner, franchises, currentSubaccountId, initialLoading])

  const loadPaymentsData = async (subaccountIds: string[], fromDate: string, toDate: string) => {
    // Create end date that includes the full day (add 1 day and use 'lt')
    const endDate = new Date(toDate)
    endDate.setDate(endDate.getDate() + 1)
    const endDateString = endDate.toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("payments")
      .select(`
      *,
      member:members!inner(
        id,
        name,
        email,
        subaccount_id,
        subaccount:subaccounts(id, name)
      ),
      plan:plans(id, name, price),
      payment_method:payment_methods(id, name)
    `)
      .in("member.subaccount_id", subaccountIds)
      .gte("paid_at", fromDate)
      .lt("paid_at", endDateString)
      .order("paid_at", { ascending: false })

    if (error) {
      console.error("Error loading payments:", error)
      throw error
    }

    return data || []
  }

  const loadExpensesData = async (subaccountIds: string[], fromDate: string, toDate: string) => {
    // Create end date that includes the full day
    const endDate = new Date(toDate)
    endDate.setDate(endDate.getDate() + 1)
    const endDateString = endDate.toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("expenses")
      .select(`
      *,
      subaccount:subaccounts(id, name)
    `)
      .in("subaccount_id", subaccountIds)
      .gte("created_at", fromDate)
      .lt("created_at", endDateString)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading expenses:", error)
      throw error
    }

    return data || []
  }

  const loadMembersData = async (subaccountIds: string[]) => {
    const { data, error } = await supabase
      .from("members")
      .select(`
      *,
      plan:plans(id, name, price),
      subaccount:subaccounts(id, name)
    `)
      .in("subaccount_id", subaccountIds)
      .order("join_date", { ascending: false })

    if (error) {
      console.error("Error loading members:", error)
      throw error
    }

    return data || []
  }

  const processAnalyticsData = (payments: any[], expenses: any[], members: any[]): AnalyticsData => {
    // Process payments
    const paymentsData = processPaymentsData(payments)
    const expensesData = processExpensesData(expenses)
    const membersData = processMembersData(members)

    return {
      payments: paymentsData,
      expenses: expensesData,
      members: membersData,
      overview: {
        totalRevenue: paymentsData.totalAmount,
        totalExpenses: expensesData.totalAmount,
        netProfit: paymentsData.totalAmount - expensesData.totalAmount,
        totalMembers: membersData.totalMembers,
        activeMembers: membersData.activeMembers,
        newMembers: membersData.newMembers,
        churnRate: membersData.churnRate,
      },
    }
  }

  const processPaymentsData = (payments: any[]) => {
    const enhancedPayments = payments.map((payment) => ({
      ...payment,
      franchiseName: payment.member?.subaccount?.name || "Unknown",
    }))

    const totalAmount = enhancedPayments.reduce(
      (sum, payment) => sum + (payment.final_amount || payment.amount || 0),
      0,
    )

    const paymentsByMonth = enhancedPayments.reduce(
      (acc, payment) => {
        const month = new Date(payment.paid_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
        acc[month] = (acc[month] || 0) + (payment.final_amount || payment.amount || 0)
        return acc
      },
      {} as Record<string, number>,
    )

    const paymentsByPlan = enhancedPayments.reduce(
      (acc, payment) => {
        const planName = payment.plan?.name || "Unknown"
        acc[planName] = (acc[planName] || 0) + (payment.final_amount || payment.amount || 0)
        return acc
      },
      {} as Record<string, number>,
    )

    const paymentsByFranchise = enhancedPayments.reduce(
      (acc, payment) => {
        const franchiseName = payment.member?.subaccount?.name || "Unknown"
        acc[franchiseName] = (acc[franchiseName] || 0) + (payment.final_amount || payment.amount || 0)
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalAmount,
      totalCount: enhancedPayments.length,
      payments: enhancedPayments,
      paymentsByMonth,
      paymentsByPlan,
      paymentsByFranchise,
      averagePayment: enhancedPayments.length ? totalAmount / enhancedPayments.length : 0,
    }
  }

  const processExpensesData = (expenses: any[]) => {
    const totalAmount = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)

    const expensesByMonth = expenses.reduce(
      (acc, expense) => {
        const expenseDate = expense.created_at || expense.date || expense.expense_date || expense.transaction_date
        const month = new Date(expenseDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
        acc[month] = (acc[month] || 0) + (expense.amount || 0)
        return acc
      },
      {} as Record<string, number>,
    )

    const expensesByCategory = expenses.reduce(
      (acc, expense) => {
        const category = expense.category || "Uncategorized"
        acc[category] = (acc[category] || 0) + (expense.amount || 0)
        return acc
      },
      {} as Record<string, number>,
    )

    const expensesByFranchise = expenses.reduce(
      (acc, expense) => {
        const franchiseName = expense.subaccount?.name || "Unknown"
        acc[franchiseName] = (acc[franchiseName] || 0) + (expense.amount || 0)
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalAmount,
      totalCount: expenses.length,
      expenses,
      expensesByMonth,
      expensesByCategory,
      expensesByFranchise,
      averageExpense: expenses.length ? totalAmount / expenses.length : 0,
    }
  }

  const processMembersData = (members: any[]) => {
    const totalMembers = members.length
    const activeMembers = members.filter((m) => m.is_active).length

    // Create end date that includes the full day for new members calculation
    const endDate = new Date(dateRange.to)
    endDate.setDate(endDate.getDate() + 1)

    const newMembers = members.filter((m) => {
      const joinDate = new Date(m.join_date)
      return joinDate >= dateRange.from && joinDate < endDate
    }).length

    const membersByPlan = members.reduce(
      (acc, member) => {
        const planName = member.plan?.name || "No Plan"
        acc[planName] = (acc[planName] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const membersByMonth = members.reduce(
      (acc, member) => {
        const month = new Date(member.join_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
        acc[month] = (acc[month] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const membersByFranchise = members.reduce(
      (acc, member) => {
        const franchiseName = member.subaccount?.name || "Unknown"
        acc[franchiseName] = (acc[franchiseName] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalMembers,
      activeMembers,
      inactiveMembers: totalMembers - activeMembers,
      newMembers,
      churnRate: totalMembers > 0 ? ((totalMembers - activeMembers) / totalMembers) * 100 : 0,
      members,
      membersByPlan,
      membersByMonth,
      membersByFranchise,
    }
  }

  const generatePDF = async () => {
    try {
      setDataLoading(true)

      const franchiseName =
        selectedFranchise === "all"
          ? "All Franchises"
          : franchises.find((f) => f.id === selectedFranchise)?.name || "Current Location"

      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      let yPosition = 20

      // Helper function to add new page if needed
      const checkPageBreak = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - 20) {
          pdf.addPage()
          yPosition = 20
        }
      }

      // Helper function to draw a simple table
      const drawTable = (headers: string[], rows: string[][], startY: number, title?: string) => {
        let currentY = startY

        if (title) {
          pdf.setFontSize(12)
          pdf.setFont("helvetica", "bold")
          pdf.text(title, 20, currentY)
          currentY += 10
        }

        // Calculate column widths
        const tableWidth = pageWidth - 40
        const colWidth = tableWidth / headers.length
        const rowHeight = 8

        // Draw headers
        pdf.setFillColor(59, 130, 246)
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(10)
        pdf.setFont("helvetica", "bold")

        pdf.rect(20, currentY, tableWidth, rowHeight, "F")
        headers.forEach((header, index) => {
          pdf.text(header, 22 + index * colWidth, currentY + 5)
        })

        currentY += rowHeight

        // Draw rows
        pdf.setTextColor(0, 0, 0)
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(9)

        rows.forEach((row, rowIndex) => {
          // Alternate row colors
          if (rowIndex % 2 === 0) {
            pdf.setFillColor(248, 250, 252)
            pdf.rect(20, currentY, tableWidth, rowHeight, "F")
          }

          row.forEach((cell, colIndex) => {
            pdf.text(cell.toString(), 22 + colIndex * colWidth, currentY + 5)
          })

          currentY += rowHeight

          // Check if we need a new page
          if (currentY > pageHeight - 30) {
            pdf.addPage()
            currentY = 20
          }
        })

        return currentY + 10
      }

      // Title Page
      pdf.setFontSize(24)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(0, 0, 0)
      pdf.text("Analytics Report", pageWidth / 2, 40, { align: "center" })

      pdf.setFontSize(16)
      pdf.setFont("helvetica", "normal")
      pdf.text(`Franchise: ${franchiseName}`, pageWidth / 2, 55, { align: "center" })
      pdf.text(
        `Date Range: ${dateRange.from.toLocaleDateString()} to ${dateRange.to.toLocaleDateString()}`,
        pageWidth / 2,
        70,
        { align: "center" },
      )
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 85, { align: "center" })

      yPosition = 110

      // Executive Summary
      checkPageBreak(60)
      pdf.setFontSize(18)
      pdf.setFont("helvetica", "bold")
      pdf.text("Executive Summary", 20, yPosition)
      yPosition += 15

      const summaryHeaders = ["Metric", "Value"]
      const summaryRows = [
        ["Total Revenue", formatCurrency(analyticsData.overview?.totalRevenue || 0)],
        ["Total Expenses", formatCurrency(analyticsData.overview?.totalExpenses || 0)],
        ["Net Profit", formatCurrency(analyticsData.overview?.netProfit || 0)],
        [
          "Profit Margin",
          `${analyticsData.overview?.totalRevenue > 0 ? (((analyticsData.overview?.netProfit || 0) / analyticsData.overview.totalRevenue) * 100).toFixed(1) : 0}%`,
        ],
        ["Total Members", `${analyticsData.overview?.totalMembers || 0}`],
        ["Active Members", `${analyticsData.overview?.activeMembers || 0}`],
        ["New Members", `${analyticsData.overview?.newMembers || 0}`],
        [
          "Member Retention Rate",
          `${analyticsData.members?.churnRate ? (100 - analyticsData.members.churnRate).toFixed(1) : 100}%`,
        ],
      ]

      yPosition = drawTable(summaryHeaders, summaryRows, yPosition)

      // Overview Section
      pdf.addPage()
      yPosition = 20
      pdf.setFontSize(18)
      pdf.setFont("helvetica", "bold")
      pdf.text("Overview Analysis", 20, yPosition)
      yPosition += 20

      // Monthly Revenue vs Expenses
      const monthlyHeaders = ["Month", "Revenue", "Expenses", "Profit"]
      const monthlyRows = Object.keys(analyticsData.payments?.paymentsByMonth || {}).map((month) => [
        month,
        formatCurrency(analyticsData.payments?.paymentsByMonth?.[month] || 0),
        formatCurrency(analyticsData.expenses?.expensesByMonth?.[month] || 0),
        formatCurrency(
          (analyticsData.payments?.paymentsByMonth?.[month] || 0) -
            (analyticsData.expenses?.expensesByMonth?.[month] || 0),
        ),
      ])

      yPosition = drawTable(monthlyHeaders, monthlyRows, yPosition, "Monthly Revenue vs Expenses")

      // Franchise Performance (if applicable)
      if (selectedFranchise === "all" && franchises.length > 1) {
        checkPageBreak(40)
        const franchiseHeaders = ["Franchise", "Revenue", "Expenses", "Members", "Profit Margin"]
        const franchiseRows = Object.keys(analyticsData.payments?.paymentsByFranchise || {}).map((franchise) => [
          franchise,
          `$${(analyticsData.payments?.paymentsByFranchise?.[franchise] || 0).toLocaleString()}`,
          `$${(analyticsData.expenses?.expensesByFranchise?.[franchise] || 0).toLocaleString()}`,
          `${analyticsData.members?.membersByFranchise?.[franchise] || 0}`,
          `${analyticsData.payments?.paymentsByFranchise?.[franchise] ? (((analyticsData.payments.paymentsByFranchise[franchise] - (analyticsData.expenses?.expensesByFranchise?.[franchise] || 0)) / analyticsData.payments.paymentsByFranchise[franchise]) * 100).toFixed(1) : 0}%`,
        ])

        yPosition = drawTable(franchiseHeaders, franchiseRows, yPosition, "Franchise Performance Comparison")
      }

      // Payments Analysis
      pdf.addPage()
      yPosition = 20
      pdf.setFontSize(18)
      pdf.setFont("helvetica", "bold")
      pdf.text("Payments Analysis", 20, yPosition)
      yPosition += 20

      // Payment Summary
      const paymentSummaryHeaders = ["Metric", "Value"]
      const paymentSummaryRows = [
        ["Total Payments", `${analyticsData.payments?.totalCount || 0}`],
        ["Total Amount", `$${analyticsData.payments?.totalAmount?.toLocaleString() || "0"}`],
        ["Average Payment", `$${analyticsData.payments?.averagePayment?.toFixed(2) || "0"}`],
        [
          "Payment Methods",
          `${
            Object.keys(
              analyticsData.payments?.payments?.reduce((acc: any, p: any) => {
                acc[p.payment_method?.name || "Unknown"] = true
                return acc
              }, {}) || {},
            ).length
          }`,
        ],
      ]

      yPosition = drawTable(paymentSummaryHeaders, paymentSummaryRows, yPosition, "Payment Summary")

      // Revenue by Plan
      checkPageBreak(40)
      const planRevenueHeaders = ["Plan", "Revenue", "Percentage"]
      const planRevenueRows = Object.keys(analyticsData.payments?.paymentsByPlan || {}).map((plan) => [
        plan,
        `$${(analyticsData.payments?.paymentsByPlan?.[plan] || 0).toLocaleString()}`,
        `${(((analyticsData.payments?.paymentsByPlan?.[plan] || 0) / (analyticsData.payments?.totalAmount || 1)) * 100).toFixed(1)}%`,
      ])

      yPosition = drawTable(planRevenueHeaders, planRevenueRows, yPosition, "Revenue by Plan")

      // Recent Payments
      checkPageBreak(40)
      const recentPaymentsHeaders = ["Date", "Member", "Plan", "Amount", "Method"]
      const recentPaymentsRows = (analyticsData.payments?.payments || [])
        .slice(0, 10)
        .map((payment: any) => [
          new Date(payment.paid_at).toLocaleDateString(),
          payment.member?.name || "Unknown",
          payment.plan?.name || "N/A",
          `$${payment.final_amount || payment.amount || 0}`,
          payment.payment_method?.name || "N/A",
        ])

      yPosition = drawTable(recentPaymentsHeaders, recentPaymentsRows, yPosition, "Recent Payments (Top 10)")

      // Expenses Analysis
      pdf.addPage()
      yPosition = 20
      pdf.setFontSize(18)
      pdf.setFont("helvetica", "bold")
      pdf.text("Expenses Analysis", 20, yPosition)
      yPosition += 20

      // Expense Summary
      const expenseSummaryHeaders = ["Metric", "Value"]
      const expenseSummaryRows = [
        ["Total Expenses", `${analyticsData.expenses?.totalCount || 0}`],
        ["Total Amount", `$${analyticsData.expenses?.totalAmount?.toLocaleString() || "0"}`],
        ["Average Expense", `$${analyticsData.expenses?.averageExpense?.toFixed(2) || "0"}`],
        ["Categories", `${Object.keys(analyticsData.expenses?.expensesByCategory || {}).length}`],
      ]

      yPosition = drawTable(expenseSummaryHeaders, expenseSummaryRows, yPosition, "Expense Summary")

      // Expenses by Category
      checkPageBreak(40)
      const categoryExpenseHeaders = ["Category", "Amount", "Percentage"]
      const categoryExpenseRows = Object.keys(analyticsData.expenses?.expensesByCategory || {}).map((category) => [
        category,
        `$${(analyticsData.expenses?.expensesByCategory?.[category] || 0).toLocaleString()}`,
        `${(((analyticsData.expenses?.expensesByCategory?.[category] || 0) / (analyticsData.expenses?.totalAmount || 1)) * 100).toFixed(1)}%`,
      ])

      yPosition = drawTable(categoryExpenseHeaders, categoryExpenseRows, yPosition, "Expenses by Category")

      // Recent Expenses
      checkPageBreak(40)
      const recentExpensesHeaders = ["Date", "Description", "Category", "Amount", "Location"]
      const recentExpensesRows = (analyticsData.expenses?.expenses || [])
        .slice(0, 10)
        .map((expense: any) => [
          new Date(expense.created_at || expense.date || expense.expense_date).toLocaleDateString(),
          expense.description || "N/A",
          expense.category || "Uncategorized",
          `$${expense.amount || 0}`,
          expense.subaccount?.name || "Unknown",
        ])

      yPosition = drawTable(recentExpensesHeaders, recentExpensesRows, yPosition, "Recent Expenses (Top 10)")

      // Members Analysis
      pdf.addPage()
      yPosition = 20
      pdf.setFontSize(18)
      pdf.setFont("helvetica", "bold")
      pdf.text("Members Analysis", 20, yPosition)
      yPosition += 20

      // Member Summary
      const memberSummaryHeaders = ["Metric", "Value"]
      const memberSummaryRows = [
        ["Total Members", `${analyticsData.members?.totalMembers || 0}`],
        ["Active Members", `${analyticsData.members?.activeMembers || 0}`],
        ["Inactive Members", `${analyticsData.members?.inactiveMembers || 0}`],
        ["New Members (Period)", `${analyticsData.members?.newMembers || 0}`],
        [
          "Retention Rate",
          `${analyticsData.members?.churnRate ? (100 - analyticsData.members.churnRate).toFixed(1) : 100}%`,
        ],
        ["Active Plans", `${Object.keys(analyticsData.members?.membersByPlan || {}).length}`],
      ]

      yPosition = drawTable(memberSummaryHeaders, memberSummaryRows, yPosition, "Member Summary")

      // Members by Plan
      checkPageBreak(40)
      const planMemberHeaders = ["Plan", "Members", "Percentage"]
      const planMemberRows = Object.keys(analyticsData.members?.membersByPlan || {}).map((plan) => [
        plan,
        `${analyticsData.members?.membersByPlan?.[plan] || 0}`,
        `${(((analyticsData.members?.membersByPlan?.[plan] || 0) / (analyticsData.members?.totalMembers || 1)) * 100).toFixed(1)}%`,
      ])

      yPosition = drawTable(planMemberHeaders, planMemberRows, yPosition, "Members by Plan")

      // Demographics
      checkPageBreak(40)
      const genderHeaders = ["Gender", "Count"]
      const genderRows = [
        ["Male", `${(analyticsData.members?.members || []).filter((m: any) => m.gender === "male").length}`],
        ["Female", `${(analyticsData.members?.members || []).filter((m: any) => m.gender === "female").length}`],
        [
          "Other/Not Specified",
          `${(analyticsData.members?.members || []).filter((m: any) => !m.gender || (m.gender !== "male" && m.gender !== "female")).length}`,
        ],
      ]

      yPosition = drawTable(genderHeaders, genderRows, yPosition, "Member Demographics")

      // Age Distribution
      checkPageBreak(40)
      const ageHeaders = ["Age Group", "Count"]
      const ageRows = [
        ["18-24", `${(analyticsData.members?.members || []).filter((m: any) => m.age >= 18 && m.age <= 24).length}`],
        ["25-34", `${(analyticsData.members?.members || []).filter((m: any) => m.age >= 25 && m.age <= 34).length}`],
        ["35-44", `${(analyticsData.members?.members || []).filter((m: any) => m.age >= 35 && m.age <= 44).length}`],
        ["45-54", `${(analyticsData.members?.members || []).filter((m: any) => m.age >= 45 && m.age <= 54).length}`],
        ["55+", `${(analyticsData.members?.members || []).filter((m: any) => m.age >= 55).length}`],
        ["Unknown", `${(analyticsData.members?.members || []).filter((m: any) => !m.age).length}`],
      ]

      yPosition = drawTable(ageHeaders, ageRows, yPosition, "Age Distribution")

      // Footer on each page
      const totalPages = pdf.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setFont("helvetica", "normal")
        pdf.setTextColor(128, 128, 128)
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10)
        pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, pageHeight - 10)
      }

      // Save the PDF
      const fileName = `analytics-report-${franchiseName.replace(/\s+/g, "-")}-${dateRange.from.toISOString().split("T")[0]}-to-${dateRange.to.toISOString().split("T")[0]}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Error generating PDF report. Please try again.")
    } finally {
      setDataLoading(false)
    }
  }

  const generateReport = () => {
    const franchiseName =
      selectedFranchise === "all"
        ? "All Franchises"
        : franchises.find((f) => f.id === selectedFranchise)?.name || "Current Location"

    const csvContent = [
      "Analytics Report",
      `Franchise: ${franchiseName}`,
      `Date Range: ${dateRange.from.toLocaleDateString()} to ${dateRange.to.toLocaleDateString()}`,
      "",
      "Overview",
      `Total Revenue,$${analyticsData.overview?.totalRevenue?.toLocaleString() || 0}`,
      `Total Expenses,$${analyticsData.overview?.totalExpenses?.toLocaleString() || 0}`,
      `Net Profit,$${analyticsData.overview?.netProfit?.toLocaleString() || 0}`,
      `Total Members,${analyticsData.overview?.totalMembers || 0}`,
      `Active Members,${analyticsData.overview?.activeMembers || 0}`,
      `New Members,${analyticsData.overview?.newMembers || 0}`,
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-report-${franchiseName.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  // Show initial loading state with proper skeleton
  if (initialLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Loading comprehensive insights and performance metrics...</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-10 w-[200px] bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-[280px] bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-[140px] bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Key Metrics Skeleton */}
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-6">
          <div className="grid w-full grid-cols-4 h-10 bg-gray-100 rounded-lg p-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 bg-gray-200 rounded animate-pulse mx-1"></div>
            ))}
          </div>

          {/* Default to overview skeleton */}
          <OverviewAnalyticsSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Show franchise selector only for owners with multiple franchises */}
          {isOwner && franchises.length > 1 && (
            <Select value={selectedFranchise} onValueChange={setSelectedFranchise} disabled={dataLoading}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Franchise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Franchises</SelectItem>
                {franchises.map((franchise) => (
                  <SelectItem key={franchise.id} value={franchise.id}>
                    {franchise.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
          <Button onClick={generatePDF} className="bg-blue-600 hover:bg-blue-700" disabled={dataLoading}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF Report
          </Button>
        </div>
      </div>

      {/* Data Loading Indicator */}
      {dataLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-blue-500 bg-blue-50 border border-blue-200">
            <svg
              className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Updating analytics data...
          </div>
        </div>
      )}

      {/* Key Metrics Overview */}
      {dataLoading ? (
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  {/* Update metric cards */}
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analyticsData.overview?.totalRevenue || 0)}
                  </p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-600">
                      {analyticsData.payments?.totalCount || 0} payments
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-green-100 text-green-600">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  {/* Update metric cards */}
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analyticsData.overview?.totalExpenses || 0)}
                  </p>
                  <div className="flex items-center mt-2">
                    <Receipt className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm font-medium text-red-600">
                      {analyticsData.expenses?.totalCount || 0} expenses
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-red-100 text-red-600">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Profit</p>
                  {/* Update metric cards */}
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analyticsData.overview?.netProfit || 0)}
                  </p>
                  <div className="flex items-center mt-2">
                    {(analyticsData.overview?.netProfit || 0) >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        (analyticsData.overview?.netProfit || 0) >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {(analyticsData.overview?.netProfit || 0) >= 0 ? "Profit" : "Loss"}
                    </span>
                  </div>
                </div>
                <div
                  className={`p-3 rounded-2xl ${
                    (analyticsData.overview?.netProfit || 0) >= 0
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Members</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.overview?.activeMembers || 0}</p>
                  <div className="flex items-center mt-2">
                    <Users className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-sm font-medium text-blue-600">
                      {analyticsData.overview?.newMembers || 0} new this period
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {dataLoading ? (
            <OverviewAnalyticsSkeleton />
          ) : (
            <OverviewAnalytics
              data={analyticsData}
              dateRange={dateRange}
              selectedFranchise={selectedFranchise}
              franchises={franchises}
            />
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          {dataLoading ? (
            <PaymentAnalyticsSkeleton />
          ) : (
            <PaymentAnalytics
              data={analyticsData.payments}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              selectedFranchise={selectedFranchise}
              franchises={franchises}
            />
          )}
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          {dataLoading ? (
            <ExpenseAnalyticsSkeleton />
          ) : (
            <ExpenseAnalytics
              data={analyticsData.expenses}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              selectedFranchise={selectedFranchise}
              franchises={franchises}
            />
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          {dataLoading ? (
            <MemberAnalyticsSkeleton />
          ) : (
            <MemberAnalytics
              data={analyticsData.members}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              selectedFranchise={selectedFranchise}
              franchises={franchises}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
