"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, XCircle, CreditCard, QrCode, Fingerprint, User, Download, Clock } from "lucide-react"
import type { AccessLog } from "@/types/gym"

interface AccessLogsCardProps {
  logs: AccessLog[]
}

export function AccessLogsCard({ logs }: AccessLogsCardProps) {
  const getMethodIcon = (method: string) => {
    switch (method) {
      case "rfid":
        return <CreditCard className="h-4 w-4" />
      case "qr":
        return <QrCode className="h-4 w-4" />
      case "biometric":
        return <Fingerprint className="h-4 w-4" />
      case "manual":
        return <User className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    return status === "granted" ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const exportLogs = () => {
    const csvContent = [
      ["Timestamp", "Member", "Area", "Action", "Method", "Status", "Rule", "Reason"].join(","),
      ...logs.map((log) =>
        [
          log.timestamp,
          log.memberName,
          log.area,
          log.action,
          log.method,
          log.status,
          log.ruleApplied || "",
          log.reason || "",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `access-logs-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Access Logs</span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No access logs available</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
                  <AvatarFallback>
                    {log.memberName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">{log.memberName}</p>
                    <Badge variant="outline" className="text-xs">
                      {log.action}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-gray-500">{log.area}</span>
                    <div className="flex items-center space-x-1 text-gray-400">
                      {getMethodIcon(log.method)}
                      <span className="text-xs capitalize">{log.method}</span>
                    </div>
                  </div>
                  {log.reason && <p className="text-xs text-red-600 mt-1">{log.reason}</p>}
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(log.status)}
                      <span
                        className={`text-sm font-medium ${
                          log.status === "granted" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{formatTime(log.timestamp)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
