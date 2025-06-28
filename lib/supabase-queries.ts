import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Helper function to get current user
export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Auth error:", error)
      throw new Error("Authentication failed")
    }

    if (!user) {
      throw new Error("User not authenticated")
    }

    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    throw error
  }
}

// Helper function to get current user's user_account for a specific subaccount
export async function getCurrentUserAccount(subaccountId: string) {
  try {
    // Step 1: Get the current authenticated user
    const authUser = await getCurrentUser()
    console.log("Current authenticated user:", authUser.id, authUser.email)

    // Step 2: Find the user record that matches the authenticated user's email
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("email", authUser.email)
      .single()

    if (userError || !userRecord) {
      console.error("User record not found:", userError)
      throw new Error("User record not found")
    }

    console.log("Found user record:", userRecord)

    // Step 3: Get the user_account for this user and subaccount
    const { data: userAccount, error: userAccountError } = await supabase
      .from("user_accounts")
      .select(`
        id,
        users (
          id,
          name,
          email
        ),
        roles (
          id,
          name
        )
      `)
      .eq("user_id", userRecord.id)
      .eq("subaccount_id", subaccountId)
      .single()

    if (userAccountError || !userAccount) {
      console.error("User account not found:", userAccountError)
      throw new Error("No user account found for this gym")
    }

    console.log("Found user_account:", userAccount)
    return userAccount
  } catch (error) {
    console.error("Error getting current user account:", error)
    throw error
  }
}

// Member Functions
export async function getMembers(subaccountId: string) {
  const { data, error } = await supabase
    .from("members")
    .select(`
      *,
      plan:plans(*)
    `)
    .eq("subaccount_id", subaccountId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function createMember(memberData: any) {
  try {
    console.log("Creating member with data:", memberData)

    const validMemberData = {
      subaccount_id: memberData.subaccount_id,
      name: memberData.name,
      email: memberData.email,
      phone: memberData.phone,
      gender: memberData.gender,
      dob: memberData.dob,
      join_date: memberData.join_date,
      is_active: memberData.is_active,
      active_plan: memberData.active_plan,
      last_payment: memberData.last_payment || null,
      next_payment: memberData.next_payment,
    }

    const { data, error } = await supabase.from("members").insert(validMemberData).select().single()

    if (error) {
      console.error("Database error creating member:", error)
      throw error
    }

    console.log("Member created successfully:", data)
    return data
  } catch (error) {
    console.error("Error creating member:", error)
    throw error
  }
}

export async function updateMember(memberId: string, memberData: any) {
  try {
    const validMemberData = {
      name: memberData.name,
      email: memberData.email,
      phone: memberData.phone,
      gender: memberData.gender,
      dob: memberData.dob,
      join_date: memberData.join_date,
      is_active: memberData.is_active,
      active_plan: memberData.active_plan,
      last_payment: memberData.last_payment,
      next_payment: memberData.next_payment,
    }

    const { data, error } = await supabase.from("members").update(validMemberData).eq("id", memberId).select().single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating member:", error)
    throw error
  }
}

// Payment Functions - FIXED to filter by subaccount
export async function getPayments(subaccountId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      member:members!inner(*),
      plan:plans(*),
      payment_method:payment_methods(*)
    `)
    .eq("member.subaccount_id", subaccountId)
    .order("paid_at", { ascending: false })

  if (error) {
    console.error("Error fetching payments:", error)
    throw error
  }
  return data
}

export async function getMemberPayments(memberId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      plan:plans(*),
      payment_method:payment_methods(*)
    `)
    .eq("member_id", memberId)
    .order("paid_at", { ascending: false })

  if (error) throw error
  return data
}

export async function createPayment(paymentData: any, subaccountId: string) {
  try {
    const { data, error } = await supabase.from("payments").insert(paymentData).select().single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating payment:", error)
    throw error
  }
}

// Plan Functions
export async function getPlans(subaccountId: string) {
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("subaccount_id", subaccountId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function createPlan(planData: any) {
  try {
    console.log("Creating plan with data:", planData)

    const { data, error } = await supabase.from("plans").insert(planData).select().single()

    if (error) {
      console.error("Database error creating plan:", error)
      throw error
    }

    console.log("Plan created successfully:", data)
    return data
  } catch (error) {
    console.error("Error in createPlan:", error)
    throw error
  }
}

// Get Payment Methods
export async function getPaymentMethods() {
  const { data, error } = await supabase.from("payment_methods").select("*").eq("is_active", true).order("name")

  if (error) throw error
  return data
}

// Add currency functions
export async function getCurrencies() {
  const { data, error } = await supabase.from("currency").select("*").order("name")

  if (error) throw error
  return data
}

export async function getAccountCurrency(accountId: string) {
  const { data, error } = await supabase
    .from("accounts")
    .select(`
      currency_id,
      currency:currency(*)
    `)
    .eq("id", accountId)
    .single()

  if (error) throw error
  return data?.currency
}

// Update existing functions to include currency context where needed
export async function getAccountDetails(accountId: string) {
  const { data, error } = await supabase
    .from("accounts")
    .select(`
      *,
      currency:currency(*)
    `)
    .eq("id", accountId)
    .single()

  if (error) throw error
  return data
}

// Account Functions
export async function updateAccount(accountId: string, accountData: any) {
  try {
    console.log("Updating account with data:", accountData)

    const validAccountData = {
      name: accountData.name,
      email: accountData.email,
      phone: accountData.phone,
      address: accountData.address,
      website: accountData.website,
      description: accountData.description,
      currency_id: accountData.currency_id,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("accounts")
      .update(validAccountData)
      .eq("id", accountId)
      .select(`
        *,
        currency:currency(*)
      `)
      .single()

    if (error) {
      console.error("Database error updating account:", error)
      throw error
    }

    console.log("Account updated successfully:", data)
    return data
  } catch (error) {
    console.error("Error updating account:", error)
    throw error
  }
}

// Currency Functions
// Member Import Functions
export async function getMemberImports(subaccountId: string) {
  const { data, error } = await supabase
    .from("member_imports")
    .select("*")
    .eq("subaccount_id", subaccountId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function createMemberImport(importData: any) {
  try {
    const { data, error } = await supabase.from("member_imports").insert(importData).select().single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating member import:", error)
    throw error
  }
}

export async function updateMemberImport(importId: string, updateData: any) {
  try {
    const { data, error } = await supabase
      .from("member_imports")
      .update(updateData)
      .eq("id", importId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating member import:", error)
    throw error
  }
}

export async function getMemberImportById(importId: string) {
  try {
    const { data, error } = await supabase.from("member_imports").select("*").eq("id", importId).single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error getting member import:", error)
    throw error
  }
}
// Update member's next payment date
export async function updateMemberNextPayment(memberId: string, nextPaymentDate: string, planId?: string) {
  try {
    const updateData: any = {
      next_payment: nextPaymentDate,
      last_payment: new Date().toISOString().split("T")[0],
    }

    // If a plan is provided, also update the active plan
    if (planId) {
      updateData.active_plan = planId
    }

    const { data, error } = await supabase.from("members").update(updateData).eq("id", memberId).select().single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating member next payment:", error)
    throw error
  }
}
// Export the supabase client for direct use
export { supabase }
