"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Download, Upload, Edit, Trash2, Eye, Star, Calendar } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { AddTrainerModal } from "@/components/trainers/add-trainer-modal"
import type { Trainer } from "@/types/gym"

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    const savedTrainers = JSON.parse(localStorage.getItem("gym_trainers") || "[]")
    if (savedTrainers.length === 0) {
      // Initialize with sample data
      const sampleTrainers: Trainer[] = [
        {
          id: "1",
          name: "Sarah Wilson",
            email: "sarah@musclex.com",
          phone: "+1 234-567-8901",
          specializations: ["Yoga", "Pilates", "Meditation"],
          certifications: ["RYT-500", "Pilates Instructor"],
          experience: "5 years",
          status: "active",
          rating: 4.8,
          hourlyRate: 75,
          bio: "Certified yoga instructor with 5+ years of experience in Hatha and Vinyasa yoga.",
          joinDate: "2023-01-15",
        },
        {
          id: "2",
          name: "Mike Johnson",
            email: "mike@musclex.com",
          phone: "+1 234-567-8902",
          specializations: ["HIIT", "Strength Training", "CrossFit"],
          certifications: ["NASM-CPT", "CrossFit Level 2"],
          experience: "8 years",
          status: "active",
          rating: 4.9,
          hourlyRate: 85,
          bio: "Former competitive athlete specializing in high-intensity training and strength building.",
          joinDate: "2022-08-20",
        },
        {
          id: "3",
          name: "Emma Garcia",
            email: "emma@musclex.com",
          phone: "+1 234-567-8903",
          specializations: ["Zumba", "Dance Fitness", "Cardio"],
          certifications: ["Zumba Instructor", "Group Fitness"],
          experience: "3 years",
          status: "active",
          rating: 4.7,
          hourlyRate: 65,
          bio: "Energetic dance fitness instructor who makes workouts fun and engaging.",
          joinDate: "2023-03-10",
        },
      ]
      setTrainers(sampleTrainers)
      localStorage.setItem("gym_trainers", JSON.stringify(sampleTrainers))
    } else {
      setTrainers(savedTrainers)
    }
  }, [])

  const filteredTrainers = trainers.filter((trainer) => {
    const matchesSearch =
      trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.specializations.some((spec) => spec.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = filterStatus === "all" || trainer.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const handleAddTrainer = (newTrainer: Omit<Trainer, "id">) => {
    const trainer: Trainer = {
      ...newTrainer,
      id: Date.now().toString(),
    }
    const updatedTrainers = [...trainers, trainer]
    setTrainers(updatedTrainers)
    localStorage.setItem("gym_trainers", JSON.stringify(updatedTrainers))
    setShowAddModal(false)
  }

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Specializations", "Experience", "Rating", "Status"]
    const csvContent = [
      headers.join(","),
      ...filteredTrainers.map((trainer) =>
        [
          trainer.name,
          trainer.email,
          trainer.phone,
          trainer.specializations.join(";"),
          trainer.experience,
          trainer.rating,
          trainer.status,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "trainers.csv"
    a.click()
  }

  const columns = [
    {
      header: "Trainer",
      accessorKey: "name",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-purple-600 font-medium">{row.original.name.charAt(0)}</span>
          </div>
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-sm text-gray-500">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Specializations",
      accessorKey: "specializations",
      cell: ({ row }: any) => (
        <div className="flex flex-wrap gap-1">
          {row.original.specializations.slice(0, 2).map((spec: string) => (
            <Badge key={spec} variant="outline" className="text-xs">
              {spec}
            </Badge>
          ))}
          {row.original.specializations.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{row.original.specializations.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: "Experience",
      accessorKey: "experience",
    },
    {
      header: "Rating",
      accessorKey: "rating",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="font-medium">{row.original.rating}</span>
        </div>
      ),
    },
    {
      header: "Rate",
      accessorKey: "hourlyRate",
      cell: ({ row }: any) => `$${row.original.hourlyRate}/hr`,
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
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Calendar className="h-4 w-4" />
          </Button>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trainers</h1>
          <p className="text-gray-600">Manage your gym trainers and their schedules</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Trainer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Trainers</p>
                <p className="text-2xl font-bold text-gray-900">{trainers.length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-100 text-purple-600">
                <Star className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Trainers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trainers.filter((t) => t.status === "active").length}
                </p>
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
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trainers.length > 0
                    ? (trainers.reduce((sum, t) => sum + t.rating, 0) / trainers.length).toFixed(1)
                    : "0"}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-yellow-100 text-yellow-600">
                <Star className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Specializations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(trainers.flatMap((t) => t.specializations)).size}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                <Star className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search trainers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button variant="outline" onClick={exportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trainers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Trainers ({filteredTrainers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredTrainers} searchKey="name" />
        </CardContent>
      </Card>

      <AddTrainerModal open={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddTrainer} />
    </div>
  )
}
