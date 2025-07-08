"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dumbbell, Mail, Lock, User, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AuthPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("login")
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [defaultCurrencyId, setDefaultCurrencyId] = useState<string | null>(null)

  // Fetch the default currency ID on component mount
  useEffect(() => {
    async function fetchDefaultCurrency() {
      try {
        const { data, error } = await supabase
          .from("currency")
          .select("id")
          .order("code", { ascending: true })
          .limit(1)
          .single()

        if (error) {
          console.error("Error fetching default currency:", error)
          return
        }

        if (data) {
          setDefaultCurrencyId(data.id)
        }
      } catch (err) {
        console.error("Error in fetchDefaultCurrency:", err)
      }
    }

    fetchDefaultCurrency()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        // Check if user exists in our users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*, user_accounts(*)")
          .eq("id", data.user.id)
          .single()

        if (userError && userError.code !== "PGRST116") {
          setError("Error checking user data")
          return
        }

        if (!userData) {
          setError("User account not found. Please sign up first.")
          await supabase.auth.signOut()
          return
        }

        // Check if user has completed onboarding
        if (userData.user_accounts && userData.user_accounts.length > 0) {
          const { data: accountData, error: accountError } = await supabase
            .from("accounts")
            .select("onboarding_completed")
            .eq("id", userData.user_accounts[0].account_id)
            .single()

          if (accountError) {
            console.error("Error checking account status:", accountError)
            setError("Error checking account status")
            return
          }

          if (!accountData.onboarding_completed) {
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
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (signupPassword !== signupConfirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (!defaultCurrencyId) {
      setError("System configuration error: No default currency found")
      setIsLoading(false)
      return
    }

    try {
      // 1. Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            name: signupName,
          },
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        // 2. Check for pending invitations BEFORE creating any records
        const { data: invitationsData, error: invitationsError } = await supabase
          .from("user_invitations")
          .select(`
            *,
            subaccount:subaccounts(
              id,
              name,
              location,
              account:accounts(id, name)
            ),
            role:roles(id, name),
            status:status(name)
          `)
          .eq("email", signupEmail)
          .eq("status.name", "pending")

        if (invitationsError) {
          console.error("Error checking invitations:", invitationsError)
          setError("Error checking invitations")
          return
        }

        // If user has pending invitations, redirect to select-gym page
        if (invitationsData && invitationsData.length > 0) {
          router.push("/select-gym")
          return
        }

        // 3. If no invitations, proceed with normal signup flow
        // Get OWNER role ID
        const { data: ownerRole, error: roleError } = await supabase
          .from("roles")
          .select("id")
          .eq("name", "OWNER")
          .single()

        if (roleError || !ownerRole) {
          console.error("Role query error:", roleError)
          setError(`Error setting up user role: ${roleError?.message || "Role not found"}`)
          return
        }

        // 4. Create initial account with onboarding_completed = false
        try {
          console.log("Creating initial account with currency_id:", defaultCurrencyId)
          const { data: accountData, error: accountError } = await supabase
            .from("accounts")
            .insert({
              name: `${signupName}'s Gym`, // Temporary name
              email: signupEmail,
              onboarding_completed: false, // Key: Not completed yet
              // Add default values for any required fields
              phone: "",
              address: "",
              description: "",
              currency_id: defaultCurrencyId, // Use the fetched UUID
            })
            .select()
            .single()

          if (accountError) {
            console.error("Account creation error:", accountError)
            setError(`Error creating initial account: ${accountError.message}`)
            return
          }

          console.log("Account created successfully:", accountData)

          // 5. Create user in users table
          const { error: userError } = await supabase.from("users").insert({
            id: data.user.id,
            name: signupName,
            email: signupEmail,
            role_id: ownerRole.id,
            is_active: true,
          })

          if (userError) {
            console.error("User creation error:", userError)
            setError(`Error creating user record: ${userError.message}`)
            return
          }

          // 6. Create user_account record linking user to the placeholder account
          const { error: userAccountError } = await supabase.from("user_accounts").insert({
            user_id: data.user.id,
            account_id: accountData.id,
            role_id: ownerRole.id,
            is_owner: true,
          })

          if (userAccountError) {
            console.error("User account link error:", userAccountError)
            setError(`Error linking user to account: ${userAccountError.message}`)
            return
          }

          // After successful signup, redirect to onboarding
          router.push("/onboarding")
        } catch (err: any) {
          console.error("Detailed error:", err)
          setError(`Account creation failed: ${err.message || "Unknown error"}`)
        }
      }
    } catch (err: any) {
      console.error("Signup error:", err)
      setError(`An unexpected error occurred: ${err.message || "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
            <Dumbbell className="h-8 w-8 text-teal-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">MuscleX</h1>
          <p className="text-gray-600">Complete Gym Management System</p>
        </div>

        <Card>
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        placeholder="John Smith"
                        className="pl-10"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>

            <CardFooter className="flex justify-center text-sm text-gray-600">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </CardFooter>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
