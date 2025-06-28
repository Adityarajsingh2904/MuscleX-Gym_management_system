import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "implicit",
    },
    global: {
      headers: {
        "X-Client-Info": "supabase-js-web",
      },
    },
  })
}

export const supabase = createClient()

// Helper function to safely get current session
export const getCurrentSession = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (error) {
      console.error("Session error:", error)
      return null
    }
    return session
  } catch (err) {
    console.error("Error getting session:", err)
    return null
  }
}

// Helper function to safely get current user
export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) {
      console.error("User error:", error)
      return null
    }
    return user
  } catch (err) {
    console.error("Error getting user:", err)
    return null
  }
}
