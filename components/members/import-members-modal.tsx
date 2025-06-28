"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { useGymContext } from "@/lib/gym-context"
import { Upload, FileText, CheckCircle, XCircle, Download, Loader2, ArrowRight, Calendar } from "lucide-react"
import { supabase, getPlans } from "@/lib/supabase-queries"
import { getCurrentUser } from "@/lib/supabase-queries"

interface ImportMembersModalProps {
  open: boolean
  onClose: () => void
  onImportCompleted: () => void
}

interface ColumnMapping {
  [key: string]: string
}

interface PreviewData {
  headers: string[]
  rows: any[][]
  allRows: any[][]
}

interface ImportJob {
  id: string
  status: "pending" | "processing" | "completed" | "failed"
  total_rows: number
  processed_rows: number
  success_count: number
  error_count: number
  logs: string[]
  created_at: string
  completed_at?: string
  file_name?: string
}

interface Plan {
  id: string
  name: string
  duration_days: number
  price: number
}

interface DateFormat {
  value: string
  label: string
  example: string
  regex: RegExp
}

const REQUIRED_FIELDS = ["name"]
const OPTIONAL_FIELDS = [
  "email",
  "phone",
  "gender",
  "dob",
  "join_date",
  "is_active",
  "active_plan",
  "last_payment",
  "next_payment",
]
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]

const DATE_FORMATS: DateFormat[] = [
  {
    value: "dd/mm/yyyy",
    label: "DD/MM/YYYY",
    example: "25/12/2024",
    regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
  },
  {
    value: "dd/mm/yy",
    label: "DD/MM/YY",
    example: "25/12/24",
    regex: /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/,
  },
  {
    value: "mm/dd/yyyy",
    label: "MM/DD/YYYY",
    example: "12/25/2024",
    regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
  },
  {
    value: "mm/dd/yy",
    label: "MM/DD/YY",
    example: "12/25/24",
    regex: /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/,
  },
  {
    value: "yyyy/mm/dd",
    label: "YYYY/MM/DD",
    example: "2024/12/25",
    regex: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
  },
  {
    value: "yyyy/dd/mm",
    label: "YYYY/DD/MM",
    example: "2024/25/12",
    regex: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
  },
  {
    value: "dd-mm-yyyy",
    label: "DD-MM-YYYY",
    example: "25-12-2024",
    regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
  },
  {
    value: "dd-mm-yy",
    label: "DD-MM-YY",
    example: "25-12-24",
    regex: /^(\d{1,2})-(\d{1,2})-(\d{2})$/,
  },
  {
    value: "mm-dd-yyyy",
    label: "MM-DD-YYYY",
    example: "12-25-2024",
    regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
  },
  {
    value: "mm-dd-yy",
    label: "MM-DD-YY",
    example: "12-25-24",
    regex: /^(\d{1,2})-(\d{1,2})-(\d{2})$/,
  },
  {
    value: "yyyy-mm-dd",
    label: "YYYY-MM-DD",
    example: "2024-12-25",
    regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
  },
  {
    value: "yyyy-dd-mm",
    label: "YYYY-DD-MM",
    example: "2024-25-12",
    regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
  },
]

export function ImportMembersModal({ open, onClose, onImportCompleted }: ImportMembersModalProps) {
  const { currentSubaccountId } = useGymContext()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [step, setStep] = useState<"upload" | "preview" | "mapping" | "dateformat" | "importing">("upload")
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [selectedDateFormat, setSelectedDateFormat] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [importJob, setImportJob] = useState<ImportJob | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])

  // Load plans for mapping reference
  useEffect(() => {
    if (currentSubaccountId && open) {
      loadPlans()
    }
  }, [currentSubaccountId, open])

  const loadPlans = async () => {
    try {
      const plansData = await getPlans(currentSubaccountId!)
      setPlans(plansData || [])
    } catch (error) {
      console.error("Error loading plans:", error)
    }
  }

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  // Poll for import job status updates
  useEffect(() => {
    if (importJob?.id && importJob.status !== "completed" && importJob.status !== "failed") {
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const { data, error } = await supabase.from("member_imports").select("*").eq("id", importJob.id).single()

          if (error) {
            console.error("Error polling import job:", error)
            return
          }

          if (data) {
            setImportJob({
              id: data.id,
              status: data.status,
              total_rows: data.total_rows || 0,
              processed_rows: data.processed_rows || 0,
              success_count: data.success_count || 0,
              error_count: data.error_count || 0,
              logs: data.logs || [],
              created_at: data.created_at,
              completed_at: data.completed_at,
              file_name: data.file_name,
            })

            // If the job is complete, stop polling and notify
            if (data.status === "completed" || data.status === "failed") {
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
              }

              if (data.status === "completed") {
                toast({
                  title: "Import completed",
                  description: `Successfully imported ${data.success_count} members. ${data.error_count} errors.`,
                })
                onImportCompleted()
              } else if (data.status === "failed") {
                toast({
                  title: "Import failed",
                  description: "Please check the logs for details",
                  variant: "destructive",
                })
              }
            }
          }
        } catch (error) {
          console.error("Error polling import job:", error)
        }
      }, 2000) // Poll every 2 seconds
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [importJob?.id, importJob?.status, onImportCompleted, toast])

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      if (!selectedFile) return

      const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase()
      if (!["csv"].includes(fileExtension || "")) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file",
          variant: "destructive",
        })
        return
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)
      setIsProcessing(true)

      try {
        // Parse file for preview
        const text = await selectedFile.text()
        const lines = text.split("\n").filter((line) => line.trim())

        if (lines.length < 2) {
          toast({
            title: "Invalid file",
            description: "File must contain at least a header row and one data row",
            variant: "destructive",
          })
          return
        }

        const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
        const allRows = []
        const previewRows = []

        // Parse all rows - IMPROVED CSV PARSING
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue // Skip empty lines

          // Better CSV parsing - handle quoted values and commas within quotes
          const values = []
          let current = ""
          let inQuotes = false

          for (let j = 0; j < line.length; j++) {
            const char = line[j]
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === "," && !inQuotes) {
              values.push(current.trim().replace(/^"|"$/g, ""))
              current = ""
            } else {
              current += char
            }
          }
          values.push(current.trim().replace(/^"|"$/g, "")) // Add the last value

          allRows.push(values)

          // Only add first 10 rows to preview
          if (i <= 10) {
            previewRows.push(values)
          }
        }

        setPreviewData({ headers, rows: previewRows, allRows })

        // Auto-map columns based on common names
        const autoMapping: ColumnMapping = {}
        headers.forEach((header, index) => {
          const lowerHeader = header.toLowerCase().trim()
          if (lowerHeader.includes("name") || lowerHeader === "member name" || lowerHeader === "full name") {
            autoMapping[index.toString()] = "name"
          } else if (lowerHeader.includes("email")) {
            autoMapping[index.toString()] = "email"
          } else if (lowerHeader.includes("phone") || lowerHeader.includes("mobile")) {
            autoMapping[index.toString()] = "phone"
          } else if (lowerHeader.includes("gender") || lowerHeader.includes("sex")) {
            autoMapping[index.toString()] = "gender"
          } else if (
            lowerHeader.includes("birth") ||
            lowerHeader.includes("dob") ||
            lowerHeader.includes("date of birth")
          ) {
            autoMapping[index.toString()] = "dob"
          } else if (
            lowerHeader.includes("join") ||
            lowerHeader.includes("start") ||
            lowerHeader.includes("registration")
          ) {
            autoMapping[index.toString()] = "join_date"
          } else if (lowerHeader.includes("active") || lowerHeader.includes("status")) {
            autoMapping[index.toString()] = "is_active"
          } else if (
            lowerHeader.includes("plan") ||
            lowerHeader.includes("membership") ||
            lowerHeader.includes("package")
          ) {
            autoMapping[index.toString()] = "active_plan"
          } else if (lowerHeader.includes("last payment") || lowerHeader.includes("last_payment")) {
            autoMapping[index.toString()] = "last_payment"
          } else if (
            lowerHeader.includes("next payment") ||
            lowerHeader.includes("next_payment") ||
            lowerHeader.includes("due date")
          ) {
            autoMapping[index.toString()] = "next_payment"
          }
        })

        setColumnMapping(autoMapping)
        setStep("preview")
      } catch (error) {
        console.error("Error parsing file:", error)
        toast({
          title: "Error parsing file",
          description: "Please check your file format and try again",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
    },
    [toast],
  )

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const droppedFile = event.dataTransfer.files[0]
      if (droppedFile) {
        handleFileSelect(droppedFile)
      }
    },
    [handleFileSelect],
  )

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
  }, [])

  const validateMapping = () => {
    const mappedFields = Object.values(columnMapping)
    const hasRequiredFields = REQUIRED_FIELDS.every((field) => mappedFields.includes(field))

    if (!hasRequiredFields) {
      toast({
        title: "Missing required fields",
        description: "Please map the 'name' field",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  // Check if any date fields are mapped
  const hasDateFields = () => {
    const mappedFields = Object.values(columnMapping)
    const dateFields = ["dob", "join_date", "last_payment", "next_payment"]
    return dateFields.some((field) => mappedFields.includes(field))
  }

  // Get sample date values from the preview data
  const getSampleDates = () => {
    if (!previewData) return []

    const dateFields = ["dob", "join_date", "last_payment", "next_payment"]
    const samples: string[] = []

    Object.entries(columnMapping).forEach(([columnIndex, fieldName]) => {
      if (dateFields.includes(fieldName)) {
        const sampleValue = previewData.rows[0]?.[Number.parseInt(columnIndex)]
        if (sampleValue && String(sampleValue).trim()) {
          samples.push(String(sampleValue).trim())
        }
      }
    })

    return [...new Set(samples)] // Remove duplicates
  }

  // Helper function to find plan by name
  const findPlanByName = (planName: string): string | null => {
    if (!planName || !plans.length) return null

    const normalizedPlanName = planName.toLowerCase().trim()
    const matchedPlan = plans.find(
      (plan) =>
        plan.name.toLowerCase().trim() === normalizedPlanName ||
        plan.name.toLowerCase().includes(normalizedPlanName) ||
        normalizedPlanName.includes(plan.name.toLowerCase()),
    )

    return matchedPlan ? matchedPlan.id : null
  }

  // Parse date according to selected format
  const parseDate = (dateString: string, format: string): string | null => {
    if (!dateString || !dateString.trim()) return null

    const trimmedDate = dateString.trim()
    const formatConfig = DATE_FORMATS.find((f) => f.value === format)

    if (!formatConfig) return null

    const match = trimmedDate.match(formatConfig.regex)
    if (!match) return null

    let day: number, month: number, year: number

    switch (format) {
      case "dd/mm/yyyy":
      case "dd-mm-yyyy":
        day = Number.parseInt(match[1])
        month = Number.parseInt(match[2])
        year = Number.parseInt(match[3])
        break
      case "dd/mm/yy":
      case "dd-mm-yy":
        day = Number.parseInt(match[1])
        month = Number.parseInt(match[2])
        year = Number.parseInt(match[3]) + (Number.parseInt(match[3]) > 50 ? 1900 : 2000) // Assume 50+ is 1900s, else 2000s
        break
      case "mm/dd/yyyy":
      case "mm-dd-yyyy":
        month = Number.parseInt(match[1])
        day = Number.parseInt(match[2])
        year = Number.parseInt(match[3])
        break
      case "mm/dd/yy":
      case "mm-dd-yy":
        month = Number.parseInt(match[1])
        day = Number.parseInt(match[2])
        year = Number.parseInt(match[3]) + (Number.parseInt(match[3]) > 50 ? 1900 : 2000)
        break
      case "yyyy/mm/dd":
      case "yyyy-mm-dd":
        year = Number.parseInt(match[1])
        month = Number.parseInt(match[2])
        day = Number.parseInt(match[3])
        break
      case "yyyy/dd/mm":
      case "yyyy-dd-mm":
        year = Number.parseInt(match[1])
        day = Number.parseInt(match[2])
        month = Number.parseInt(match[3])
        break
      default:
        return null
    }

    // Validate date components
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) {
      return null
    }

    // Create date and validate it's real (handles leap years, etc.)
    const date = new Date(year, month - 1, day)
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null
    }

    // Return in yyyy-mm-dd format
    return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
  }

  // Process the import data directly in the frontend
  const processImportData = async (
    importId: string,
    allRows: any[][],
    mapping: ColumnMapping,
    subaccountId: string,
    dateFormat: string,
  ) => {
    try {
      // Update status to processing
      await supabase.from("member_imports").update({ status: "processing" }).eq("id", importId)

      const totalRows = allRows.length
      let processedRows = 0
      let successCount = 0
      let errorCount = 0
      const logs: string[] = []

      logs.push(`Using date format: ${dateFormat}`)

      // Process rows in smaller batches for better progress tracking
      const batchSize = 3 // Reduced from 5 to 3
      for (let i = 0; i < totalRows; i += batchSize) {
        const endIndex = Math.min(i + batchSize, totalRows)
        const batch = allRows.slice(i, endIndex)

        for (let j = 0; j < batch.length; j++) {
          const rowIndex = i + j
          const row = batch[j]

          // Add row number to logs for better debugging
          logs.push(`--- Processing Row ${rowIndex + 1} ---`)

          try {
            const memberData: any = {
              subaccount_id: subaccountId,
              is_active: true, // Default value
              join_date: new Date().toISOString().split("T")[0], // Default to today
            }

            // Map the row data to member fields - IMPROVED LOGIC
            Object.entries(mapping).forEach(([columnIndex, fieldName]) => {
              if (fieldName && fieldName !== "skip") {
                const colIndex = Number.parseInt(columnIndex)
                const value = row[colIndex]

                if (value !== undefined && value !== null && String(value).trim() !== "") {
                  const trimmedValue = String(value).trim()

                  if (fieldName === "is_active") {
                    // Convert various formats to boolean
                    const lowerValue = trimmedValue.toLowerCase()
                    memberData[fieldName] =
                      lowerValue === "true" || lowerValue === "1" || lowerValue === "yes" || lowerValue === "active"
                  } else if (
                    fieldName === "dob" ||
                    fieldName === "join_date" ||
                    fieldName === "last_payment" ||
                    fieldName === "next_payment"
                  ) {
                    // Handle date fields with selected format
                    const parsedDate = parseDate(trimmedValue, dateFormat)
                    if (parsedDate) {
                      memberData[fieldName] = parsedDate
                      logs.push(`Row ${rowIndex + 1}: ${fieldName} "${trimmedValue}" → ${parsedDate}`)
                    } else {
                      logs.push(
                        `Row ${rowIndex + 1}: Invalid date format for ${fieldName}: "${trimmedValue}" - field skipped`,
                      )
                    }
                  } else if (fieldName === "active_plan") {
                    // Handle plan mapping - try to find plan by name
                    const planId = findPlanByName(trimmedValue)
                    if (planId) {
                      memberData[fieldName] = planId
                      logs.push(`Row ${rowIndex + 1}: Plan "${trimmedValue}" mapped to ID: ${planId}`)
                    } else {
                      logs.push(`Row ${rowIndex + 1}: Plan not found: "${trimmedValue}". Skipping plan assignment.`)
                    }
                  } else {
                    memberData[fieldName] = trimmedValue
                  }
                } else {
                  // Log when a mapped field has no value
                  if (fieldName !== "skip") {
                    logs.push(`Row ${rowIndex + 1}: No value provided for ${fieldName}`)
                  }
                }
              }
            })

            // Add detailed logging for debugging
            logs.push(
              `Row ${rowIndex + 1}: Processing member data: ${JSON.stringify({
                name: memberData.name,
                next_payment: memberData.next_payment,
                last_payment: memberData.last_payment,
                active_plan: memberData.active_plan,
              })}`,
            )

            // Validate required fields
            if (!memberData.name || memberData.name.trim() === "") {
              throw new Error("Name is required")
            }

            // Create the member
            const { data, error } = await supabase.from("members").insert(memberData).select().single()
            if (error) throw error

            successCount++
            logs.push(`Row ${rowIndex + 1}: Member '${memberData.name}' imported successfully`)
          } catch (error) {
            errorCount++
            logs.push(`Row ${rowIndex + 1}: ${error instanceof Error ? error.message : "Unknown error"}`)
          }
        }

        processedRows = endIndex

        // Update progress more frequently - after every row instead of every batch
        if (processedRows % 2 === 0 || processedRows === totalRows) {
          await supabase
            .from("member_imports")
            .update({
              processed_rows: processedRows,
              success_count: successCount,
              error_count: errorCount,
              logs: logs.slice(-100), // Keep only last 100 log entries to avoid too much data
            })
            .eq("id", importId)
        }

        // Add a small delay to prevent overwhelming the database
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      // Mark as completed
      await supabase
        .from("member_imports")
        .update({
          status: "completed",
          processed_rows: processedRows,
          success_count: successCount,
          error_count: errorCount,
          logs: logs,
          completed_at: new Date().toISOString(),
        })
        .eq("id", importId)
    } catch (error) {
      console.error("Error in processing:", error)
      await supabase
        .from("member_imports")
        .update({
          status: "failed",
          logs: ["Processing failed due to an internal error"],
          completed_at: new Date().toISOString(),
        })
        .eq("id", importId)
    }
  }

  const startImport = async () => {
    if (!file || !currentSubaccountId || !validateMapping() || !previewData) return

    // Check if we need date format selection
    if (hasDateFields() && !selectedDateFormat) {
      setStep("dateformat")
      return
    }

    setIsProcessing(true)
    setStep("importing")

    try {
      // Get current user
      const user = await getCurrentUser()
      if (!user) {
        throw new Error("User not authenticated")
      }

      // 1. Upload the file to Supabase Storage
      const fileName = `${Date.now()}_${file.name}`
      const filePath = `${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("member-imports")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`)
      }

      // 2. Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage.from("member-imports").getPublicUrl(filePath)

      const fileUrl = publicUrlData.publicUrl

      // 3. Create an import job record in the database
      const importData = {
        subaccount_id: currentSubaccountId,
        uploaded_by: user.id,
        file_name: file.name,
        file_url: fileUrl,
        status: "pending",
        total_rows: previewData.allRows.length,
        column_mapping: columnMapping,
      }

      const { data: importJobData, error: importJobError } = await supabase
        .from("member_imports")
        .insert(importData)
        .select()
        .single()

      if (importJobError || !importJobData) {
        throw new Error("Failed to create import job")
      }

      // 4. Set the import job in state to start polling
      setImportJob({
        id: importJobData.id,
        status: importJobData.status,
        total_rows: importJobData.total_rows || 0,
        processed_rows: importJobData.processed_rows || 0,
        success_count: importJobData.success_count || 0,
        error_count: importJobData.error_count || 0,
        logs: importJobData.logs || [],
        created_at: importJobData.created_at,
        file_name: file.name,
      })

      // 5. Process the data locally
      toast({
        title: "Import started",
        description: "Your data is being processed. You can monitor the progress here.",
      })

      processImportData(
        importJobData.id,
        previewData.allRows,
        columnMapping,
        currentSubaccountId,
        selectedDateFormat || "yyyy-mm-dd",
      )
    } catch (error) {
      console.error("Import error:", error)
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const resetModal = () => {
    setStep("upload")
    setFile(null)
    setPreviewData(null)
    setColumnMapping({})
    setSelectedDateFormat("")
    setImportJob(null)
    setIsProcessing(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  const downloadTemplate = () => {
    const templateContent =
      "name,email,phone,gender,dob,join_date,is_active,active_plan,last_payment,next_payment\nJohn Doe,john@example.com,+1234567890,male,1990-01-15,2024-01-01,true,Monthly Plan,2024-01-01,2024-02-01\nJane Smith,jane@example.com,+1234567891,female,1985-05-20,2024-01-02,true,Yearly Plan,2024-01-02,2025-01-02"
    const blob = new Blob([templateContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "member_import_template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getFieldDisplayName = (fieldName: string) => {
    const displayNames: { [key: string]: string } = {
      name: "Name *",
      email: "Email",
      phone: "Phone",
      gender: "Gender",
      dob: "Date of Birth",
      join_date: "Join Date",
      is_active: "Active Status",
      active_plan: "Active Plan",
      last_payment: "Last Payment Date",
      next_payment: "Next Payment Date",
    }
    return displayNames[fieldName] || fieldName.replace("_", " ")
  }

  const getFieldDescription = (fieldName: string) => {
    const descriptions: { [key: string]: string } = {
      name: "Member's full name (required)",
      email: "Member's email address",
      phone: "Member's phone number",
      gender: "Member's gender (male/female/other)",
      dob: "Date of birth",
      join_date: "Date member joined",
      is_active: "Active status (true/false, yes/no, active/inactive)",
      active_plan: "Plan name (must match existing plan names)",
      last_payment: "Last payment date",
      next_payment: "Next payment due date",
    }
    return descriptions[fieldName] || ""
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Members
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">Upload a CSV file with member data to import in bulk.</p>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>

            {plans.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Available Plans for Mapping:</h4>
                <div className="flex flex-wrap gap-2">
                  {plans.map((plan) => (
                    <Badge key={plan.id} variant="outline" className="bg-white">
                      {plan.name}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  When mapping the "active_plan" column, use these exact plan names for automatic matching.
                </p>
              </div>
            )}

            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Drop your CSV file here or click to browse</p>
              <p className="text-sm text-gray-500 mb-4">Supports CSV files up to 10MB</p>
              <Button variant="outline">Choose File</Button>
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileInputChange} className="hidden" />
            </div>

            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing file...
              </div>
            )}
          </div>
        )}

        {step === "preview" && previewData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">File Preview</h3>
                <p className="text-sm text-gray-600">
                  Showing first {previewData.rows.length} rows of {previewData.allRows.length} total rows
                </p>
              </div>
              <Badge variant="outline">{file?.name}</Badge>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {previewData.headers.map((header, index) => (
                          <th key={index} className="px-4 py-2 text-left font-medium text-gray-900 border-b">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-4 py-2 text-gray-700">
                              {String(cell || "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={() => setStep("mapping")}>
                Next: Map Columns
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === "mapping" && previewData && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Column Mapping</h3>
              <p className="text-sm text-gray-600">
                Map your file columns to member fields. Required fields are marked with *
              </p>
            </div>

            <div className="grid gap-4">
              {previewData.headers.map((header, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label className="font-medium">{header}</Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Sample: {String(previewData.rows[0]?.[index] || "N/A")}
                    </p>
                  </div>
                  <div className="flex-1">
                    <Select
                      value={columnMapping[index.toString()] || ""}
                      onValueChange={(value) => {
                        setColumnMapping((prev) => ({
                          ...prev,
                          [index.toString()]: value,
                        }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Don't import</SelectItem>
                        {ALL_FIELDS.map((field) => (
                          <SelectItem key={field} value={field}>
                            {getFieldDisplayName(field)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {columnMapping[index.toString()] && columnMapping[index.toString()] !== "skip" && (
                      <p className="text-xs text-gray-500 mt-1">
                        {getFieldDescription(columnMapping[index.toString()])}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("preview")}>
                Back
              </Button>
              <Button onClick={startImport} disabled={!validateMapping() || isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {hasDateFields() ? "Next: Date Format" : "Start Import"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "dateformat" && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <div>
                <h3 className="text-lg font-medium">Date Format Selection</h3>
                <p className="text-sm text-gray-600">
                  Your data contains date fields. Please select the format used in your CSV file.
                </p>
              </div>
            </div>

            {getSampleDates().length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Sample dates from your file:</h4>
                <div className="flex flex-wrap gap-2">
                  {getSampleDates().map((sample, index) => (
                    <Badge key={index} variant="outline" className="bg-white">
                      {sample}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-3">
              {DATE_FORMATS.map((format) => (
                <div
                  key={format.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedDateFormat === format.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedDateFormat(format.value)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium cursor-pointer">{format.label}</Label>
                      <p className="text-sm text-gray-500">Example: {format.example}</p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        selectedDateFormat === format.value ? "border-blue-500 bg-blue-500" : "border-gray-300"
                      }`}
                    >
                      {selectedDateFormat === format.value && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("mapping")}>
                Back
              </Button>
              <Button onClick={startImport} disabled={!selectedDateFormat || isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Start Import
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && importJob && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium">Importing Members</h3>
              <p className="text-sm text-gray-600">
                {importJob.status === "pending"
                  ? "Starting import process..."
                  : importJob.status === "processing"
                    ? "Processing your data..."
                    : importJob.status === "completed"
                      ? "Import completed successfully!"
                      : "Import failed. Please check the logs."}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {importJob.status === "completed" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : importJob.status === "failed" ? (
                    <XCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  )}
                  Import Status: {importJob.status}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>
                      {importJob.processed_rows} / {importJob.total_rows}
                    </span>
                  </div>
                  <Progress
                    value={importJob.total_rows > 0 ? (importJob.processed_rows / importJob.total_rows) * 100 : 0}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Success: {importJob.success_count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>Errors: {importJob.error_count}</span>
                  </div>
                </div>

                {importJob.logs && importJob.logs.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Import Log</Label>
                    <div className="mt-2 max-h-32 overflow-y-auto bg-gray-50 p-3 rounded text-xs">
                      {importJob.logs.map((log, index) => (
                        <div key={index} className="mb-1">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {(importJob.status === "completed" || importJob.status === "failed") && (
              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={resetModal}>
                  Import Another File
                </Button>
                <Button onClick={handleClose}>Close</Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ImportMembersModal
