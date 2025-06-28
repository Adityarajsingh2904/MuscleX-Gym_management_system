"use client"

import { Fragment } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dialog, Transition } from "@headlessui/react"
import {
  X,
  Home,
  Users,
  Dumbbell,
  BarChart3,
  Settings,
  Package,
  Building,
  Receipt,
  UserCog,
  Package2,
  DollarSign,
  UserPlus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { User } from "@supabase/auth-helpers-nextjs"
import { useGym } from "@/lib/gym-context"

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname()

  const { currentGym } = useGym()
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<{ full_name?: string; role?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)

        if (user && currentGym?.id) {
          // Fetch user profile and role for the current gym
          const { data: profile } = await supabase
            .from("gym_users")
            .select("full_name, role")
            .eq("user_id", user.id)
            .eq("gym_id", currentGym.id)
            .single()

          setUserProfile(profile)
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [supabase, currentGym?.id])

  const navigationGroups = [
    {
      name: "Overview",
      items: [{ name: "Dashboard", href: "/dashboard", icon: Home }],
    },
    {
      name: "Management",
      items: [
        { name: "Members", href: "/dashboard/members", icon: Users },
        { name: "Staff", href: "/dashboard/staff", icon: UserCog },
        { name: "Franchises", href: "/dashboard/franchises", icon: Building },
        { name: "Trainer Assignments", href: "/dashboard/trainer-assignments", icon: UserPlus },
      ],
    },
    {
      name: "Operations",
      items: [
        // { name: "Check-in", href: "/dashboard/checkin", icon: UserCheck, comingSoon: true },
        // { name: "Billing", href: "/dashboard/billing", icon: CreditCard, comingSoon: true },
        { name: "Payments", href: "/dashboard/payments", icon: Receipt },
        // { name: "Scheduling", href: "/dashboard/scheduling", icon: Calendar, comingSoon: true },
        { name: "Packages", href: "/dashboard/packages", icon: Package },
        // { name: "POS & Inventory", href: "/dashboard/pos", icon: Store, comingSoon: true },
      ],
    },
    {
      name: "Assets & Finance",
      items: [
        { name: "Inventory", href: "/dashboard/inventory", icon: Package2 },
        { name: "Expenses", href: "/dashboard/expenses", icon: DollarSign },
      ],
    },
    {
      name: "Analytics & Security",
      items: [
        { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
        // { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
        // { name: "Access Control", href: "/dashboard/access", icon: Shield, comingSoon: true },
      ],
    },
    {
      name: "Support",
      items: [
        // { name: "Knowledge Base", href: "/dashboard/knowledge-base", icon: HelpCircle },
        { name: "Settings", href: "/dashboard/settings", icon: Settings },
      ],
    },
  ]

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-4 lg:px-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <Dumbbell className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 hidden sm:block">Fit Flow</span>
        </div>
      </div>

      {/* Navigation with groups */}
      <nav className="flex-1 px-2 lg:px-4 py-4 lg:py-6 space-y-4 lg:space-y-6 overflow-y-auto">
        {navigationGroups.map((group) => (
          <div key={group.name}>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 lg:mb-3 hidden lg:block">
              {group.name}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href
                const isDisabled = item.comingSoon

                return (
                  <div key={item.name} className="relative">
                    {isDisabled ? (
                      <div
                        className={cn(
                          "group flex items-center px-2 lg:px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 cursor-not-allowed opacity-60",
                          "text-gray-400",
                        )}
                      >
                        <item.icon className="mr-2 lg:mr-3 h-5 w-5 text-gray-300 flex-shrink-0" />
                        <span className="flex-1 hidden lg:block">{item.name}</span>
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium hidden lg:block">
                          Coming Soon
                        </span>
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)} // Close mobile sidebar on navigation
                        className={cn(
                          "group flex items-center px-2 lg:px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200",
                          isActive
                            ? "bg-teal-50 text-teal-700 shadow-sm"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "mr-2 lg:mr-3 h-5 w-5 transition-colors flex-shrink-0",
                            isActive ? "text-teal-600" : "text-gray-400 group-hover:text-gray-500",
                          )}
                        />
                        <span className="hidden lg:block">{item.name}</span>
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
    </div>
  )

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setOpen(false)}>
                      <span className="sr-only">Close sidebar</span>
                      <X className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white">
                  <SidebarContent />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200">
          <SidebarContent />
        </div>
      </div>
    </>
  )
}
