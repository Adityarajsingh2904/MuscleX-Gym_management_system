"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Mail, Users, DollarSign, Clock, Edit, Eye, Trash2, User } from "lucide-react"
import type { Franchise } from "@/types/franchise"

interface FranchiseCardProps {
  franchise: Franchise
}

export function FranchiseCard({ franchise }: FranchiseCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">{franchise.name.charAt(0)}</span>
            </div>
            <div>
              <CardTitle className="text-lg">{franchise.name}</CardTitle>
              <Badge className={getStatusColor(franchise.status)}>{franchise.status}</Badge>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Location Info */}
        <div className="space-y-2">
          <div className="flex items-start space-x-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{franchise.address}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{franchise.phone}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Mail className="h-4 w-4" />
            <span>{franchise.email}</span>
          </div>
        </div>

        {/* Manager Info */}
        <div className="flex items-center space-x-2 text-sm">
          <User className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">Manager:</span>
          {franchise.managerName ? (
            <span className="font-medium">{franchise.managerName}</span>
          ) : (
            <Badge variant="outline" className="text-orange-600">
              Not Assigned
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-purple-100">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Members</p>
              <p className="font-semibold">{franchise.memberCount}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-teal-100">
              <DollarSign className="h-4 w-4 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="font-semibold">${franchise.revenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="pt-2 border-t">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            <Clock className="h-4 w-4" />
            <span>Today's Hours</span>
          </div>
          <div className="text-sm">
            {(() => {
              const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
              const todayKey = dayNames[new Date().getDay()]
              const hours =
                franchise.settings.operatingHours[todayKey as keyof typeof franchise.settings.operatingHours]
              return (
                <span className="font-medium">
                  {hours?.start || "9:00 AM"} - {hours?.end || "9:00 PM"}
                </span>
              )
            })()}
          </div>
        </div>

        {/* Amenities */}
        {franchise.settings.amenities.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600 mb-2">Amenities</p>
            <div className="flex flex-wrap gap-1">
              {franchise.settings.amenities.slice(0, 3).map((amenity) => (
                <Badge key={amenity} variant="outline" className="text-xs">
                  {amenity}
                </Badge>
              ))}
              {franchise.settings.amenities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{franchise.settings.amenities.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
