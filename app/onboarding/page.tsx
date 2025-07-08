"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, User, Settings, CheckCircle, ArrowRight, ArrowLeft, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface OnboardingData {
  step: number
  gymInfo: {
    name: string
    address: string
    phone: string
    email: string
    website: string
    description: string
  }
  franchiseInfo: {
    name: string
    location: string
  }
  ownerInfo: {
    name: string
    email: string
    phone: string
  }
  preferences: {
    timezone: string
    currency: string
    features: string[]
  }
  completed: boolean
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [userRole, setUserRole] = useState("")
  const [isExistingUser, setIsExistingUser] = useState(false)
  const [hasOwnedGym, setHasOwnedGym] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [existingAccountId, setExistingAccountId] = useState<string | null>(null)
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    step: 1,
    gymInfo: {
      name: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      description: "",
    },
    franchiseInfo: {
      name: "",
      location: "",
    },
    ownerInfo: {
      name: "",
      email: "",
      phone: "",
    },
    preferences: {
      timezone: "America/New_York",
      currency: "USD",
      features: [],
    },
    completed: false,
  })

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  useEffect(() => {
    checkUserStatus()
  }, [])

  const checkUserStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth")
        return
      }

      // Check if user already exists in users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*, role:roles(name)")
        .eq("id", user.id)
        .single()

      if (userData) {
        setIsExistingUser(true)
        setUserRole(userData.role?.name || "")

        // Check if user owns any gym
        const { data: userAccountsData } = await supabase
          .from("user_accounts")
          .select("is_owner")
          .eq("user_id", user.id)
          .eq("is_owner", true)

        setHasOwnedGym((userAccountsData && userAccountsData.length > 0) || false)

        // Pre-fill owner info for existing users
        setOnboardingData((prev) => ({
          ...prev,
          ownerInfo: {
            name: userData.name || user.user_metadata?.name || "",
            email: userData.email || user.email || "",
            phone: userData.phone || "",
          },
        }))
      }

      // Find the most recent account created for this user that hasn't completed onboarding
      const { data: existingAccount, error: accountError } = await supabase
        .from("accounts")
        .select("*")
        .eq("email", user.email)
        .eq("onboarding_completed", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (existingAccount) {
        setExistingAccountId(existingAccount.id)
        // Pre-fill gym info from existing account (if any)
        setOnboardingData((prev) => ({
          ...prev,
          gymInfo: {
            name: existingAccount.name || "",
            address: existingAccount.address || "",
            phone: existingAccount.phone || "",
            email: existingAccount.email || "",
            website: existingAccount.website || "",
            description: existingAccount.description || "",
          },
        }))
      }
    } catch (error) {
      console.error("Error checking user status:", error)
    }
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    if (isCompleting) return // Prevent multiple clicks

    setIsCompleting(true)
    setIsLoading(true)
    setError("")

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth")
        return
      }

      // Get OWNER role ID
      const { data: ownerRole } = await supabase.from("roles").select("id").eq("name", "OWNER").single()

      if (!ownerRole) {
        setError("Error getting role information")
        return
      }

      let accountData

      if (existingAccountId) {
        // Update the existing account created during signup
        const { data: updatedAccount, error: accountError } = await supabase
          .from("accounts")
          .update({
            name: onboardingData.gymInfo.name,
            phone: onboardingData.gymInfo.phone,
            address: onboardingData.gymInfo.address,
            website: onboardingData.gymInfo.website,
            description: onboardingData.gymInfo.description,
            onboarding_completed: true, // Mark as completed
          })
          .eq("id", existingAccountId)
          .select()
          .single()

        if (accountError) {
          console.error("Account update error:", accountError)
          setError("Error updating gym account")
          return
        }

        accountData = updatedAccount
      } else {
        // Fallback: Create new account if somehow the existing one wasn't found
        const { data: newAccount, error: accountError } = await supabase
          .from("accounts")
          .insert({
            name: onboardingData.gymInfo.name,
            email: onboardingData.gymInfo.email,
            phone: onboardingData.gymInfo.phone,
            address: onboardingData.gymInfo.address,
            website: onboardingData.gymInfo.website,
            description: onboardingData.gymInfo.description,
            onboarding_completed: true,
          })
          .select()
          .single()

        if (accountError) {
          console.error("Account creation error:", accountError)
          setError("Error creating gym account")
          return
        }

        accountData = newAccount
      }

      // Create subaccount (franchise)
      const { data: subaccountData, error: subaccountError } = await supabase
        .from("subaccounts")
        .insert({
          account_id: accountData.id,
          name: onboardingData.franchiseInfo.name || `${onboardingData.gymInfo.name} Main`,
          location: onboardingData.franchiseInfo.location || onboardingData.gymInfo.address,
        })
        .select()
        .single()

      if (subaccountError) {
        console.error("Subaccount creation error:", subaccountError)
        setError("Error creating franchise")
        return
      }

      // Update or create user record with subaccount_id
      const { data: userData } = await supabase.from("users").select("*").eq("id", user.id)

      if (userData && userData.length > 0) {
        // Update existing user
        const { error: userUpdateError } = await supabase
          .from("users")
          .update({
            subaccount_id: subaccountData.id,
            name: onboardingData.ownerInfo.name || user.user_metadata?.name || user.email?.split("@")[0],
            phone: onboardingData.ownerInfo.phone,
            role_id: ownerRole.id, // Ensure user has OWNER role
          })
          .eq("id", user.id)

        if (userUpdateError) {
          console.error("User update error:", userUpdateError)
          setError("Error updating user record")
          return
        }
      } else {
        // Create new user record
        const { error: userCreateError } = await supabase.from("users").insert({
          id: user.id,
          subaccount_id: subaccountData.id,
          name: onboardingData.ownerInfo.name || user.user_metadata?.name || user.email?.split("@")[0],
          email: user.email!,
          phone: onboardingData.ownerInfo.phone,
          role_id: ownerRole.id,
          is_active: true,
        })

        if (userCreateError) {
          console.error("User creation error:", userCreateError)
          setError("Error creating user record")
          return
        }
      }

      // Check if user_account record already exists for this account
      const { data: existingUserAccount, error: existingUserAccountError } = await supabase
        .from("user_accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("account_id", accountData.id)
        .single()

      if (existingUserAccount) {
        // Update the existing user_account record with subaccount_id
        const { error: userAccountUpdateError } = await supabase
          .from("user_accounts")
          .update({
            subaccount_id: subaccountData.id,
            role_id: ownerRole.id,
            is_owner: true,
          })
          .eq("id", existingUserAccount.id)

        if (userAccountUpdateError) {
          console.error("User account update error:", userAccountUpdateError)
          setError("Error updating user account link")
          return
        }
      } else {
        // Create new user_account record
        const { error: userAccountCreateError } = await supabase.from("user_accounts").insert({
          user_id: user.id,
          account_id: accountData.id,
          subaccount_id: subaccountData.id,
          role_id: ownerRole.id,
          is_owner: true,
        })

        if (userAccountCreateError) {
          console.error("User account creation error:", userAccountCreateError)
          setError("Error creating user account link")
          return
        }
      }

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      console.error("Onboarding error:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
      setIsCompleting(false)
    }
  }

  const availableFeatures = [
    "Member Management",
    "Billing & Payments",
    "Class Scheduling",
    "Inventory Management",
    "Analytics & Reports",
    "Access Control",
    "Mobile App",
    "Email Notifications",
  ]

  const toggleFeature = (feature: string) => {
    setOnboardingData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        features: prev.preferences.features.includes(feature)
          ? prev.preferences.features.filter((f) => f !== feature)
          : [...prev.preferences.features, feature],
      },
    }))
  }

  const pageTitle = "Complete Your Gym Setup"
  const pageDescription = "Let's complete your gym management system setup"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
          <p className="text-gray-600">{pageDescription}</p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Complete your gym setup to start managing your fitness business.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {currentStep === 1 && <Building2 className="h-5 w-5 text-blue-600" />}
                {currentStep === 2 && <User className="h-5 w-5 text-blue-600" />}
                {currentStep === 3 && <Settings className="h-5 w-5 text-blue-600" />}
                {currentStep === 4 && <CheckCircle className="h-5 w-5 text-blue-600" />}
                <span className="font-medium">
                  Step {currentStep} of {totalSteps}
                </span>
              </div>
              <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="mb-4" />
            <CardTitle>
              {currentStep === 1 && "Gym Information"}
              {currentStep === 2 && "Owner Information"}
              {currentStep === 3 && "Preferences"}
              {currentStep === 4 && "Complete Setup"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gymName">Gym Name</Label>
                    <Input
                      id="gymName"
                      value={onboardingData.gymInfo.name}
                      onChange={(e) =>
                        setOnboardingData((prev) => ({
                          ...prev,
                          gymInfo: { ...prev.gymInfo, name: e.target.value },
                        }))
                      }
                      placeholder="MuscleX Gym"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="franchiseName">Default Franchise Name</Label>
                    <Input
                      id="franchiseName"
                      value={onboardingData.franchiseInfo.name}
                      onChange={(e) =>
                        setOnboardingData((prev) => ({
                          ...prev,
                          franchiseInfo: { ...prev.franchiseInfo, name: e.target.value },
                        }))
                      }
                      placeholder="Main Branch"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gymAddress">Address</Label>
                  <Textarea
                    id="gymAddress"
                    value={onboardingData.gymInfo.address}
                    onChange={(e) =>
                      setOnboardingData((prev) => ({
                        ...prev,
                        gymInfo: { ...prev.gymInfo, address: e.target.value },
                      }))
                    }
                    placeholder="123 Fitness Street, Gym City, GC 12345"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="franchiseLocation">Franchise Location</Label>
                  <Input
                    id="franchiseLocation"
                    value={onboardingData.franchiseInfo.location}
                    onChange={(e) =>
                      setOnboardingData((prev) => ({
                        ...prev,
                        franchiseInfo: { ...prev.franchiseInfo, location: e.target.value },
                      }))
                    }
                    placeholder="Downtown District"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gymPhone">Phone</Label>
                    <Input
                      id="gymPhone"
                      value={onboardingData.gymInfo.phone}
                      onChange={(e) =>
                        setOnboardingData((prev) => ({
                          ...prev,
                          gymInfo: { ...prev.gymInfo, phone: e.target.value },
                        }))
                      }
                      placeholder="+1 234-567-8900"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gymEmail">Email</Label>
                    <Input
                      id="gymEmail"
                      type="email"
                      value={onboardingData.gymInfo.email}
                      onChange={(e) =>
                        setOnboardingData((prev) => ({
                          ...prev,
                          gymInfo: { ...prev.gymInfo, email: e.target.value },
                        }))
                      }
                        placeholder="info@musclexgym.com"
                      required
                      disabled={existingAccountId !== null} // Disable if updating existing account
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gymWebsite">Website (Optional)</Label>
                  <Input
                    id="gymWebsite"
                    value={onboardingData.gymInfo.website}
                    onChange={(e) =>
                      setOnboardingData((prev) => ({
                        ...prev,
                        gymInfo: { ...prev.gymInfo, website: e.target.value },
                      }))
                    }
                      placeholder="https://musclexgym.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gymDescription">Description (Optional)</Label>
                  <Textarea
                    id="gymDescription"
                    value={onboardingData.gymInfo.description}
                    onChange={(e) =>
                      setOnboardingData((prev) => ({
                        ...prev,
                        gymInfo: { ...prev.gymInfo, description: e.target.value },
                      }))
                    }
                    placeholder="Tell us about your gym..."
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Full Name</Label>
                    <Input
                      id="ownerName"
                      value={onboardingData.ownerInfo.name}
                      onChange={(e) =>
                        setOnboardingData((prev) => ({
                          ...prev,
                          ownerInfo: { ...prev.ownerInfo, name: e.target.value },
                        }))
                      }
                      placeholder="John Smith"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerEmail">Email</Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      value={onboardingData.ownerInfo.email}
                      onChange={(e) =>
                        setOnboardingData((prev) => ({
                          ...prev,
                          ownerInfo: { ...prev.ownerInfo, email: e.target.value },
                        }))
                      }
                        placeholder="john@musclexgym.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerPhone">Phone</Label>
                  <Input
                    id="ownerPhone"
                    value={onboardingData.ownerInfo.phone}
                    onChange={(e) =>
                      setOnboardingData((prev) => ({
                        ...prev,
                        ownerInfo: { ...prev.ownerInfo, phone: e.target.value },
                      }))
                    }
                    placeholder="+1 234-567-8900"
                    required
                  />
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    <strong>Ownership:</strong> You will become the owner of this gym with full administrative access
                    and control.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={onboardingData.preferences.timezone}
                      onValueChange={(value) =>
                        setOnboardingData((prev) => ({
                          ...prev,
                          preferences: { ...prev.preferences, timezone: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={onboardingData.preferences.currency}
                      onValueChange={(value) =>
                        setOnboardingData((prev) => ({
                          ...prev,
                          preferences: { ...prev.preferences, currency: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="CAD">CAD (C$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Features to Enable</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {availableFeatures.map((feature) => (
                      <div
                        key={feature}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          onboardingData.preferences.features.includes(feature)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => toggleFeature(feature)}
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              onboardingData.preferences.features.includes(feature)
                                ? "border-blue-500 bg-blue-500"
                                : "border-gray-300"
                            }`}
                          >
                            {onboardingData.preferences.features.includes(feature) && (
                              <CheckCircle className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className="text-sm font-medium">{feature}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Setup Complete!</h3>
                  <p className="text-gray-600">
                    Your gym management system is ready to use. You can always modify these settings later.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium">Setup Summary:</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Gym Name:</span>
                      <span className="font-medium">{onboardingData.gymInfo.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Default Franchise:</span>
                      <span className="font-medium">
                        {onboardingData.franchiseInfo.name || `${onboardingData.gymInfo.name} Main`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Owner:</span>
                      <span className="font-medium">{onboardingData.ownerInfo.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Your Role:</span>
                      <span className="font-medium text-green-600">OWNER</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Features:</span>
                      <span className="font-medium">{onboardingData.preferences.features.length} enabled</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              {currentStep > 1 && (
                <Button variant="outline" onClick={handlePrevious} disabled={isLoading}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              {currentStep < totalSteps ? (
                <Button onClick={handleNext} className="ml-auto bg-blue-600 hover:bg-blue-700">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  className="ml-auto bg-green-600 hover:bg-green-700"
                  disabled={isLoading || isCompleting}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
