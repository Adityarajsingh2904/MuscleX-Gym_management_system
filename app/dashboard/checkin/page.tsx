"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { UserCheck, Clock, Users, TrendingUp, Activity } from "lucide-react"
import { QuickCheckInCard } from "@/components/checkin/quick-checkin-card"
import { ActiveMembersCard } from "@/components/checkin/active-members-card"
import { CheckInMethodsCard } from "@/components/checkin/checkin-methods-card"
import { RecentCheckInsCard } from "@/components/checkin/recent-checkins-card"
import type { CheckIn, Member } from "@/types/gym"

export default function CheckInPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMethod, setSelectedMethod] = useState("manual")

  useEffect(() => {
    const savedCheckIns = JSON.parse(localStorage.getItem("gym_checkins") || "[]")
    const savedMembers = JSON.parse(localStorage.getItem("gym_members") || "[]")
    setCheckIns(savedCheckIns)
    setMembers(savedMembers)
  }, [])

  const handleQuickCheckIn = (memberName: string, method: string) => {
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
  }

  const handleCheckOut = (checkInId: string) => {
    const updatedCheckIns = checkIns.map((checkIn) =>
      checkIn.id === checkInId
        ? { ...checkIn, checkOutTime: new Date().toISOString(), status: "completed" as const }
        : checkIn,
    )
    setCheckIns(updatedCheckIns)
    localStorage.setItem("gym_checkins", JSON.stringify(updatedCheckIns))
  }

  const todayCheckIns = checkIns.filter((checkIn) =>
    checkIn.checkInTime.startsWith(new Date().toISOString().split("T")[0]),
  ).length

  const activeMembers = checkIns.filter((checkIn) => checkIn.status === "active").length
  const peakHour = "6-8 PM"
  const avgDuration = "85 min"

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Check-in System</h1>
          <p className="text-gray-600">Manage member check-ins and track gym usage</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-green-100 text-green-800 px-3 py-1">
            <Activity className="h-4 w-4 mr-1" />
            {activeMembers} Active Now
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Check-ins</p>
                <p className="text-2xl font-bold text-gray-900">{todayCheckIns}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm font-medium text-green-600">+12%</span>
                  <span className="text-sm text-gray-500 ml-1">vs yesterday</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-teal-100 text-teal-600">
                <UserCheck className="h-5 w-5" />
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
                <div className="flex items-center mt-2">
                  <Activity className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-sm text-gray-500">Live count</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Peak Hour</p>
                <p className="text-2xl font-bold text-gray-900">{peakHour}</p>
                <div className="flex items-center mt-2">
                  <Clock className="h-4 w-4 text-purple-500 mr-1" />
                  <span className="text-sm text-gray-500">Busiest time</span>
                </div>
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
                <p className="text-2xl font-bold text-gray-900">{avgDuration}</p>
                <div className="flex items-center mt-2">
                  <Clock className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="text-sm text-gray-500">Per session</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-orange-100 text-orange-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Check-in */}
        <div className="lg:col-span-1">
          <QuickCheckInCard
            onCheckIn={handleQuickCheckIn}
            members={filteredMembers}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedMethod={selectedMethod}
            onMethodChange={setSelectedMethod}
          />
        </div>

        {/* Check-in Methods */}
        <div className="lg:col-span-2">
          <CheckInMethodsCard />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Members */}
        <ActiveMembersCard activeCheckIns={checkIns.filter((c) => c.status === "active")} onCheckOut={handleCheckOut} />

        {/* Recent Check-ins */}
        <RecentCheckInsCard recentCheckIns={checkIns.slice(0, 10)} />
      </div>
    </div>
  )
}
