"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useGymContext } from "@/lib/gym-context"
import { getMembers, getPlans, getPaymentMethods, createPayment, updateMember } from "@/lib/supabase-queries"
import type { Member, Plan, PaymentMethod } from "@/types/database"
import { formatCurrency, getCurrencySymbol } from "@/lib/currency"

interface AddPaymentModalProps {
  open: boolean
  onClose: () => void
  onPaymentAdded: () => void
  preselectedMember?: Member | null
}

export function AddPaymentModal({ open, onClose, onPaymentAdded, preselectedMember }: AddPaymentModalProps) {
  const { currentSubaccountId } = useGymContext()
  const { toast } = useToast()
  const [members, setMembers] = useState<Member[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [discountType, setDiscountType] = useState<"percentage" | "amount">("percentage")

  const [paymentData, setPaymentData] = useState({
    member_id: "",
    plan_id: "",
    base_amount: "",
    discount_percentage: "0",
    discount_amount: "0",
    final_amount: "",
    payment_method_id: "",
    notes: "",
  })

  useEffect(() => {
    if (open && currentSubaccountId) {
      loadData()
      if (preselectedMember) {
        setPaymentData((prev) => ({
          ...prev,
          member_id: preselectedMember.id,
          plan_id: preselectedMember.active_plan || "",
        }))
      }
    }
  }, [open, currentSubaccountId, preselectedMember])

  const loadData = async () => {
    try {
      const [membersData, plansData, paymentMethodsData] = await Promise.all([
        getMembers(currentSubaccountId!),
        getPlans(currentSubaccountId!),
        getPaymentMethods(),
      ])
      setMembers(membersData || [])
      setPlans(plansData || [])
      setPaymentMethods(paymentMethodsData || [])
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    }
  }

  const selectedPlan = plans.find((p) => p.id === paymentData.plan_id)
  const selectedMember = members.find((m) => m.id === paymentData.member_id)

  // Calculate amounts based on discount type
  useEffect(() => {
    if (selectedPlan) {
      const baseAmount = selectedPlan.price
      setPaymentData((prev) => ({ ...prev, base_amount: baseAmount.toString() }))

      if (discountType === "percentage") {
        const discountPercent = Number.parseFloat(paymentData.discount_percentage || "0")
        const discountAmount = (baseAmount * discountPercent) / 100
        const finalAmount = baseAmount - discountAmount
        setPaymentData((prev) => ({
          ...prev,
          discount_amount: discountAmount.toFixed(2),
          final_amount: finalAmount.toFixed(2),
        }))
      } else {
        const discountAmount = Number.parseFloat(paymentData.discount_amount || "0")
        const finalAmount = baseAmount - discountAmount
        const discountPercent = baseAmount > 0 ? (discountAmount / baseAmount) * 100 : 0
        setPaymentData((prev) => ({
          ...prev,
          discount_percentage: discountPercent.toFixed(2),
          final_amount: Math.max(0, finalAmount).toFixed(2),
        }))
      }
    }
  }, [selectedPlan, paymentData.discount_percentage, paymentData.discount_amount, discountType])

  const handleSubmit = async () => {
    if (!paymentData.member_id || !paymentData.final_amount || !currentSubaccountId) {
      toast({
        title: "Error",
        description: "Please fill in the required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // Create the payment
      await createPayment(
        {
          member_id: paymentData.member_id,
          plan_id: paymentData.plan_id || null,
          amount: Number.parseFloat(paymentData.base_amount || "0"),
          discount: Number.parseFloat(paymentData.discount_amount || "0"),
          final_amount: Number.parseFloat(paymentData.final_amount),
          payment_method_id: paymentData.payment_method_id || null,
          notes: paymentData.notes,
        },
        currentSubaccountId,
      )

      // Handle custom payment case: If a plan was selected and it's different from member's current plan
      // OR if member doesn't have a current plan, update the next payment date based on selected plan
      if (paymentData.plan_id && selectedPlan && selectedMember) {
        const currentNextPayment = selectedMember.next_payment ? new Date(selectedMember.next_payment) : new Date()
        const newNextPayment = new Date(currentNextPayment)
        newNextPayment.setDate(newNextPayment.getDate() + selectedPlan.duration)

        // Update member with new payment info
        await updateMember(paymentData.member_id, {
          ...selectedMember,
          active_plan: paymentData.plan_id, // Update active plan to the selected plan
          last_payment: new Date().toISOString().split("T")[0],
          next_payment: newNextPayment.toISOString().split("T")[0],
        })

        toast({
          title: "Success",
          description: `Payment recorded successfully. Next payment due: ${newNextPayment.toLocaleDateString()}`,
        })
      } else {
        toast({
          title: "Success",
          description: "Payment recorded successfully",
        })
      }

      // Reset form
      setPaymentData({
        member_id: "",
        plan_id: "",
        base_amount: "",
        discount_percentage: "0",
        discount_amount: "0",
        final_amount: "",
        payment_method_id: "",
        notes: "",
      })

      onPaymentAdded()
      onClose()
    } catch (error) {
      console.error("Error creating payment:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record payment",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlanChange = (planId: string) => {
    setPaymentData((prev) => ({ ...prev, plan_id: planId }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="member">Member *</Label>
              <Select
                value={paymentData.member_id}
                onValueChange={(value) => setPaymentData({ ...paymentData, member_id: value })}
                disabled={!!preselectedMember}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} {member.email && `(${member.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="plan">Plan (Optional)</Label>
              <Select value={paymentData.plan_id} onValueChange={handlePlanChange}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedMember?.plan?.name || "Select plan"} />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ${plan.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedPlan && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{selectedPlan.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">{selectedPlan.description}</p>
                <div className="flex justify-between items-center">
                  <span>Base Price:</span>
                  <span className="font-bold text-green-600">{formatCurrency(selectedPlan.price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Duration:</span>
                  <span>{selectedPlan.duration} days</span>
                </div>
                {selectedMember && selectedMember.next_payment && (
                  <div className="mt-2 p-2 bg-blue-50 rounded">
                    <p className="text-sm text-blue-700">
                      <strong>Next payment will be:</strong>{" "}
                      {new Date(
                        new Date(selectedMember.next_payment).getTime() + selectedPlan.duration * 24 * 60 * 60 * 1000,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount">Payment Amount ({getCurrencySymbol()}) *</Label>
                <Input
                  id="baseAmount"
                  type="number"
                  step="0.01"
                  value={paymentData.base_amount}
                  onChange={(e) => setPaymentData({ ...paymentData, base_amount: e.target.value })}
                  disabled={!!selectedPlan}
                />
              </div>

              <div className="space-y-3">
                <Label>Discount Type</Label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={discountType === "percentage"}
                      onChange={() => setDiscountType("percentage")}
                      className="text-teal-600"
                    />
                    <span>Percentage</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={discountType === "amount"}
                      onChange={() => setDiscountType("amount")}
                      className="text-teal-600"
                    />
                    <span>Fixed Amount</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount">Discount ({getCurrencySymbol()})</Label>
                  <Input
                    id="discount"
                    type="number"
                    step={discountType === "percentage" ? "0.1" : "0.01"}
                    value={
                      discountType === "percentage" ? paymentData.discount_percentage : paymentData.discount_amount
                    }
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        [discountType === "percentage" ? "discount_percentage" : "discount_amount"]: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="finalAmount">Final Amount ({getCurrencySymbol()}) *</Label>
                  <Input
                    id="finalAmount"
                    type="number"
                    step="0.01"
                    value={paymentData.final_amount}
                    onChange={(e) => setPaymentData({ ...paymentData, final_amount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={paymentData.payment_method_id}
                  onValueChange={(value) => setPaymentData({ ...paymentData, payment_method_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  placeholder="Any additional notes..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Base Amount:</span>
                <span>{formatCurrency(paymentData.base_amount || "0")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Discount:</span>
                <span className="text-red-600">-{formatCurrency(paymentData.discount_amount || "0")}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Final Amount:</span>
                <span className="text-green-600">{formatCurrency(paymentData.final_amount || "0")}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="bg-teal-600 hover:bg-teal-700">
              {isLoading ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
