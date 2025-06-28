"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Download, QrCode, Smartphone, Fingerprint, Search } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { CheckInModal } from "@/components/attendance/check-in-modal"
import type { CheckIn } from "@/types/gym"

export default function AttendancePage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [showCheckInModal, setShowCheckInModal] = useState(false)

  useEffect(() => {
    const savedCheckIns = JSON.parse(localStorage.getItem("gym_checkins") || "[]")
    if (savedCheckIns.length === 0) {
      // Initialize with sample data
      const sampleCheckIns: CheckIn[] = [
        {
          id: "1",
          memberId: "1",
          memberName: "Sarah Johnson",
          checkInTime: new Date().toISOString(),
          checkOutTime: null,
          method: "qr",
          status: "active",
        },
        {
          id: "2",
          memberId: "2",
          memberName: "Mike Chen",
          checkInTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          checkOutTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          method: "rfid",
          status: "completed",
        },
        {
          id: "3",
          memberId: "3",
          memberName: "Emma Wilson",
          checkInTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          checkOutTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          method: "biometric",
          status: "completed",
        },
      ]
      setCheckIns(sampleCheckIns)
      localStorage.setItem("gym_checkins", JSON.stringify(sampleCheckIns))
    } else {
      setCheckIns(savedCheckIns)
    }
  }, [])

  const filteredCheckIns = checkIns.filter((checkIn) => {
    const matchesSearch = checkIn.memberName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDate = dateFilter === "" || checkIn.checkInTime.startsWith(dateFilter)
    return matchesSearch && matchesDate
  })

  const handleCheckIn = (memberName: string, method: string) => {
    const newCheckIn: CheckIn = {
      id: Date.now().toString(),
      memberId: Date.now().toString(),
      memberName,
      checkInTime: new Date().toISOString(),
      checkOutTime: null,
      method: method as "manual" | "qr" | "rfid" | "biometric",
      status: "active",
    }
    const updatedCheckIns = [newCheckIn, ...checkIns]
    setCheckIns(updatedCheckIns)
    localStorage.setItem("gym_checkins", JSON.stringify(updatedCheckIns))
    setShowCheckInModal(false)
  }

  const exportCSV = () => {
    const headers = ["Member", "Check In", "Check Out", "Duration", "Method", "Status"]
    const csvContent = [
      headers.join(","),
      ...filteredCheckIns.map((checkIn) => {
        const duration = checkIn.checkOutTime
          ? Math.round((new Date(checkIn.checkOutTime).getTime() - new Date(checkIn.checkInTime).getTime()) / 60000)
          : "Active"
        return [
          checkIn.memberName,
          new Date(checkIn.checkInTime).toLocaleString(),
          checkIn.checkOutTime ? new Date(checkIn.checkOutTime).toLocaleString() : "Active",
          duration,
          checkIn.method,
          checkIn.status,
        ].join(",")
      }),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "attendance.csv"
    a.click()
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "qr":
        return <QrCode className="h-4 w-4" />
      case "rfid":
        return <Smartphone className="h-4 w-4" />
      case "biometric":
        return <Fingerprint className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const columns = [
    {
      header: "Member",
      accessorKey: "memberName",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
            <span className="text-teal-600 font-medium text-sm">{row.original.memberName.charAt(0)}</span>
          </div>
          <span className="font-medium">{row.original.memberName}</span>
        </div>
      ),
    },
    {
      header: "Check In",
      accessorKey: "checkInTime",
      cell: ({ row }: any) => new Date(row.original.checkInTime).toLocaleString(),
    },
    {
      header: "Check Out",
      accessorKey: "checkOutTime",
      cell: ({ row }: any) =>
        row.original.checkOutTime ? new Date(row.original.checkOutTime).toLocaleString() : "Active",
    },
    {
      header: "Duration",
      cell: ({ row }: any) => {
        if (!row.original.checkOutTime) return "Active"
        const duration = Math.round(
          (new Date(row.original.checkOutTime).getTime() - new Date(row.original.checkInTime).getTime()) / 60000,
        )
        return `${duration} min`
      },
    },
    {
      header: "Method",
      accessorKey: "method",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          {getMethodIcon(row.original.method)}
          <span className="capitalize">{row.original.method}</span>
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
  ]

  const todayCheckIns = checkIns.filter((checkIn) =>
    checkIn.checkInTime.startsWith(new Date().toISOString().split("T")[0]),
  ).length

  const activeMembers = checkIns.filter((checkIn) => checkIn.status === "active").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600">Track member check-ins and gym usage</p>
        </div>
        <Button onClick={() => setShowCheckInModal(true)} className="bg-teal-600 hover:bg-teal-700">
          <Clock className="mr-2 h-4 w-4" />
          Manual Check-in
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Check-ins</p>
                <p className="text-2xl font-bold text-gray-900">{todayCheckIns}</p>
              </div>
              <div className="p-3 rounded-2xl bg-teal-100 text-teal-600">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Currently Active</p>
                <p className="text-2xl font-bold text-gray-900">{activeMembers}</p>
              </div>
              <div className="p-3 rounded-2xl bg-green-100 text-green-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Peak Hour</p>
                <p className="text-2xl font-bold text-gray-900">6-8 PM</p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-100 text-purple-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold text-gray-900">85 min</p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Check-in Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Check-in Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <QrCode className="h-6 w-6" />
              <span>QR Code</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Smartphone className="h-6 w-6" />
              <span>RFID Card</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Fingerprint className="h-6 w-6" />
              <span>Biometric</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Clock className="h-6 w-6" />
              <span>Manual</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-auto" />
            <Button variant="outline" onClick={exportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Check-ins ({filteredCheckIns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredCheckIns} searchKey="memberName" />
        </CardContent>
      </Card>

      <CheckInModal open={showCheckInModal} onClose={() => setShowCheckInModal(false)} onCheckIn={handleCheckIn} />
    </div>
  )
}
