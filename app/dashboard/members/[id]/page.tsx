"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useGymContext } from "@/lib/gym-context"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, User, Calendar, Phone, Mail, CreditCard, Clock, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import type { Member, Payment } from "@/types/database"

interface TrainerAssignment {
  id: string
  trainer_id: string
  member_id: string
  assigned_at: string
  notes?: string
  is_active: boolean
  trainer_name?: string
  trainer_email?: string
}

export default function MemberDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { currentSubaccountId } = useGymContext()
  const [member, setMember] = useState<Member | null>(null)
  const [trainerAssignment, setTrainerAssignment] = useState<TrainerAssignment | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (currentSubaccountId && params.id) {
      loadMemberDetails()
    }
  }, [currentSubaccountId, params.id])

  const loadMemberDetails = async () => {
    try {
      setIsLoading(true)
      const memberId = params.id as string

      // Fetch member details
      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select(`
          *,
          plan:plans(*)
        `)
        .eq("id", memberId)
        .single()

      if (memberError) throw memberError

      // Fetch trainer assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("trainer_assignments")
        .select(`
          *
        `)
        .eq("member_id", memberId)
        .eq("is_active", true)
        .order("assigned_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (assignmentError && assignmentError.code !== "PGRST116") {
        throw assignmentError
      }

      // If there's an assignment, fetch trainer details
      let trainerDetails = null
      if (assignmentData) {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, name, email")
          .eq("id", assignmentData.trainer_id)
          .single()

        if (userError) {
          console.error("Error fetching trainer details:", userError)
        } else {
          trainerDetails = {
            ...assignmentData,
            trainer_name: userData.name,
            trainer_email: userData.email,
          }
        }
      }

      // Fetch payment history
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .select(`
          *,
          plan:plans(*),
          payment_method:payment_methods(*)
        `)
        .eq("member_id", memberId)
        .order("paid_at", { ascending: false })

      if (paymentError) throw paymentError

      setMember(memberData)
      setTrainerAssignment(trainerDetails)
      setPayments(paymentData || [])
    } catch (error) {
      console.error("Error loading member details:", error)
      toast({
        title: "Error",
        description: "Failed to load member details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Loading Member Details...</h1>
        </div>
        <div className="grid gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Member Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <p>
              The requested member could not be found. They may have been deleted or you may not have permission to view
              them.
            </p>
            <Button onClick={() => router.push("/dashboard/members")} className="mt-4">
              Return to Members List
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const nextPayment = member.next_payment ? new Date(member.next_payment) : null
  const isNextPaymentOverdue = nextPayment ? nextPayment < new Date() : false

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">{member.name}</h1>
        <Badge variant={member.is_active ? "default" : "secondary"} className="ml-4">
          {member.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Member Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                    <p className="text-base font-medium flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      {member.name}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="text-base font-medium flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {member.email || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                    <p className="text-base font-medium flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {member.phone || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Gender</h3>
                    <p className="text-base font-medium">{member.gender || "Not specified"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Date of Birth</h3>
                    <p className="text-base font-medium flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {member.dob ? format(new Date(member.dob), "PPP") : "Not provided"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Join Date</h3>
                    <p className="text-base font-medium flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {format(new Date(member.join_date), "PPP")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Membership & Plan Card */}
          <Card>
            <CardHeader>
              <CardTitle>Membership & Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Current Plan</h3>
                    <p className="text-base font-medium">
                      {member.plan ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {member.plan.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-500">
                          No Plan
                        </Badge>
                      )}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Plan Details</h3>
                    <p className="text-base">
                      {member.plan ? (
                        <>
                          {member.plan.description || "No description"}
                          <br />
                          <span className="font-medium">{formatCurrency(member.plan.price)}</span> /{" "}
                          {member.plan.duration} days
                        </>
                      ) : (
                        "No active plan"
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Last Payment</h3>
                    <p className="text-base font-medium flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                      {member.last_payment ? format(new Date(member.last_payment), "PPP") : "No payment recorded"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Next Payment</h3>
                    <div className="flex items-center">
                      <Clock className={`h-4 w-4 mr-2 ${isNextPaymentOverdue ? "text-red-500" : "text-orange-500"}`} />
                      <p
                        className={`text-base font-medium ${isNextPaymentOverdue ? "text-red-600" : "text-orange-600"}`}
                      >
                        {nextPayment ? format(nextPayment, "PPP") : "No upcoming payment"}
                      </p>
                      {isNextPaymentOverdue && (
                        <Badge variant="destructive" className="ml-2">
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Trainer Card */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Trainer</CardTitle>
            </CardHeader>
            <CardContent>
              {trainerAssignment ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">{trainerAssignment.trainer_name}</h3>
                      <p className="text-sm text-gray-500">{trainerAssignment.trainer_email}</p>
                    </div>
                    <Badge className="ml-auto" variant={trainerAssignment.is_active ? "default" : "secondary"}>
                      {trainerAssignment.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Assigned On</h3>
                    <p className="text-base">{format(new Date(trainerAssignment.assigned_at), "PPP")}</p>
                  </div>

                  {trainerAssignment.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                      <p className="text-base">{trainerAssignment.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No Trainer Assigned</h3>
                  <p className="text-sm text-gray-500 mt-1">This member doesn't have a trainer assigned yet.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push("/dashboard/trainer-assignments")}
                  >
                    Assign Trainer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          {/* Recent Payments Card */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Plan</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Method</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{format(new Date(payment.paid_at), "PPP")}</td>
                          <td className="py-3 px-4 font-medium">{formatCurrency(payment.final_amount)}</td>
                          <td className="py-3 px-4">{payment.plan ? payment.plan.name : "One-time payment"}</td>
                          <td className="py-3 px-4">
                            {payment.payment_method ? payment.payment_method.name : "Not specified"}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                              <span>Completed</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <CreditCard className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No Payment History</h3>
                  <p className="text-sm text-gray-500 mt-1">This member hasn't made any payments yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Payment Card */}
          <Card>
            <CardHeader>
              <CardTitle>Next Payment</CardTitle>
            </CardHeader>
            <CardContent>
              {nextPayment ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">{formatCurrency(member.plan?.price || 0)}</h3>
                      <p className="text-sm text-gray-500">Due on {format(nextPayment, "PPP")}</p>
                    </div>
                    <Badge
                      variant={isNextPaymentOverdue ? "destructive" : "outline"}
                      className={isNextPaymentOverdue ? "" : "bg-orange-50 text-orange-700 border-orange-200"}
                    >
                      {isNextPaymentOverdue ? "Overdue" : "Upcoming"}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Plan</p>
                      <p className="font-medium">{member.plan?.name || "No plan"}</p>
                    </div>
                    <Button onClick={() => router.push("/dashboard/payments")}>Record Payment</Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No Upcoming Payment</h3>
                  <p className="text-sm text-gray-500 mt-1">This member doesn't have any scheduled payments.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
