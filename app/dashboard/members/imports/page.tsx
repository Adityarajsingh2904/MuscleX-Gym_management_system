"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useGymContext } from "@/lib/gym-context"
import { getMemberImports } from "@/lib/supabase-queries"
import { DataTable } from "@/components/ui/data-table"
import { FileText, CheckCircle, XCircle, Clock, Loader2, Eye, RefreshCw } from "lucide-react"

interface MemberImport {
  id: string
  file_name: string
  status: "pending" | "processing" | "completed" | "failed"
  total_rows: number
  processed_rows: number
  success_count: number
  error_count: number
  logs: string[]
  created_at: string
  completed_at?: string
}

export default function MemberImportsPage() {
  const { currentSubaccountId } = useGymContext()
  const { toast } = useToast()
  const [imports, setImports] = useState<MemberImport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImport, setSelectedImport] = useState<MemberImport | null>(null)
  const [showLogs, setShowLogs] = useState(false)

  useEffect(() => {
    if (currentSubaccountId) {
      loadImports()
    }
  }, [currentSubaccountId])

  const loadImports = async () => {
    try {
      setIsLoading(true)
      const data = await getMemberImports(currentSubaccountId!)
      setImports(data || [])
    } catch (error) {
      console.error("Error loading imports:", error)
      toast({
        title: "Error",
        description: "Failed to load import history",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-50 text-green-700 border-green-200",
      failed: "bg-red-50 text-red-700 border-red-200",
      processing: "bg-blue-50 text-blue-700 border-blue-200",
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    }

    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants]}>
        {status}
      </Badge>
    )
  }

  const columns = [
    {
      header: "File",
      accessorKey: "file_name",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{row.original.file_name}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(row.original.status)}
          {getStatusBadge(row.original.status)}
        </div>
      ),
    },
    {
      header: "Progress",
      accessorKey: "progress",
      cell: ({ row }: any) => {
        const { total_rows, processed_rows } = row.original
        const percentage = total_rows > 0 ? Math.round((processed_rows / total_rows) * 100) : 0
        return (
          <div className="text-sm">
            <div className="flex justify-between mb-1">
              <span>
                {processed_rows} / {total_rows}
              </span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      },
    },
    {
      header: "Results",
      accessorKey: "results",
      cell: ({ row }: any) => (
        <div className="text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>{row.original.success_count}</span>
            </div>
            <div className="flex items-center space-x-1">
              <XCircle className="h-3 w-3 text-red-600" />
              <span>{row.original.error_count}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Date",
      accessorKey: "created_at",
      cell: ({ row }: any) => (
        <div className="text-sm text-gray-600">{new Date(row.original.created_at).toLocaleDateString()}</div>
      ),
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedImport(row.original)
              setShowLogs(true)
            }}
            disabled={!row.original.logs || row.original.logs.length === 0}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Import History</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Import History</h1>
        <Button onClick={loadImports} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Imports</p>
                <p className="text-2xl font-bold text-gray-900">{imports.length}</p>
              </div>
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {imports.filter((imp) => imp.status === "completed").length}
                </p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-gray-900">
                  {imports.filter((imp) => imp.status === "processing").length}
                </p>
              </div>
              <Loader2 className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {imports.filter((imp) => imp.status === "failed").length}
                </p>
              </div>
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Imports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
        </CardHeader>
        <CardContent>
          {imports.length > 0 ? (
            <DataTable columns={columns} data={imports} searchKey="file_name" />
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No imports yet</h3>
              <p className="text-gray-500">Start by importing your first member list</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs Modal */}
      {showLogs && selectedImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-medium">Import Logs</h3>
              <p className="text-sm text-gray-600">{selectedImport.file_name}</p>
            </div>
            <div className="p-6 overflow-y-auto max-h-96">
              {selectedImport.logs && selectedImport.logs.length > 0 ? (
                <div className="space-y-2">
                  {selectedImport.logs.map((log, index) => (
                    <div key={index} className="text-sm font-mono bg-gray-50 p-2 rounded">
                      {log}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No logs available</p>
              )}
            </div>
            <div className="p-6 border-t flex justify-end">
              <Button onClick={() => setShowLogs(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
