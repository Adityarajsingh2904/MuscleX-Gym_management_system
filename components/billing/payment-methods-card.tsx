"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Banknote, Smartphone, DollarSign } from "lucide-react"

export function PaymentMethodsCard() {
  const methods = [
    {
      name: "Credit/Debit Cards",
      icon: CreditCard,
      percentage: 65,
      color: "bg-blue-500",
    },
    {
      name: "Bank Transfer",
      icon: DollarSign,
      percentage: 20,
      color: "bg-green-500",
    },
    {
      name: "Cash",
      icon: Banknote,
      percentage: 10,
      color: "bg-orange-500",
    },
    {
      name: "Digital Wallet",
      icon: Smartphone,
      percentage: 5,
      color: "bg-purple-500",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {methods.map((method) => (
            <div key={method.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  <method.icon className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-sm font-medium">{method.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${method.color}`} style={{ width: `${method.percentage}%` }} />
                </div>
                <Badge variant="outline" className="text-xs">
                  {method.percentage}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
