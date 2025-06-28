"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getCurrencySymbol } from "@/lib/currency"
import { useGymContext } from "@/lib/gym-context"
import { supabase } from "@/lib/supabase-queries"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Package name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  price: z.string().refine(
    (value) => {
      const num = Number(value)
      return !isNaN(num) && num > 0
    },
    {
      message: "Price must be a valid number greater than 0.",
    },
  ),
  duration: z.string().refine(
    (value) => {
      const num = Number(value)
      return !isNaN(num) && num > 0
    },
    {
      message: "Duration must be a valid number greater than 0.",
    },
  ),
  type: z.enum(["basic", "standard", "premium"]),
})

interface CreatePlanModalProps {
  open: boolean
  onClose: () => void
  onPlanCreated?: () => void
}

export function CreatePlanModal({ open, onClose, onPlanCreated }: CreatePlanModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { currentSubaccountId } = useGymContext()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      duration: "30", // Default to 30 days
      type: "basic",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentSubaccountId) {
      toast.error("No franchise selected")
      return
    }

    try {
      setIsSubmitting(true)
      console.log("Creating plan with values:", values)

      const { data, error } = await supabase
        .from("plans")
        .insert({
          subaccount_id: currentSubaccountId,
          name: values.name,
          description: values.description,
          price: Number.parseFloat(values.price),
          duration: Number.parseInt(values.duration),
          is_active: true,
          metadata: { type: values.type },
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating plan:", error)
        toast.error("Failed to create plan: " + error.message)
        return
      }

      toast.success("Plan created successfully!")

      // Call the onPlanCreated callback if provided
      if (onPlanCreated) {
        onPlanCreated()
      } else {
        router.refresh()
      }

      onClose()
      form.reset()
    } catch (error) {
      console.error("Error creating plan:", error)
      toast.error("Something went wrong!")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create new plan</AlertDialogTitle>
          <AlertDialogDescription>Create a new plan to offer to your customers.</AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Plan name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe plan benefits" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="price">Price ({getCurrencySymbol()}) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="duration">Duration (days) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="30" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create"}
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
