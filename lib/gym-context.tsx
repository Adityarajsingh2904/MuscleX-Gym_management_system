"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import {
  formatCurrency,
  DEFAULT_CURRENCY,
  type CurrencyInfo,
  setGlobalAccountId,
  getCurrencySymbol,
  subscribeToCurrencyChanges,
  refreshCurrentAccountCurrency,
} from "./currency"

interface Account {
  id: string
  name: string
  email: string
  phone: string
  onboarding_completed?: boolean
  currency?: CurrencyInfo
}

interface Subaccount {
  id: string
  name: string
  location: string
  account_id: string
}

interface GymContextType {
  currentAccountId: string | null
  currentSubaccountId: string | null
  currentAccount: Account | null
  currentSubaccount: Subaccount | null
  setCurrentContext: (accountId: string, subaccountId: string) => void
  isLoading: boolean
  refreshData: () => void
  contextVersion: number
  currentCurrency: CurrencyInfo
  formatAmount: (amount: number | string) => string
  getCurrencySymbol: () => string
  refreshCurrency: () => Promise<void>
}

const GymContext = createContext<GymContextType | undefined>(undefined)

export function GymProvider({ children }: { children: React.ReactNode }) {
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null)
  const [currentSubaccountId, setCurrentSubaccountId] = useState<string | null>(null)
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null)
  const [currentSubaccount, setCurrentSubaccount] = useState<Subaccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [contextVersion, setContextVersion] = useState(0)
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyInfo>(DEFAULT_CURRENCY)

  // Subscribe to currency changes for real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToCurrencyChanges((currency) => {
      setCurrentCurrency(currency)
      // Force re-render of components that use currency
      setContextVersion((prev) => prev + 1)
    })

    return unsubscribe
  }, [])

  // Set global account ID when current account changes
  useEffect(() => {
    if (currentAccountId) {
      setGlobalAccountId(currentAccountId)
    }
  }, [currentAccountId])

  // Load initial data from localStorage
  useEffect(() => {
    const accountId = localStorage.getItem("current_account_id")
    const subaccountId = localStorage.getItem("current_subaccount_id")

    if (accountId && subaccountId) {
      setCurrentAccountId(accountId)
      setCurrentSubaccountId(subaccountId)

      // Set placeholder data immediately to reduce flickering
      setCurrentAccount({
        id: accountId,
        name: "Loading...",
        email: "",
        phone: "",
        currency: DEFAULT_CURRENCY,
      })
      setCurrentSubaccount({
        id: subaccountId,
        name: "Loading...",
        location: "",
        account_id: accountId,
      })
    }

    setIsLoading(false)
  }, [])

  const setCurrentContext = useCallback(
    (accountId: string, subaccountId: string) => {
      // Only update if the context actually changed
      if (currentAccountId === accountId && currentSubaccountId === subaccountId) {
        return
      }

      // Update state immediately to reduce flickering
      setCurrentAccountId(accountId)
      setCurrentSubaccountId(subaccountId)
      localStorage.setItem("current_account_id", accountId)
      localStorage.setItem("current_subaccount_id", subaccountId)

      // Set placeholder data immediately
      setCurrentAccount({
        id: accountId,
        name: "Loading...",
        email: "",
        phone: "",
        currency: DEFAULT_CURRENCY,
      })
      setCurrentSubaccount({
        id: subaccountId,
        name: "Loading...",
        location: "",
        account_id: accountId,
      })

      // Increment context version to trigger re-renders
      setContextVersion((prev) => prev + 1)
    },
    [currentAccountId, currentSubaccountId],
  )

  const refreshData = useCallback(() => {
    setContextVersion((prev) => prev + 1)
  }, [])

  const refreshCurrency = useCallback(async () => {
    await refreshCurrentAccountCurrency()
  }, [])

  const formatAmount = useCallback(
    (amount: number | string) => {
      return formatCurrency(amount)
    },
    [currentCurrency],
  )

  const getCurrencySymbolValue = useCallback(() => {
    return getCurrencySymbol()
  }, [currentCurrency])

  return (
    <GymContext.Provider
      value={{
        currentAccountId,
        currentSubaccountId,
        currentAccount,
        currentSubaccount,
        setCurrentContext,
        isLoading,
        refreshData,
        contextVersion,
        currentCurrency,
        formatAmount,
        getCurrencySymbol: getCurrencySymbolValue,
        refreshCurrency,
      }}
    >
      {children}
    </GymContext.Provider>
  )
}

export function useGymContext() {
  const context = useContext(GymContext)
  if (context === undefined) {
    throw new Error("useGymContext must be used within a GymProvider")
  }
  return context
}

// Export alias for backward compatibility
export const useGym = useGymContext
