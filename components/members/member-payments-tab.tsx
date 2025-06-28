"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useGymContext } from "@/lib/gym-context"
import { getMemberPayments, getPlans, createPayment, updateMember } from "@/lib/supabase-queries"
import { AddPaymentModal } from "../payments/add-payment-modal"
import type { Member, Payment, Plan } from "@/types/database"
import { Plus, Calendar, CreditCard, DollarSign, CheckCircle } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { formatCurrency } from "@/lib/currency"

interface MemberPaymentsTabProps {
  member: Member
  onPaymentAdded: () => void
  onClose?: () => void
  isNewMember?: boolean
}

export function MemberPaymentsTab({ member, onPaymentAdded, onClose, isNewMember = false }: MemberPaymentsTabProps) {
  const { currentSubaccountId } = useGymContext()
  const { toast } = useToast()
  const [payments, setPayments] = useState<Payment[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingDone, setIsMarkingDone] = useState(false)

  useEffect(() => {
    if (member && currentSubaccountId) {
      loadData()
    }
  }, [member, currentSubaccountId])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [paymentsData, plansData] = await Promise.all([
        getMemberPayments(member.id),
        getPlans(currentSubaccountId!),
      ])
      setPayments(paymentsData || [])
      setPlans(plansData || [])
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load payment data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentAdded = () => {
    loadData()
    setShowAddPaymentModal(false)
    onPaymentAdded()
  }

  const handleMarkAsDone = async () => {
    if (!currentSubaccountId) return

    try {
      setIsMarkingDone(true)

      // Get the last payment to copy details
      const lastPayment = payments[0] // Assuming payments are ordered by date desc
      const activePlan = plans.find((p) => p.id === member.active_plan)

      if (!activePlan) {
        toast({
          title: "Error",
          description: "No active plan found for this member",
          variant: "destructive",
        })
        return
      }

      const today = new Date()

      // Use last payment details or plan defaults
      const paymentDetails = lastPayment
        ? {
            amount: lastPayment.amount,
            discount: lastPayment.discount,
            final_amount: lastPayment.final_amount,
            payment_method_id: lastPayment.payment_method_id,
            notes: lastPayment.notes || "Payment marked as done",
          }
        : {
            amount: activePlan.price,
            discount: 0,
            final_amount: activePlan.price,
            payment_method_id: null, // Will need to handle this case
            notes: "Payment marked as done",
          }

      // Create the payment
      await createPayment(
        {
          member_id: member.id,
          plan_id: member.active_plan,
          ...paymentDetails,
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

      // Refresh data and notify parent
      loadData()
      onPaymentAdded()
    } catch (error) {
      console.error("Error marking payment as done:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark payment as done",
        variant: "destructive",
      })
    } finally {
      setIsMarkingDone(false)
    }
  }

  const activePlan = plans.find((p) => p.id === member.active_plan)
  const totalPaid = payments.reduce((sum, payment) => sum + payment.final_amount, 0)
  const lastPayment = payments[0] // Assuming payments are ordered by date desc

  const columns = [
    {
      header: "Date",
      accessorKey: "paid_at",
      cell: ({ row }: any) => new Date(row.original.paid_at).toLocaleDateString(),
    },
    {
      header: "Plan",
      accessorKey: "plan",
      cell: ({ row }: any) => <Badge variant="outline">{row.original.plan?.name || "No Plan"}</Badge>,
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: ({ row }: any) => <span className="font-medium">{formatCurrency(row.original.amount)}</span>,
    },
    {
      header: "Discount",
      accessorKey: "discount",
      cell: ({ row }: any) => <span className="text-red-600">-{formatCurrency(row.original.discount)}</span>,
    },
    {
      header: "Final Amount",
      accessorKey: "final_amount",
      cell: ({ row }: any) => (
        <span className="font-medium text-green-600">{formatCurrency(row.original.final_amount)}</span>
      ),
    },
    {
      header: "Payment Method",
      accessorKey: "payment_method",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <CreditCard className="h-4 w-4" />
          <span className="capitalize">{row.original.payment_method?.name || "Unknown"}</span>
        </div>
      ),
    },
    {
      header: "Notes",
      accessorKey: "notes",
      cell: ({ row }: any) => <span className="text-sm text-gray-600">{row.original.notes || "No notes"}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Member Payment Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Plan</p>
                <p className="text-lg font-bold text-gray-900">{activePlan?.name || "No Plan"}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Next Payment</p>
                <p className="text-lg font-bold text-gray-900">
                  {member.next_payment ? new Date(member.next_payment).toLocaleDateString() : "No Date"}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Payment Actions - Only show for existing members who have made payments */}
      {!isNewMember && member.active_plan && member.next_payment && activePlan && payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Next Payment Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
              <div>
                <p className="font-medium">
                  {activePlan.name} - {formatCurrency(lastPayment?.final_amount || activePlan.price)} due on{" "}
                  {new Date(member.next_payment).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  {lastPayment
                    ? `Will use last payment details: ${formatCurrency(lastPayment.final_amount)} via ${lastPayment.payment_method?.name}`
                    : "Will use plan price as no previous payment found"}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleMarkAsDone} disabled={isMarkingDone} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isMarkingDone ? "Processing..." : "Mark as Done"}
                </Button>
                <Button onClick={() => setShowAddPaymentModal(true)} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Custom Payment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Payment History ({payments.length})</h3>
        <Button onClick={() => setShowAddPaymentModal(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Payment
        </Button>
      </div>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          {payments.length > 0 ? (
            <DataTable columns={columns} data={payments} searchKey="plan" />
          ) : (
            <div className="p-8 text-center text-gray-500">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium">No payments recorded</p>
              <p className="text-sm">Add the first payment to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Modals */}
      <AddPaymentModal
        open={showAddPaymentModal}
        onClose={() => setShowAddPaymentModal(false)}
        onPaymentAdded={handlePaymentAdded}
        preselectedMember={member}
      />
    </div>
  )
}
