# Edge Function Deployment Instructions

This document provides instructions for deploying the member import processing Edge Function separately from the main application.

## Prerequisites

1. Install the Supabase CLI:
\`\`\`bash
npm install -g supabase
\`\`\`

2. Login to Supabase:
\`\`\`bash
supabase login
\`\`\`

## Edge Function Code

Create a new directory for your Edge Function:

\`\`\`bash
mkdir -p supabase/functions/process-member-import
\`\`\`

Create the Edge Function file:

\`\`\`bash
touch supabase/functions/process-member-import/index.ts
\`\`\`

Add the following code to the file:

\`\`\`typescript
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get("SUPABASE_URL") ?? "",
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      // Create client with Auth context of the user that called the function.
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    )

    // Get the request body
    const { importId } = await req.json()

    if (!importId) {
      return new Response(JSON.stringify({ error: "Import ID is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }

    // 1. Get the import job
    const { data: importJob, error: importError } = await supabaseClient
      .from("member_imports")
      .select("*")
      .eq("id", importId)
      .single()

    if (importError || !importJob) {
      return new Response(JSON.stringify({ error: `Error fetching import job: ${importError?.message}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      })
    }

    // 2. Update status to processing
    await supabaseClient.from("member_imports").update({ status: "processing" }).eq("id", importId)

    // 3. Fetch the file content from storage
    const fileUrl = importJob.file_url
    if (!fileUrl) {
      await supabaseClient
        .from("member_imports")
        .update({
          status: "failed",
          logs: ["No file URL provided"],
          completed_at: new Date().toISOString(),
        })
        .eq("id", importId)

      return new Response(JSON.stringify({ error: "No file URL provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }

    // Extract the path from the URL
    const filePath = fileUrl.split("/").slice(-2).join("/") // Format: "member-imports/filename.csv"

    // Download the file from storage
    const { data: fileData, error: fileError } = await supabaseClient.storage.from("member-imports").download(filePath)

    if (fileError || !fileData) {
      await supabaseClient
        .from("member_imports")
        .update({
          status: "failed",
          logs: [`Error downloading file: ${fileError?.message}`],
          completed_at: new Date().toISOString(),
        })
        .eq("id", importId)

      return new Response(JSON.stringify({ error: `Error downloading file: ${fileError?.message}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      })
    }

    // Convert the file blob to text
    const text = await fileData.text()
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
    await supabaseClient.from("member_imports").update({ total_rows: totalRows }).eq("id", importId)

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
        const { data: member, error: memberError } = await supabaseClient
          .from("members")
          .insert(memberData)
          .select()
          .single()

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
        await supabaseClient
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
    await supabaseClient
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

    return new Response(
      JSON.stringify({
        success: true,
        message: "Import processed successfully",
        stats: {
          total: totalRows,
          processed: processedRows,
          success: successCount,
          error: errorCount,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("Error processing import:", error)

    // Try to mark the import as failed if we have an importId
    try {
      const { importId } = await req.json()
      if (importId) {
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_ANON_KEY") ?? "",
          {
            global: {
              headers: { Authorization: req.headers.get("Authorization")! },
            },
          },
        )

        await supabaseClient
          .from("member_imports")
          .update({
            status: "failed",
            logs: [error instanceof Error ? error.message : "Unknown error occurred during import"],
            completed_at: new Date().toISOString(),
          })
          .eq("id", importId)
      }
    } catch (e) {
      // Ignore errors in error handling
    }

    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
\`\`\`

## Deployment

Deploy the Edge Function:

\`\`\`bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Deploy the Edge Function
supabase functions deploy process-member-import

# Enable JWT verification (recommended for production)
supabase functions update process-member-import --verify-jwt
\`\`\`

## Testing

Test the Edge Function:

\`\`\`bash
# Get your JWT token
TOKEN=$(curl -s -X POST 'https://your-project-ref.supabase.co/auth/v1/token?grant_type=password' \
  -H 'apikey: your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{"email":"your-email@example.com","password":"your-password"}' | jq -r '.access_token')

# Call the Edge Function
curl -i --location --request POST 'https://your-project-ref.functions.supabase.co/process-member-import' \
  --header "Authorization: Bearer $TOKEN" \
  --header 'Content-Type: application/json' \
  --data '{"importId": "your-import-id"}'
\`\`\`

## Updating the Frontend

After deploying the Edge Function, you can update the frontend to use it in production. This should be done as a separate step after the main application is deployed.

## Troubleshooting

If you encounter issues:

1. Check the Edge Function logs:
\`\`\`bash
supabase functions logs process-member-import
\`\`\`

2. Make sure the storage bucket permissions are correctly set
3. Verify that the JWT token has the necessary permissions
4. Check that the file URL in the import job is correct
