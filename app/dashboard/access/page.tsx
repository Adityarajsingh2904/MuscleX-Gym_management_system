"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Shield, Key, Users, Clock, Lock, Unlock, Edit, Trash2, AlertTriangle } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { AccessControlCard } from "@/components/access/access-control-card"
import { CreateAccessRuleModal } from "@/components/access/create-access-rule-modal"
import { AccessLogsCard } from "@/components/access/access-logs-card"
import { SecuritySettingsCard } from "@/components/access/security-settings-card"
import type { AccessRule, AccessLog } from "@/types/gym"

export default function AccessControlPage() {
  const [accessRules, setAccessRules] = useState<AccessRule[]>([])
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    const savedRules = JSON.parse(localStorage.getItem("gym_access_rules") || "[]")
    const savedLogs = JSON.parse(localStorage.getItem("gym_access_logs") || "[]")

    if (savedRules.length === 0) {
      // Initialize with sample data
      const sampleRules: AccessRule[] = [
        {
          id: "1",
          name: "Premium Members 24/7",
          description: "Full access for premium members",
          membershipTypes: ["Premium", "VIP Elite"],
          areas: ["Gym Floor", "Locker Rooms", "Studio A", "Studio B"],
          timeRestrictions: {
            enabled: false,
            schedule: {},
          },
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Basic Members Daytime",
          description: "Limited hours access for basic members",
          membershipTypes: ["Basic"],
          areas: ["Gym Floor", "Locker Rooms"],
          timeRestrictions: {
            enabled: true,
            schedule: {
              monday: { start: "06:00", end: "22:00" },
              tuesday: { start: "06:00", end: "22:00" },
              wednesday: { start: "06:00", end: "22:00" },
              thursday: { start: "06:00", end: "22:00" },
              friday: { start: "06:00", end: "22:00" },
              saturday: { start: "08:00", end: "20:00" },
              sunday: { start: "08:00", end: "18:00" },
            },
          },
          status: "active",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "3",
          name: "Staff Access",
          description: "Full administrative access for staff",
          membershipTypes: ["Staff"],
          areas: ["All Areas", "Office", "Storage", "Equipment Room"],
          timeRestrictions: {
            enabled: false,
            schedule: {},
          },
          status: "active",
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]
      setAccessRules(sampleRules)
      localStorage.setItem("gym_access_rules", JSON.stringify(sampleRules))
    } else {
      setAccessRules(savedRules)
    }

    if (savedLogs.length === 0) {
      const sampleLogs: AccessLog[] = [
        {
          id: "1",
          memberId: "1",
          memberName: "Sarah Johnson",
          area: "Gym Floor",
          action: "entry",
          method: "rfid",
          timestamp: new Date().toISOString(),
          status: "granted",
          ruleApplied: "Premium Members 24/7",
        },
        {
          id: "2",
          memberId: "2",
          memberName: "Mike Chen",
          area: "Studio A",
          action: "entry",
          method: "qr",
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: "denied",
          ruleApplied: "Basic Members Daytime",
          reason: "Area not permitted for membership type",
        },
        {
          id: "3",
          memberId: "3",
          memberName: "Emma Wilson",
          area: "Locker Rooms",
          action: "exit",
          method: "biometric",
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          status: "granted",
          ruleApplied: "Premium Members 24/7",
        },
      ]
      setAccessLogs(sampleLogs)
      localStorage.setItem("gym_access_logs", JSON.stringify(sampleLogs))
    } else {
      setAccessLogs(savedLogs)
    }
  }, [])

  const filteredRules = accessRules.filter((rule) => {
    const matchesSearch =
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || rule.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleCreateRule = (ruleData: Omit<AccessRule, "id" | "createdAt" | "updatedAt">) => {
    const rule: AccessRule = {
      ...ruleData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const updatedRules = [rule, ...accessRules]
    setAccessRules(updatedRules)
    localStorage.setItem("gym_access_rules", JSON.stringify(updatedRules))
    setShowCreateModal(false)
  }

  const handleToggleRule = (ruleId: string) => {
    const updatedRules = accessRules.map((rule) =>
      rule.id === ruleId
        ? {
            ...rule,
            status: rule.status === "active" ? ("inactive" as const) : ("active" as const),
            updatedAt: new Date().toISOString(),
          }
        : rule,
    )
    setAccessRules(updatedRules)
    localStorage.setItem("gym_access_rules", JSON.stringify(updatedRules))
  }

  const handleDeleteRule = (ruleId: string) => {
    const updatedRules = accessRules.filter((rule) => rule.id !== ruleId)
    setAccessRules(updatedRules)
    localStorage.setItem("gym_access_rules", JSON.stringify(updatedRules))
  }

  const columns = [
    {
      header: "Rule",
      accessorKey: "name",
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-gray-500">{row.original.description}</div>
        </div>
      ),
    },
    {
      header: "Membership Types",
      accessorKey: "membershipTypes",
      cell: ({ row }: any) => (
        <div className="flex flex-wrap gap-1">
          {row.original.membershipTypes.map((type: string) => (
            <Badge key={type} variant="outline" className="text-xs">
              {type}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: "Areas",
      accessorKey: "areas",
      cell: ({ row }: any) => (
        <div className="text-sm">
          {row.original.areas.slice(0, 2).join(", ")}
          {row.original.areas.length > 2 && (
            <span className="text-gray-500"> +{row.original.areas.length - 2} more</span>
          )}
        </div>
      ),
    },
    {
      header: "Time Restrictions",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{row.original.timeRestrictions.enabled ? "Restricted" : "24/7"}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }: any) => (
        <Badge
          variant={row.original.status === "active" ? "default" : "secondary"}
          className={row.original.status === "active" ? "bg-green-100 text-green-800" : ""}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => handleToggleRule(row.original.id)}>
            {row.original.status === "active" ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteRule(row.original.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const activeRules = accessRules.filter((rule) => rule.status === "active").length
  const totalAreas = new Set(accessRules.flatMap((rule) => rule.areas)).size
  const recentDenials = accessLogs.filter(
    (log) => log.status === "denied" && new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000),
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Access Control</h1>
          <p className="text-gray-600">Manage member access permissions and security settings</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Create Rule
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Rules</p>
                <p className="text-2xl font-bold text-gray-900">{activeRules}</p>
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
                <p className="text-sm font-medium text-gray-600">Protected Areas</p>
                <p className="text-2xl font-bold text-gray-900">{totalAreas}</p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                <Key className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Access</p>
                <p className="text-2xl font-bold text-gray-900">{accessLogs.length}</p>
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
                <p className="text-sm font-medium text-gray-600">Recent Denials</p>
                <p className="text-2xl font-bold text-gray-900">{recentDenials}</p>
              </div>
              <div className="p-3 rounded-2xl bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Access Rules */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search access rules..."
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Access Rules Table */}
          <Card>
            <CardHeader>
              <CardTitle>Access Rules ({filteredRules.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={filteredRules} searchKey="name" />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <AccessControlCard />
          <SecuritySettingsCard />
        </div>
      </div>

      {/* Access Logs */}
      <AccessLogsCard logs={accessLogs.slice(0, 10)} />

      <CreateAccessRuleModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateRule}
      />
    </div>
  )
}
