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
import { getPaymentMethods, createPayment, updateMember, getMemberPayments } from "@/lib/supabase-queries"
import type { Member, Plan, PaymentMethod, Payment } from "@/types/database"
import { Calendar, DollarSign } from "lucide-react"
import { formatCurrency, getCurrencySymbol } from "@/lib/currency"

interface MarkPaymentDoneModalProps {
  open: boolean
  onClose: () => void
  onPaymentMarked: () => void
  member: Member
  activePlan: Plan
}

export function MarkPaymentDoneModal({
  open,
  onClose,
  onPaymentMarked,
  member,
  activePlan,
}: MarkPaymentDoneModalProps) {
  const { currentSubaccountId } = useGymContext()
  const { toast } = useToast()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [lastPayment, setLastPayment] = useState<Payment | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [paymentData, setPaymentData] = useState({
    amount: "",
    discount: "0",
    final_amount: "",
    payment_method_id: "",
    notes: "",
  })

  useEffect(() => {
    if (open && currentSubaccountId) {
      loadData()
    }
  }, [open, currentSubaccountId])

  const loadData = async () => {
    try {
      const [paymentMethodsData, memberPayments] = await Promise.all([
        getPaymentMethods(),
        getMemberPayments(member.id),
      ])

      setPaymentMethods(paymentMethodsData || [])

      // Get the last payment to prefill amount
      const lastPaymentData = memberPayments && memberPayments.length > 0 ? memberPayments[0] : null
      setLastPayment(lastPaymentData)

      // Prefill with last payment details or plan price
      if (lastPaymentData) {
        setPaymentData({
          amount: lastPaymentData.amount.toString(),
          discount: lastPaymentData.discount.toString(),
          final_amount: lastPaymentData.final_amount.toString(),
          payment_method_id: lastPaymentData.payment_method_id,
          notes: lastPaymentData.notes || "",
        })
      } else {
        setPaymentData({
          amount: activePlan.price.toString(),
          discount: "0",
          final_amount: activePlan.price.toString(),
          payment_method_id: "",
          notes: "",
        })
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load payment data",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async () => {
    if (!paymentData.amount || !paymentData.payment_method_id || !currentSubaccountId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      const paymentAmount = Number.parseFloat(paymentData.amount)
      const paymentDiscount = Number.parseFloat(paymentData.discount || "0")
      const paymentFinalAmount = Number.parseFloat(paymentData.final_amount)
      const today = new Date()

      // Create the payment
      await createPayment(
        {
          member_id: member.id,
          plan_id: member.active_plan,
          amount: paymentAmount,
          discount: paymentDiscount,
          final_amount: paymentFinalAmount,
          payment_method_id: paymentData.payment_method_id,
          notes: paymentData.notes || "Payment marked as done",
          paid_at: today.toISOString(),
        },
        currentSubaccountId,
      )

      // Calculate next payment date: current due date + plan duration
      const currentDueDate = member.next_payment ? new Date(member.next_payment) : new Date()
      const nextPaymentDate = new Date(currentDueDate)
      nextPaymentDate.setDate(nextPaymentDate.getDate() + activePlan.duration)

      // Update member's payment dates
      await updateMember(member.id, {
        ...member,
        last_payment: today.toISOString().split("T")[0],
        next_payment: nextPaymentDate.toISOString().split("T")[0],
      })

      toast({
        title: "Success",
        description: `Payment marked as done. Next payment due: ${nextPaymentDate.toLocaleDateString()}`,
      })

      onPaymentMarked()
      onClose()
    } catch (error) {
      console.error("Error marking payment as done:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark payment as done",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate the new next payment date for preview
  const currentDueDate = member.next_payment ? new Date(member.next_payment) : new Date()
  const newNextPaymentDate = new Date(currentDueDate)
  newNextPaymentDate.setDate(newNextPaymentDate.getDate() + activePlan.duration)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Payment as Done</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>{activePlan.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Member:</span>
                <span className="font-medium">{member.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Plan Duration:</span>
                <span className="font-medium">{activePlan.duration} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Due Date:</span>
                <span className="font-medium text-orange-600">
                  {currentDueDate ? currentDueDate.toLocaleDateString() : "No Date"}
                </span>
              </div>
              {lastPayment && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Payment:</span>
                  <span className="font-medium text-green-600">{formatCurrency(lastPayment.final_amount)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Details Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Payment Amount ({getCurrencySymbol()}) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => {
                    const amount = e.target.value
                    const discount = paymentData.discount || "0"
                    const finalAmount = (Number.parseFloat(amount) - Number.parseFloat(discount)).toString()
                    setPaymentData({
                      ...paymentData,
                      amount,
                      final_amount: finalAmount,
                    })
                  }}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="discount">Discount ({getCurrencySymbol()})</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  value={paymentData.discount}
                  onChange={(e) => {
                    const discount = e.target.value
                    const amount = paymentData.amount
                    const finalAmount = (Number.parseFloat(amount) - Number.parseFloat(discount)).toString()
                    setPaymentData({
                      ...paymentData,
                      discount,
                      final_amount: finalAmount,
                    })
                  }}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="finalAmount">Final Amount ({getCurrencySymbol()}) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="finalAmount"
                  type="number"
                  step="0.01"
                  value={paymentData.final_amount}
                  onChange={(e) => setPaymentData({ ...paymentData, final_amount: e.target.value })}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method *</Label>
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
                placeholder="Payment notes (optional)..."
                rows={3}
              />
            </div>
          </div>

          {/* Payment Preview */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">Payment Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Payment Date:</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span>{formatCurrency(paymentData.amount || "0")}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span className="font-medium text-red-600">-{formatCurrency(paymentData.discount || "0")}</span>
              </div>
              <div className="flex justify-between">
                <span>Final Amount:</span>
                <span className="font-medium text-green-600">{formatCurrency(paymentData.final_amount || "0")}</span>
              </div>
              <div className="flex justify-between">
                <span>New Next Payment Due:</span>
                <span className="font-medium text-blue-600">{newNextPaymentDate.toLocaleDateString()}</span>
              </div>
              <div className="text-xs text-gray-600 mt-2">
                Calculated as: Current due date + {activePlan.duration} days
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !paymentData.amount || !paymentData.payment_method_id}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? "Processing..." : "Mark as Done"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
