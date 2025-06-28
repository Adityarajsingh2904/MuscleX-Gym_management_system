"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Send } from "lucide-react"
import type { Payment } from "@/types/gym"

interface OverduePaymentsCardProps {
  overduePayments: Payment[]
}

export function OverduePaymentsCard({ overduePayments }: OverduePaymentsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <span>Overdue Payments</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {overduePayments.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No overdue payments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {overduePayments.slice(0, 5).map((payment) => (
              <div key={payment.id} className="p-3 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{payment.memberName}</span>
                  <Badge className="bg-red-100 text-red-800 text-xs">${payment.amount}</Badge>
                </div>
                <div className="text-xs text-gray-600 mb-2">Due: {new Date(payment.dueDate).toLocaleDateString()}</div>
                <Button size="sm" variant="outline" className="w-full text-xs">
                  <Send className="h-3 w-3 mr-1" />
                  Send Reminder
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
