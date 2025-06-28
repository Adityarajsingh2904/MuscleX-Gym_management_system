"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calculator, Receipt, RotateCcw, Settings, Printer, FileText } from "lucide-react"

export function QuickActionsCard() {
  const quickActions = [
    {
      icon: Calculator,
      label: "Calculator",
      action: () => {
        // Open calculator
        console.log("Opening calculator...")
      },
    },
    {
      icon: Receipt,
      label: "Last Receipt",
      action: () => {
        // Print last receipt
        console.log("Printing last receipt...")
      },
    },
    {
      icon: RotateCcw,
      label: "Return/Refund",
      action: () => {
        // Open return modal
        console.log("Opening return modal...")
      },
    },
    {
      icon: FileText,
      label: "Daily Report",
      action: () => {
        // Generate daily report
        console.log("Generating daily report...")
      },
    },
    {
      icon: Printer,
      label: "Print Test",
      action: () => {
        // Test printer
        console.log("Testing printer...")
      },
    },
    {
      icon: Settings,
      label: "POS Settings",
      action: () => {
        // Open POS settings
        console.log("Opening POS settings...")
      },
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-2 text-xs"
              onClick={action.action}
            >
              <action.icon className="h-5 w-5" />
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
