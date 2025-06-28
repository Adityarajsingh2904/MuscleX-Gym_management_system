"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useGymContext } from "@/lib/gym-context"
import { getPlans, createMember } from "@/lib/supabase-queries"
import { MemberPaymentsTab } from "./member-payments-tab"
import type { Plan, Member } from "@/types/database"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AddMemberModalProps {
  open: boolean
  onClose: () => void
  onMemberAdded: () => void
}

export function AddMemberModal({ open, onClose, onMemberAdded }: AddMemberModalProps) {
  const { currentSubaccountId } = useGymContext()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("details")
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [createdMember, setCreatedMember] = useState<Member | null>(null)

  const [memberData, setMemberData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    join_date: new Date().toISOString().split("T")[0],
    selected_plan_id: "",
  })

  useEffect(() => {
    if (open && currentSubaccountId) {
      loadPlans()
      setCreatedMember(null)
      setActiveTab("details")
    }
  }, [open, currentSubaccountId])

  const loadPlans = async () => {
    try {
      const plansData = await getPlans(currentSubaccountId!)
      setPlans(plansData || [])
    } catch (error) {
      console.error("Error loading plans:", error)
      toast({
        title: "Error",
        description: "Failed to load plans",
        variant: "destructive",
      })
    }
  }

  const selectedPlan = plans.find((p) => p.id === memberData.selected_plan_id)

  const calculateNextPaymentDate = (joinDate: string, planDuration: number) => {
    const join = new Date(joinDate)
    const nextPayment = new Date(join)
    nextPayment.setDate(nextPayment.getDate() + planDuration)
    return nextPayment.toISOString().split("T")[0]
  }

  const handleSubmit = async () => {
    if (!memberData.name || !currentSubaccountId) {
      toast({
        title: "Error",
        description: "Please fill in the required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      const memberPayload = {
        subaccount_id: currentSubaccountId,
        name: memberData.name,
        email: memberData.email || null,
        phone: memberData.phone || null,
        gender: memberData.gender || null,
        dob: memberData.dob || null,
        join_date: memberData.join_date,
        is_active: true,
        active_plan: memberData.selected_plan_id || null,
        // Case 1: If plan is selected but no payment made yet, next_payment = join_date
        next_payment: selectedPlan ? memberData.join_date : null,
      }

      const member = await createMember(memberPayload)
      setCreatedMember(member)

      toast({
        title: "Success",
        description: "Member created successfully. You can now add payment details.",
      })

      // Move to payments tab if a plan was selected
      if (memberData.selected_plan_id) {
        setActiveTab("payments")
      } else {
        // If no plan selected, close modal
        handleClose()
        onMemberAdded()
      }
    } catch (error) {
      console.error("Error creating member:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create member",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setMemberData({
      name: "",
      email: "",
      phone: "",
      gender: "",
      dob: "",
      join_date: new Date().toISOString().split("T")[0],
      selected_plan_id: "",
    })
    setCreatedMember(null)
    setActiveTab("details")
    onClose()
  }

  const handlePaymentAdded = () => {
    toast({
      title: "Success",
      description: "Payment added successfully",
    })
    handleClose()
    onMemberAdded()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Member Details</TabsTrigger>
            <TabsTrigger value="payments" disabled={!createdMember}>
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={memberData.name}
                  onChange={(e) => setMemberData({ ...memberData, name: e.target.value })}
                  required
                  disabled={!!createdMember}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={memberData.email}
                  onChange={(e) => setMemberData({ ...memberData, email: e.target.value })}
                  disabled={!!createdMember}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={memberData.phone}
                  onChange={(e) => setMemberData({ ...memberData, phone: e.target.value })}
                  disabled={!!createdMember}
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={memberData.gender}
                  onValueChange={(value) => setMemberData({ ...memberData, gender: value })}
                  disabled={!!createdMember}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={memberData.dob}
                  onChange={(e) => setMemberData({ ...memberData, dob: e.target.value })}
                  disabled={!!createdMember}
                />
              </div>
              <div>
                <Label htmlFor="joinDate">Join Date</Label>
                <Input
                  id="joinDate"
                  type="date"
                  value={memberData.join_date}
                  onChange={(e) => setMemberData({ ...memberData, join_date: e.target.value })}
                  disabled={!!createdMember}
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Plan Selection (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="plan">Subscription Plan</Label>
                  <Select
                    value={memberData.selected_plan_id}
                    onValueChange={(value) => setMemberData({ ...memberData, selected_plan_id: value })}
                    disabled={!!createdMember}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - ${plan.price} ({plan.duration} days)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPlan && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium">{selectedPlan.name}</h4>
                    <p className="text-sm text-gray-600">{selectedPlan.description}</p>
                    <p className="text-lg font-bold text-green-600">${selectedPlan.price}</p>
                    <p className="text-sm text-gray-500">Duration: {selectedPlan.duration} days</p>
                    <p className="text-sm text-gray-500">
                      Next Payment Due: {memberData.join_date} (Payment due on join date)
                    </p>
                  </div>
                )}

                {memberData.selected_plan_id && !createdMember && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      After creating the member, you'll be able to add payment details in the Payments tab.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {!createdMember ? (
                <Button onClick={handleSubmit} disabled={isLoading} className="bg-teal-600 hover:bg-teal-700">
                  {isLoading ? "Creating..." : "Create Member"}
                </Button>
              ) : (
                <Button onClick={() => setActiveTab("payments")} className="bg-teal-600 hover:bg-teal-700">
                  Go to Payments
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            {createdMember && (
              <MemberPaymentsTab
                member={createdMember}
                onPaymentAdded={handlePaymentAdded}
                onClose={handleClose}
                isNewMember={true}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
