"use client"

import type React from "react"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { NotificationPanel } from "@/components/notifications/notification-panel"
import { GymProvider } from "@/lib/gym-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false)

  return (
    <GymProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

        <div className="lg:pl-72">
          <Header setSidebarOpen={setSidebarOpen} onNotificationClick={() => setNotificationPanelOpen(true)} />

          <main className="py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>

        <NotificationPanel open={notificationPanelOpen} setOpen={setNotificationPanelOpen} />
      </div>
    </GymProvider>
  )
}
