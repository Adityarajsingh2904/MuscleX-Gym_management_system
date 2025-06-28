"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Package, Crown, Zap, Shield, Users, MoreVertical, Edit, Trash2, Star, Check, X } from "lucide-react"
import type { MembershipPackage } from "@/types/gym"
import { formatCurrency } from "@/lib/currency"

interface PackageCardProps {
  package: MembershipPackage
  onEdit: () => void
  onDelete: () => void
}

export function PackageCard({ package: pkg, onEdit, onDelete }: PackageCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "crown":
        return Crown
      case "zap":
        return Zap
      case "shield":
        return Shield
      default:
        return Package
    }
  }

  const IconComponent = getIcon(pkg.icon)

  const getColorClasses = (color: string) => {
    switch (color) {
      case "purple":
        return {
          bg: "bg-purple-100",
          text: "text-purple-600",
          border: "border-purple-200",
          accent: "bg-purple-600",
        }
      case "green":
        return {
          bg: "bg-green-100",
          text: "text-green-600",
          border: "border-green-200",
          accent: "bg-green-600",
        }
      case "orange":
        return {
          bg: "bg-orange-100",
          text: "text-orange-600",
          border: "border-orange-200",
          accent: "bg-orange-600",
        }
      case "red":
        return {
          bg: "bg-red-100",
          text: "text-red-600",
          border: "border-red-200",
          accent: "bg-red-600",
        }
      case "gold":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-600",
          border: "border-yellow-200",
          accent: "bg-yellow-600",
        }
      default:
        return {
          bg: "bg-blue-100",
          text: "text-blue-600",
          border: "border-blue-200",
          accent: "bg-blue-600",
        }
    }
  }

  const colorClasses = getColorClasses(pkg.color)

  return (
    <Card
      className={`relative transition-all duration-200 hover:shadow-lg ${pkg.popular ? `border-2 ${colorClasses.border}` : ""}`}
    >
      {pkg.popular && (
        <div
          className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${colorClasses.accent} text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1`}
        >
          <Star className="h-3 w-3 fill-current" />
          <span>Most Popular</span>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl ${colorClasses.bg} ${colorClasses.text}`}>
              <IconComponent className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
              <p className="text-sm text-gray-600">{pkg.description}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Package
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Package
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold text-gray-900">{formatCurrency(pkg.price)}</span>
              <span className="text-gray-500">
                /{pkg.duration} {pkg.durationType}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge
              variant={pkg.status === "active" ? "default" : "secondary"}
              className={pkg.status === "active" ? "bg-green-100 text-green-800" : ""}
            >
              {pkg.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Member Count */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Active Members</span>
          </div>
          <span className="text-lg font-bold text-gray-900">{pkg.memberCount}</span>
        </div>

        {/* Features Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Features</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)} className="text-xs">
              {showDetails ? "Show Less" : `View All (${pkg.features.length})`}
            </Button>
          </div>

          <div className="space-y-1">
            {(showDetails ? pkg.features : pkg.features.slice(0, 3)).map((feature, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">{feature}</span>
              </div>
            ))}

            {!showDetails && pkg.features.length > 3 && (
              <div className="text-xs text-gray-400 pl-5">+{pkg.features.length - 3} more features</div>
            )}
          </div>
        </div>

        {/* Limitations */}
        {showDetails && pkg.limitations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Limitations</h4>
            <div className="space-y-1">
              {pkg.limitations.map((limitation, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <X className="h-3 w-3 text-red-500 flex-shrink-0" />
                  <span className="text-gray-600">{limitation}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4">
        <div className="w-full space-y-2">
          <Button className={`w-full ${colorClasses.accent} hover:opacity-90`}>Select Package</Button>
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              Per {pkg.durationType.slice(0, -1)}: {formatCurrency(pkg.price / pkg.duration)}
            </span>
            <span>Renewal: Auto</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
