"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Receipt, Eye, Download, CreditCard, DollarSign } from "lucide-react"
import type { Sale } from "@/types/gym"

interface SalesHistoryCardProps {
  sales: Sale[]
}

export function SalesHistoryCard({ sales }: SalesHistoryCardProps) {
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <DollarSign className="h-4 w-4" />
      case "card":
        return <CreditCard className="h-4 w-4" />
      default:
        return <Receipt className="h-4 w-4" />
    }
  }

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "cash":
        return "bg-green-100 text-green-800"
      case "card":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Receipt className="mr-2 h-5 w-5" />
            Recent Sales
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Receipt className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No sales recorded yet</p>
            <p className="text-sm">Sales will appear here once you complete transactions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium">Sale #{sale.id}</span>
                    <Badge className={getPaymentMethodColor(sale.paymentMethod)} variant="secondary">
                      <span className="flex items-center gap-1">
                        {getPaymentMethodIcon(sale.paymentMethod)}
                        {sale.paymentMethod}
                      </span>
                    </Badge>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      {sale.items.length} item{sale.items.length !== 1 ? "s" : ""} • Cashier: {sale.cashier}
                    </p>
                    <p>{new Date(sale.timestamp).toLocaleString()}</p>
                    {sale.customerInfo?.name && <p>Customer: {sale.customerInfo.name}</p>}
                  </div>

                  <div className="mt-2">
                    <div className="text-xs text-gray-500 space-y-1">
                      {sale.items.slice(0, 2).map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span>
                            {item.quantity}x {item.productName}
                          </span>
                          <span>${item.total.toFixed(2)}</span>
                        </div>
                      ))}
                      {sale.items.length > 2 && <p className="text-gray-400">+{sale.items.length - 2} more items</p>}
                    </div>
                  </div>
                </div>

                <div className="text-right ml-4">
                  <p className="text-lg font-bold text-gray-900">${sale.total.toFixed(2)}</p>
                  <Button variant="ghost" size="sm" className="mt-2">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
