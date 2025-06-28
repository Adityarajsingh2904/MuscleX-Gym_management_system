"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Download, Calendar, Clock, Users, Edit, Trash2 } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { AddClassModal } from "@/components/classes/add-class-modal"
import { ClassScheduleCalendar } from "@/components/classes/class-schedule-calendar"
import type { GymClass } from "@/types/gym"

export default function ClassesPage() {
  const [classes, setClasses] = useState<GymClass[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table")

  useEffect(() => {
    const savedClasses = JSON.parse(localStorage.getItem("gym_classes") || "[]")
    if (savedClasses.length === 0) {
      // Initialize with sample data
      const sampleClasses: GymClass[] = [
        {
          id: "1",
          name: "Morning Yoga",
          type: "Yoga",
          instructor: "Sarah Wilson",
          instructorId: "1",
          schedule: {
            dayOfWeek: "Monday",
            startTime: "07:00",
            endTime: "08:00",
            recurring: true,
          },
          capacity: 20,
          enrolled: 18,
          price: 25,
          description: "Start your week with a peaceful yoga session",
          status: "active",
          room: "Studio A",
        },
        {
          id: "2",
          name: "HIIT Training",
          type: "HIIT",
          instructor: "Mike Johnson",
          instructorId: "2",
          schedule: {
            dayOfWeek: "Tuesday",
            startTime: "09:00",
            endTime: "10:00",
            recurring: true,
          },
          capacity: 15,
          enrolled: 12,
          price: 30,
          description: "High-intensity interval training for maximum results",
          status: "active",
          room: "Gym Floor",
        },
        {
          id: "3",
          name: "Zumba Dance",
          type: "Dance",
          instructor: "Emma Garcia",
          instructorId: "3",
          schedule: {
            dayOfWeek: "Wednesday",
            startTime: "18:00",
            endTime: "19:00",
            recurring: true,
          },
          capacity: 25,
          enrolled: 22,
          price: 20,
          description: "Fun dance fitness class with Latin rhythms",
          status: "active",
          room: "Studio B",
        },
      ]
      setClasses(sampleClasses)
      localStorage.setItem("gym_classes", JSON.stringify(sampleClasses))
    } else {
      setClasses(savedClasses)
    }
  }, [])

  const filteredClasses = classes.filter((gymClass) => {
    const matchesSearch =
      gymClass.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gymClass.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gymClass.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || gymClass.type.toLowerCase() === filterType.toLowerCase()
    return matchesSearch && matchesFilter
  })

  const handleAddClass = (newClass: Omit<GymClass, "id">) => {
    const gymClass: GymClass = {
      ...newClass,
      id: Date.now().toString(),
    }
    const updatedClasses = [...classes, gymClass]
    setClasses(updatedClasses)
    localStorage.setItem("gym_classes", JSON.stringify(updatedClasses))
    setShowAddModal(false)
  }

  const exportCSV = () => {
    const headers = ["Name", "Type", "Instructor", "Day", "Time", "Capacity", "Enrolled", "Price", "Status"]
    const csvContent = [
      headers.join(","),
      ...filteredClasses.map((gymClass) =>
        [
          gymClass.name,
          gymClass.type,
          gymClass.instructor,
          gymClass.schedule.dayOfWeek,
          `${gymClass.schedule.startTime}-${gymClass.schedule.endTime}`,
          gymClass.capacity,
          gymClass.enrolled,
          gymClass.price,
          gymClass.status,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "classes.csv"
    a.click()
  }

  const columns = [
    {
      header: "Class",
      accessorKey: "name",
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-gray-500">{row.original.type}</div>
        </div>
      ),
    },
    {
      header: "Instructor",
      accessorKey: "instructor",
    },
    {
      header: "Schedule",
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.schedule.dayOfWeek}</div>
          <div className="text-sm text-gray-500">
            {row.original.schedule.startTime} - {row.original.schedule.endTime}
          </div>
        </div>
      ),
    },
    {
      header: "Capacity",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span>
            {row.original.enrolled}/{row.original.capacity}
          </span>
        </div>
      ),
    },
    {
      header: "Price",
      accessorKey: "price",
      cell: ({ row }: any) => `$${row.original.price}`,
    },
    {
      header: "Room",
      accessorKey: "room",
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

  const totalClasses = classes.length
  const activeClasses = classes.filter((c) => c.status === "active").length
  const totalEnrollment = classes.reduce((sum, c) => sum + c.enrolled, 0)
  const avgCapacity =
    classes.length > 0 ? Math.round((totalEnrollment / classes.reduce((sum, c) => sum + c.capacity, 0)) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600">Manage gym classes and schedules</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex rounded-lg border border-gray-200 p-1">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className={viewMode === "table" ? "bg-teal-600 hover:bg-teal-700" : ""}
            >
              Table
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className={viewMode === "calendar" ? "bg-teal-600 hover:bg-teal-700" : ""}
            >
              Calendar
            </Button>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Class
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">{totalClasses}</p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Classes</p>
                <p className="text-2xl font-bold text-gray-900">{activeClasses}</p>
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
                <p className="text-sm font-medium text-gray-600">Total Enrollment</p>
                <p className="text-2xl font-bold text-gray-900">{totalEnrollment}</p>
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
                <p className="text-sm font-medium text-gray-600">Avg Capacity</p>
                <p className="text-2xl font-bold text-gray-900">{avgCapacity}%</p>
              </div>
              <div className="p-3 rounded-2xl bg-orange-100 text-orange-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === "calendar" ? (
        <ClassScheduleCalendar classes={classes} />
      ) : (
        <>
          {/* Filters and Search */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search classes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Types</option>
                  <option value="yoga">Yoga</option>
                  <option value="hiit">HIIT</option>
                  <option value="dance">Dance</option>
                  <option value="strength">Strength</option>
                  <option value="cardio">Cardio</option>
                </select>
                <Button variant="outline" onClick={exportCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Classes Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Classes ({filteredClasses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={filteredClasses} searchKey="name" />
            </CardContent>
          </Card>
        </>
      )}

      <AddClassModal open={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddClass} />
    </div>
  )
}
