"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode, Smartphone, Fingerprint, Clock, UserCheck } from "lucide-react"
import type { Member } from "@/types/gym"

interface QuickCheckInCardProps {
  onCheckIn: (memberName: string, method: string) => void
  members: Member[]
  searchTerm: string
  onSearchChange: (term: string) => void
  selectedMethod: string
  onMethodChange: (method: string) => void
}

export function QuickCheckInCard({
  onCheckIn,
  members,
  searchTerm,
  onSearchChange,
  selectedMethod,
  onMethodChange,
}: QuickCheckInCardProps) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  const methods = [
    { id: "manual", label: "Manual", icon: Clock },
    { id: "qr", label: "QR Code", icon: QrCode },
    { id: "rfid", label: "RFID", icon: Smartphone },
    { id: "biometric", label: "Biometric", icon: Fingerprint },
  ]

  const handleCheckIn = () => {
    if (selectedMember) {
      onCheckIn(selectedMember.name, selectedMethod)
      setSelectedMember(null)
      onSearchChange("")
    }
  }

  const filteredMembers = members.filter((member) => member.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserCheck className="h-5 w-5" />
          <span>Quick Check-in</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Member Search */}
        <div>
          <Input placeholder="Search member..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} />
          {searchTerm && filteredMembers.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
              {filteredMembers.slice(0, 5).map((member) => (
                <button
                  key={member.id}
                  onClick={() => {
                    setSelectedMember(member)
                    onSearchChange(member.name)
                  }}
                  className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div className="font-medium">{member.name}</div>
                  <div className="text-sm text-gray-500">{member.package}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Member */}
        {selectedMember && (
          <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
            <div className="font-medium text-teal-800">{selectedMember.name}</div>
            <div className="text-sm text-teal-600">{selectedMember.package} Member</div>
          </div>
        )}

        {/* Check-in Methods */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Check-in Method</label>
          <div className="grid grid-cols-2 gap-2">
            {methods.map((method) => (
              <button
                key={method.id}
                onClick={() => onMethodChange(method.id)}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  selectedMethod === method.id ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <method.icon className="h-5 w-5 mx-auto mb-1" />
                <span className="text-xs font-medium">{method.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Check-in Button */}
        <Button onClick={handleCheckIn} disabled={!selectedMember} className="w-full bg-teal-600 hover:bg-teal-700">
          <UserCheck className="mr-2 h-4 w-4" />
          Check In
        </Button>
      </CardContent>
    </Card>
  )
}
