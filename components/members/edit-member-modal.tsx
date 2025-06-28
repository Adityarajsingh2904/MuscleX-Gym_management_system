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
import { getPlans, updateMember } from "@/lib/supabase-queries"
import { MemberPaymentsTab } from "./member-payments-tab"
import type { Member, Plan } from "@/types/database"

interface EditMemberModalProps {
  open: boolean
  onClose: () => void
  onMemberUpdated: () => void
  member: Member | null
  initialTab?: string // Add this prop
}

export function EditMemberModal({
  open,
  onClose,
  onMemberUpdated,
  member,
  initialTab = "details",
}: EditMemberModalProps) {
  const { currentSubaccountId } = useGymContext()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("details")
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [memberData, setMemberData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    join_date: "",
    is_active: true,
    selected_plan_id: "",
  })

  useEffect(() => {
    if (open && currentSubaccountId) {
      loadPlans()
      setActiveTab(initialTab) // Use the prop instead of hardcoded "details"

      if (member) {
        setMemberData({
          name: member.name || "",
          email: member.email || "",
          phone: member.phone || "",
          gender: member.gender || "",
          dob: member.dob || "",
          join_date: member.join_date || new Date().toISOString().split("T")[0],
          is_active: member.is_active,
          selected_plan_id: member.active_plan || "",
        })
      }
    }
  }, [open, currentSubaccountId, member, initialTab]) // Add initialTab to dependencies

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
    if (!memberData.name || !currentSubaccountId || !member) {
      toast({
        title: "Error",
        description: "Please fill in the required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      const updatePayload = {
        name: memberData.name,
        email: memberData.email || null,
        phone: memberData.phone || null,
        gender: memberData.gender || null,
        dob: memberData.dob || null,
        join_date: memberData.join_date,
        is_active: memberData.is_active,
        active_plan: memberData.selected_plan_id || null,
        next_payment: selectedPlan ? calculateNextPaymentDate(memberData.join_date, selectedPlan.duration) : null,
      }

      await updateMember(member.id, updatePayload)

      toast({
        title: "Success",
        description: "Member updated successfully",
      })

      onMemberUpdated()
    } catch (error) {
      console.error("Error updating member:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update member",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentAdded = () => {
    toast({
      title: "Success",
      description: "Payment added successfully",
    })
    onMemberUpdated()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Member - {member?.name}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Member Details</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
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
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={memberData.email}
                  onChange={(e) => setMemberData({ ...memberData, email: e.target.value })}
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
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={memberData.gender}
                  onValueChange={(value) => setMemberData({ ...memberData, gender: value })}
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
                />
              </div>
              <div>
                <Label htmlFor="joinDate">Join Date</Label>
                <Input
                  id="joinDate"
                  type="date"
                  value={memberData.join_date}
                  onChange={(e) => setMemberData({ ...memberData, join_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={memberData.is_active}
                onChange={(e) => setMemberData({ ...memberData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active Member
              </Label>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Plan Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="plan">Subscription Plan</Label>
                  <Select
                    value={memberData.selected_plan_id}
                    onValueChange={(value) => setMemberData({ ...memberData, selected_plan_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_plan">No Plan</SelectItem>
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
                      Next Payment Due: {calculateNextPaymentDate(memberData.join_date, selectedPlan.duration)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading} className="bg-teal-600 hover:bg-teal-700">
                {isLoading ? "Updating..." : "Update Member"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            {member && <MemberPaymentsTab member={member} onPaymentAdded={handlePaymentAdded} isNewMember={false} />}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
