"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Save, Building, Loader2 } from "lucide-react"
import { useGym } from "@/lib/gym-context"
import { getAccountDetails, updateAccount, getCurrencies } from "@/lib/supabase-queries"
import { useToast } from "@/hooks/use-toast"

interface Currency {
  id: string
  name: string
  symbol: string
  code: string
}

export default function SettingsPage() {
  const { currentAccountId, refreshData, refreshCurrency } = useGym()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [currencies, setCurrencies] = useState<Currency[]>([])

  const [settings, setSettings] = useState({
    gymName: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    description: "",
    currency_id: "",
  })

  // Load account data and currencies on mount
  useEffect(() => {
    async function loadData() {
      if (!currentAccountId) return

      try {
        setIsLoading(true)

        // Load currencies
        const currenciesData = await getCurrencies()
        setCurrencies(currenciesData || [])

        // Load account details
        const accountData = await getAccountDetails(currentAccountId)

        if (accountData) {
          setSettings({
            gymName: accountData.name || "",
            address: accountData.address || "",
            phone: accountData.phone || "",
            email: accountData.email || "",
            website: accountData.website || "",
            description: accountData.description || "",
            currency_id: accountData.currency_id || "",
          })
        }
      } catch (error) {
        console.error("Error loading settings:", error)
        toast({
          title: "Error",
          description: "Failed to load settings. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [currentAccountId, toast])

  const handleSave = async () => {
    if (!currentAccountId) {
      toast({
        title: "Error",
        description: "No account selected. Please try again.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)

      const accountUpdateData = {
        name: settings.gymName,
        phone: settings.phone,
        address: settings.address,
        website: settings.website,
        description: settings.description,
        currency_id: settings.currency_id,
      }

      await updateAccount(currentAccountId, accountUpdateData)

      // Refresh currency immediately for real-time updates
      await refreshCurrency()

      // Refresh the context
      refreshData()

      toast({
        title: "Success",
        description: "Settings updated successfully!",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure your gym information</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-teal-600 hover:bg-teal-700">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Gym Information */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Gym Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="gymName">Gym Name *</Label>
                <Input
                  id="gymName"
                  value={settings.gymName}
                  onChange={(e) => handleInputChange("gymName", e.target.value)}
                  placeholder="Enter gym name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={settings.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://www.gym.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={settings.currency_id}
                  onChange={(e) => handleInputChange("currency_id", e.target.value)}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select Currency</option>
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.name} ({currency.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  disabled
                  className="bg-gray-50 text-gray-500 cursor-not-allowed mt-1"
                  placeholder="Email cannot be changed"
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  rows={2}
                  placeholder="Enter gym address"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={settings.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={3}
                  placeholder="Brief description of your gym"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
