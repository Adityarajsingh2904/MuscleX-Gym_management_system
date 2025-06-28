"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Package } from "lucide-react"
import type { Plan } from "@/types/database"
import { getCurrencySymbol } from "@/lib/currency"

interface PlanCardProps {
  plan: Plan
  onEdit: (plan: Plan) => void
  onDelete: (planId: string) => void
}

export function PlanCard({ plan, onEdit, onDelete }: PlanCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <Badge
                variant={plan.is_active ? "default" : "secondary"}
                className={plan.is_active ? "bg-green-100 text-green-800" : ""}
              >
                {plan.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(plan)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(plan.id)} className="text-red-600">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-green-600">{getCurrencySymbol()}{plan.price}</div>
            <div className="text-sm text-gray-500">{plan.duration} days</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Duration</div>
            <div className="font-medium">{plan.duration} days</div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Created</span>
            <span>{new Date(plan.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
