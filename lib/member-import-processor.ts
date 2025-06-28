import { supabase } from "./supabase-queries"

// This would normally be a serverless function or webhook
export async function processMemberImport(importId: string) {
  try {
    // 1. Get the import job
    const { data: importJob, error: importError } = await supabase
      .from("member_imports")
      .select("*")
      .eq("id", importId)
      .single()

    if (importError || !importJob) {
      console.error("Error fetching import job:", importError)
      return
    }

    // 2. Update status to processing
    await supabase.from("member_imports").update({ status: "processing" }).eq("id", importId)

    // 3. Fetch the file content
    const fileUrl = importJob.file_url
    const response = await fetch(fileUrl)
    const text = await response.text()
    const lines = text.split("\n").filter((line) => line.trim())

    // 4. Parse the headers and get column mapping
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    const columnMapping = importJob.column_mapping || {}

    // 5. Process each row
    const totalRows = lines.length - 1 // Exclude header row
    let processedRows = 0
    let successCount = 0
    let errorCount = 0
    const logs: string[] = []

    // Update the total rows count
    await supabase.from("member_imports").update({ total_rows: totalRows }).eq("id", importId)

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      try {
        const line = lines[i]
        if (!line.trim()) continue

        const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
        const memberData: any = {
          subaccount_id: importJob.subaccount_id,
          is_active: true,
          join_date: new Date().toISOString().split("T")[0],
        }

        // Map values to fields based on column mapping
        Object.entries(columnMapping).forEach(([columnIndex, fieldName]) => {
          if (fieldName !== "skip") {
            const index = Number.parseInt(columnIndex)
            const value = values[index]

            // Handle special field types
            if (fieldName === "is_active") {
              memberData[fieldName] =
                value?.toLowerCase() === "true" || value?.toLowerCase() === "yes" || value?.toLowerCase() === "active"
            } else if (fieldName === "dob" || fieldName === "join_date") {
              // Try to parse date
              if (value) {
                try {
                  const date = new Date(value)
                  if (!isNaN(date.getTime())) {
                    memberData[fieldName] = date.toISOString().split("T")[0]
                  }
                } catch (e) {
                  // Invalid date, use as-is
                  memberData[fieldName] = value
                }
              }
            } else {
              memberData[fieldName] = value
            }
          }
        })

        // Validate required fields
        if (!memberData.name) {
          throw new Error("Name is required")
        }

        // Insert the member
        const { data: member, error: memberError } = await supabase.from("members").insert(memberData).select().single()

        if (memberError) {
          throw new Error(memberError.message)
        }

        successCount++
      } catch (error) {
        errorCount++
        logs.push(`Row ${i}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }

      processedRows++

      // Update progress every 10 rows or at the end
      if (processedRows % 10 === 0 || processedRows === totalRows) {
        await supabase
          .from("member_imports")
          .update({
            processed_rows: processedRows,
            success_count: successCount,
            error_count: errorCount,
            logs: logs,
          })
          .eq("id", importId)
      }
    }

    // 6. Mark as completed
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
    console.error("Error processing import:", error)

    // Mark as failed
    await supabase
      .from("member_imports")
      .update({
        status: "failed",
        logs: [error instanceof Error ? error.message : "Unknown error occurred during import"],
        completed_at: new Date().toISOString(),
      })
      .eq("id", importId)
  }
}
