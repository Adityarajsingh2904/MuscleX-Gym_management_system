"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ArrowRight, Users, Loader2, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Invitation {
  id: string
  subaccount_id: string
  email: string
  role_id: string
  status_id: string
  token: string
  subaccount: {
    id: string
    name: string
    location: string
    account: {
      id: string
      name: string
    }
  }
  role: {
    id: string
    name: string
  }
  status: {
    name: string
  }
}

export default function SelectGymPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null)
  const [creatingNewGym, setCreatingNewGym] = useState(false)

  useEffect(() => {
    checkInvitations()
  }, [])

  const checkInvitations = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth")
        return
      }

      let query = supabase
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
        .eq("email", user.email)
        .eq("status.name", "pending")

      // If there's a token, filter by it
      if (token) {
        query = query.eq("token", token)
      }

      const { data: invitationsData, error: invitationsError } = await query

      if (invitationsError) {
        console.error("Error loading invitations:", invitationsError)
        setError("Error loading invitations")
        return
      }

      setInvitations(invitationsData || [])

      // If no invitations found and no token, redirect to onboarding
      if ((!invitationsData || invitationsData.length === 0) && !token) {
        router.push("/onboarding")
      }

      // If token provided but no matching invitation found
      if (token && (!invitationsData || invitationsData.length === 0)) {
        setError("Invalid or expired invitation link")
      }
    } catch (err) {
      console.error("Error:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async (invitation: Invitation) => {
    setProcessingInvitation(invitation.id)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth")
        return
      }

      // Get the accepted status ID
      const { data: acceptedStatus, error: statusError } = await supabase
        .from("status")
        .select("id")
        .eq("name", "accepted")
        .single()

      if (statusError || !acceptedStatus) {
        setError("Error processing invitation")
        return
      }

      // Check if user already exists in users table
      const { data: existingUser, error: userCheckError } = await supabase.from("users").select("id").eq("id", user.id)

      if (userCheckError && userCheckError.code !== "PGRST116") {
        console.error("Error checking user:", userCheckError)
        setError("Error checking user record")
        return
      }

      // Create or update user record
      if (!existingUser || existingUser.length === 0) {
        const { error: userError } = await supabase.from("users").insert({
          id: user.id,
          subaccount_id: invitation.subaccount_id,
          name: user.user_metadata?.name || user.email?.split("@")[0],
          email: user.email!,
          role_id: invitation.role_id,
          is_active: true,
        })

        if (userError) {
          console.error("Error creating user record:", userError)
          setError("Error creating user record")
          return
        }
      } else {
        // Update existing user with new subaccount
        const { error: userUpdateError } = await supabase
          .from("users")
          .update({
            subaccount_id: invitation.subaccount_id,
            role_id: invitation.role_id,
          })
          .eq("id", user.id)

        if (userUpdateError) {
          console.error("Error updating user record:", userUpdateError)
          setError("Error updating user record")
          return
        }
      }

      // Create user_account record
      const { error: userAccountError } = await supabase.from("user_accounts").insert({
        user_id: user.id,
        account_id: invitation.subaccount.account.id,
        subaccount_id: invitation.subaccount_id,
        role_id: invitation.role_id,
        is_owner: false,
      })

      if (userAccountError) {
        console.error("Error linking user to account:", userAccountError)
        setError("Error linking user to account")
        return
      }

      // Update invitation status
      const { error: invitationError } = await supabase
        .from("user_invitations")
        .update({
          status_id: acceptedStatus.id,
          responded_at: new Date().toISOString(),
        })
        .eq("id", invitation.id)

      if (invitationError) {
        console.error("Error updating invitation:", invitationError)
        setError("Error updating invitation")
        return
      }

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      console.error("Error accepting invitation:", err)
      setError("An unexpected error occurred")
    } finally {
      setProcessingInvitation(null)
    }
  }

  const handleCreateNewGym = async () => {
    if (creatingNewGym) return // Prevent multiple clicks

    setCreatingNewGym(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth")
        return
      }

      // Get OWNER role ID
      const { data: ownerRole, error: roleError } = await supabase
        .from("roles")
        .select("id")
        .eq("name", "OWNER")
        .single()

      if (roleError || !ownerRole) {
        console.error("Role query error:", roleError)
        setError("Error setting up user role")
        return
      }

      // Check if user already has an account
      const { data: existingAccount, error: checkError } = await supabase
        .from("accounts")
        .select("id")
        .eq("email", user.email)
        .single()

      if (existingAccount) {
        // User already has an account, just redirect to onboarding
        router.push("/onboarding")
        return
      }

      // Create initial account with onboarding_completed = false
      const { data: accountData, error: accountError } = await supabase
        .from("accounts")
        .insert({
          name: `${user.user_metadata?.name || user.email?.split("@")[0]}'s Gym`,
          email: user.email!,
          onboarding_completed: false,
        })
        .select()
        .single()

      if (accountError) {
        console.error("Account creation error:", accountError)
        setError("Error creating gym account")
        return
      }

      // Check if user already exists in users table
      const { data: existingUser, error: userCheckError } = await supabase.from("users").select("id").eq("id", user.id)

      // Create or update user record
      if (!existingUser || existingUser.length === 0) {
        const { error: userError } = await supabase.from("users").insert({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split("@")[0],
          email: user.email!,
          role_id: ownerRole.id,
          is_active: true,
        })

        if (userError) {
          console.error("User creation error:", userError)
          setError("Error creating user record")
          return
        }
      }

      // Create user_account record linking user to the new account as owner
      const { error: userAccountError } = await supabase.from("user_accounts").insert({
        user_id: user.id,
        account_id: accountData.id,
        role_id: ownerRole.id,
        is_owner: true,
      })

      if (userAccountError) {
        console.error("User account linking error:", userAccountError)
        setError("Error linking user to account")
        return
      }

      // Note: We're NOT declining invitations - they remain in pending state

      // Redirect to onboarding to complete gym setup
      router.push("/onboarding")
    } catch (err) {
      console.error("Error creating new gym:", err)
      setError("An unexpected error occurred")
    } finally {
      setCreatingNewGym(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to MuscleX</h1>
          {token ? (
            <p className="text-gray-600 mt-2">You have been invited to join a gym</p>
          ) : (
            <p className="text-gray-600 mt-2">You have pending invitations</p>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {/* Invitation Cards */}
          {invitations.map((invitation) => (
            <Card key={invitation.id} className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  You're Invited!
                </CardTitle>
                <CardDescription>
                  Join {invitation.subaccount.account.name} as a {invitation.role.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="font-medium">{invitation.subaccount.name}</span>
                      <p className="text-sm text-gray-600">{invitation.subaccount.location}</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      {invitation.role.name}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Join this gym to access its management features and collaborate with the team.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleAcceptInvitation(invitation)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={processingInvitation === invitation.id || creatingNewGym}
                >
                  {processingInvitation === invitation.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      Accept Invitation
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}

          {/* Create New Gym Option */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Start Your Own Gym</CardTitle>
              <CardDescription>
                {invitations.length > 0
                  ? "Or create and manage your own gym business instead"
                  : "Create and manage your own gym business"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">
                  Create a new gym to manage members, trainers, classes, billing, and more. You'll be the owner with
                  full access to all features.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleCreateNewGym}
                className="w-full"
                variant="outline"
                disabled={processingInvitation !== null || creatingNewGym}
              >
                {creatingNewGym ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Start New Gym
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
