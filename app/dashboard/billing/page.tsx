"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Plus,
  Search,
  Download,
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  FileText,
  Send,
  Calendar,
  Clock,
} from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { CreateInvoiceModal } from "@/components/billing/create-invoice-modal"
import { PaymentMethodsCard } from "@/components/billing/payment-methods-card"
import { OverduePaymentsCard } from "@/components/billing/overdue-payments-card"
import { RevenueAnalyticsCard } from "@/components/billing/revenue-analytics-card"
import type { Payment, Invoice } from "@/types/gym"

export default function BillingPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showCreateInvoice, setShowCreateInvoice] = useState(false)
  const [activeTab, setActiveTab] = useState("payments")

  useEffect(() => {
    const savedPayments = JSON.parse(localStorage.getItem("gym_payments") || "[]")
    const savedInvoices = JSON.parse(localStorage.getItem("gym_invoices") || "[]")

    if (savedPayments.length === 0) {
      // Initialize with sample data
      const samplePayments: Payment[] = [
        {
          id: "1",
          memberId: "1",
          memberName: "Sarah Johnson",
          amount: 89,
          method: "credit_card",
          status: "completed",
          type: "subscription",
          description: "Monthly Premium Package",
          date: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          invoiceId: "INV-001",
        },
        {
          id: "2",
          memberId: "2",
          memberName: "Mike Chen",
          amount: 59,
          method: "bank_transfer",
          status: "pending",
          type: "subscription",
          description: "Monthly Basic Package",
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString(),
          invoiceId: "INV-002",
        },
      ]
      setPayments(samplePayments)
      localStorage.setItem("gym_payments", JSON.stringify(samplePayments))
    } else {
      setPayments(savedPayments)
    }

    if (savedInvoices.length === 0) {
      const sampleInvoices: Invoice[] = [
        {
          id: "INV-001",
          memberId: "1",
          memberName: "Sarah Johnson",
          amount: 89,
          status: "paid",
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          issueDate: new Date().toISOString(),
          items: [{ description: "Monthly Premium Package", amount: 89 }],
          notes: "Thank you for your membership!",
        },
      ]
      setInvoices(sampleInvoices)
      localStorage.setItem("gym_invoices", JSON.stringify(sampleInvoices))
    } else {
      setInvoices(savedInvoices)
    }
  }, [])

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || payment.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const handleCreateInvoice = (invoiceData: Omit<Invoice, "id">) => {
    const invoice: Invoice = {
      ...invoiceData,
      id: `INV-${String(invoices.length + 1).padStart(3, "0")}`,
    }
    const updatedInvoices = [invoice, ...invoices]
    setInvoices(updatedInvoices)
    localStorage.setItem("gym_invoices", JSON.stringify(updatedInvoices))
    setShowCreateInvoice(false)
  }

  const exportData = () => {
    const headers = ["Member", "Amount", "Method", "Status", "Type", "Description", "Date", "Due Date"]
    const csvContent = [
      headers.join(","),
      ...filteredPayments.map((payment) =>
        [
          payment.memberName,
          payment.amount,
          payment.method,
          payment.status,
          payment.type,
          payment.description,
          new Date(payment.date).toLocaleDateString(),
          new Date(payment.dueDate).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "billing-data.csv"
    a.click()
  }

  const paymentColumns = [
    {
      header: "Member",
      accessorKey: "memberName",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">{row.original.memberName.charAt(0)}</span>
          </div>
          <div>
            <span className="font-medium">{row.original.memberName}</span>
            <div className="text-sm text-gray-500">{row.original.invoiceId}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: ({ row }: any) => <span className="font-medium text-green-600">${row.original.amount}</span>,
    },
    {
      header: "Method",
      accessorKey: "method",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <CreditCard className="h-4 w-4" />
          <span className="capitalize">{row.original.method.replace("_", " ")}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }: any) => {
        const getStatusColor = (status: string) => {
          switch (status) {
            case "completed":
              return "bg-green-100 text-green-800"
            case "pending":
              return "bg-yellow-100 text-yellow-800"
            case "failed":
              return "bg-red-100 text-red-800"
            case "overdue":
              return "bg-red-100 text-red-800"
            default:
              return "bg-gray-100 text-gray-800"
          }
        }
        return (
          <Badge variant="secondary" className={getStatusColor(row.original.status)}>
            {row.original.status}
          </Badge>
        )
      },
    },
    {
      header: "Type",
      accessorKey: "type",
      cell: ({ row }: any) => (
        <Badge variant="outline" className="capitalize">
          {row.original.type}
        </Badge>
      ),
    },
    {
      header: "Due Date",
      accessorKey: "dueDate",
      cell: ({ row }: any) => new Date(row.original.dueDate).toLocaleDateString(),
    },
    {
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <FileText className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const totalRevenue = payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0)
  const pendingPayments = payments.filter((p) => p.status === "pending").length
  const overduePayments = payments.filter(
    (p) => p.status === "overdue" || (p.status === "pending" && new Date(p.dueDate) < new Date()),
  ).length
  const thisMonthRevenue = payments
    .filter((p) => p.status === "completed" && new Date(p.date).getMonth() === new Date().getMonth())
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Invoices</h1>
          <p className="text-gray-600">Manage payments, invoices, and financial transactions</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => setShowCreateInvoice(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm font-medium text-green-600">+12.5%</span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
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
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">${thisMonthRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <Calendar className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-sm text-gray-500">Current period</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">{pendingPayments}</p>
                <div className="flex items-center mt-2">
                  <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm text-gray-500">Awaiting payment</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-yellow-100 text-yellow-600">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{overduePayments}</p>
                <div className="flex items-center mt-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-sm text-gray-500">Requires attention</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-red-100 text-red-600">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="flex space-x-2 mb-4">
            {[
              { id: "payments", label: "Payments" },
              { id: "invoices", label: "Invoices" },
              { id: "analytics", label: "Analytics" },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="overdue">Overdue</option>
            </select>
            <Button variant="outline" onClick={exportData}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {activeTab === "payments" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments ({filteredPayments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable columns={paymentColumns} data={filteredPayments} searchKey="memberName" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <PaymentMethodsCard />
            <OverduePaymentsCard overduePayments={payments.filter((p) => p.status === "overdue")} />
          </div>
        </div>
      )}

      {activeTab === "analytics" && <RevenueAnalyticsCard payments={payments} />}

      <CreateInvoiceModal
        open={showCreateInvoice}
        onClose={() => setShowCreateInvoice(false)}
        onCreate={handleCreateInvoice}
      />
    </div>
  )
}
