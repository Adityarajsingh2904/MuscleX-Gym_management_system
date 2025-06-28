"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Clear any existing invalid session first
      await supabase.auth.signOut()

      // Get fresh session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Session error:", sessionError)
        // If there's a session error, redirect to auth
        router.push("/auth")
        return
      }

      if (!session || !session.user) {
        // No valid session, redirect to auth
        router.push("/auth")
        return
      }

      // Verify the session is actually valid by making a simple authenticated request
      const { error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error("User verification error:", userError)
        // Session is invalid, clear it and redirect to auth
        await supabase.auth.signOut()
        router.push("/auth")
        return
      }

      // Check if user exists in our users table
      const { data: userData, error: userDataError } = await supabase
        .from("users")
        .select("*, user_accounts(*)")
        .eq("id", session.user.id)
        .maybeSingle() // Use maybeSingle to avoid errors if no user found

      if (userDataError) {
        console.error("Error checking user data:", userDataError)
        router.push("/auth")
        return
      }

      if (!userData) {
        // User doesn't exist in our users table, redirect to auth
        router.push("/auth")
        return
      }

      // Check if user has completed onboarding
      if (userData.user_accounts && userData.user_accounts.length > 0) {
        const { data: accountData, error: accountError } = await supabase
          .from("accounts")
          .select("onboarding_completed")
          .eq("id", userData.user_accounts[0].account_id)
          .maybeSingle()

        if (accountError) {
          console.error("Error checking account status:", accountError)
          router.push("/auth")
          return
        }

        if (!accountData?.onboarding_completed) {
          // Redirect to onboarding if not completed
          router.push("/onboarding")
        } else {
          // Redirect to dashboard if onboarding is completed
          router.push("/dashboard")
        }
      } else {
        // No user_accounts found, redirect to onboarding
        router.push("/onboarding")
      }
    } catch (err) {
      console.error("Auth check error:", err)
      setError("Authentication error occurred")
      // Clear any potentially corrupted session
      await supabase.auth.signOut()
      router.push("/auth")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    checkAuth()
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <button
                onClick={handleRetry}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push("/auth")}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
          <p className="text-gray-600">Checking your authentication status</p>
        </div>
      </div>
    )
  }

  return null
}
