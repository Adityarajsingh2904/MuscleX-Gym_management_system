import { supabase } from "./supabase-queries"

export interface CurrencyInfo {
  symbol: string
  code: string
  name: string
  id?: string
}

// Global state for current account ID and currency
let globalCurrentAccountId: string | null = null
let globalCurrentCurrency: CurrencyInfo | null = null
let currencyChangeListeners: Array<(currency: CurrencyInfo) => void> = []

/**
 * Subscribe to currency changes
 * @param listener - Function to call when currency changes
 * @returns Unsubscribe function
 */
export function subscribeToCurrencyChanges(listener: (currency: CurrencyInfo) => void): () => void {
  currencyChangeListeners.push(listener)

  // Immediately call with current currency if available
  if (globalCurrentCurrency) {
    listener(globalCurrentCurrency)
  }

  return () => {
    currencyChangeListeners = currencyChangeListeners.filter((l) => l !== listener)
  }
}

/**
 * Notify all listeners of currency change
 */
function notifyCurrencyChange(currency: CurrencyInfo): void {
  globalCurrentCurrency = currency
  currencyChangeListeners.forEach((listener) => {
    try {
      listener(currency)
    } catch (error) {
      console.error("Error in currency change listener:", error)
    }
  })
}

/**
 * Set the global current account ID and fetch its currency
 * @param accountId - The current account ID
 */
export async function setGlobalAccountId(accountId: string | null): Promise<void> {
  if (globalCurrentAccountId === accountId) return

  globalCurrentAccountId = accountId

  if (accountId) {
    try {
      const currency = await getAccountCurrency(accountId)
      notifyCurrencyChange(currency)
    } catch (error) {
      console.error("Error fetching currency for account:", error)
      notifyCurrencyChange(DEFAULT_CURRENCY)
    }
  } else {
    globalCurrentCurrency = null
  }
}

/**
 * Force refresh the current account's currency (for real-time updates)
 */
export async function refreshCurrentAccountCurrency(): Promise<void> {
  if (globalCurrentAccountId) {
    // Clear cache for current account
    accountCurrencyCache.delete(globalCurrentAccountId)

    try {
      const currency = await getAccountCurrency(globalCurrentAccountId)
      notifyCurrencyChange(currency)
    } catch (error) {
      console.error("Error refreshing currency:", error)
    }
  }
}

// Default currency mapping
export const CURRENCIES: Record<string, CurrencyInfo> = {
  INR: {
    symbol: "₹",
    code: "INR",
    name: "Indian Rupee",
  },
  USD: {
    symbol: "$",
    code: "USD",
    name: "US Dollar",
  },
}

// Default to Indian Rupee
export const DEFAULT_CURRENCY: CurrencyInfo = CURRENCIES.INR

// Cache for account currencies to avoid repeated queries
const accountCurrencyCache = new Map<string, CurrencyInfo>()

/**
 * Fetch the currency for a specific account
 * @param accountId - The account ID
 * @returns The currency info for the account
 */
export async function getAccountCurrency(accountId: string): Promise<CurrencyInfo> {
  // Return from cache if available
  if (accountCurrencyCache.has(accountId)) {
    return accountCurrencyCache.get(accountId)!
  }

  try {
    // Query the accounts table to get the currency_id
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("currency_id")
      .eq("id", accountId)
      .single()

    if (accountError || !account?.currency_id) {
      console.warn("Failed to fetch account currency, using default:", accountError)
      accountCurrencyCache.set(accountId, DEFAULT_CURRENCY)
      return DEFAULT_CURRENCY
    }

    // Query the currency table to get the currency details
    const { data: currency, error: currencyError } = await supabase
      .from("currency")
      .select("*")
      .eq("id", account.currency_id)
      .single()

    if (currencyError || !currency) {
      console.warn("Failed to fetch currency details, using default:", currencyError)
      accountCurrencyCache.set(accountId, DEFAULT_CURRENCY)
      return DEFAULT_CURRENCY
    }

    const currencyInfo: CurrencyInfo = {
      id: currency.id,
      symbol: currency.symbol,
      code: currency.code,
      name: currency.name,
    }

    // Cache the result
    accountCurrencyCache.set(accountId, currencyInfo)
    return currencyInfo
  } catch (error) {
    console.error("Error fetching account currency:", error)
    accountCurrencyCache.set(accountId, DEFAULT_CURRENCY)
    return DEFAULT_CURRENCY
  }
}

/**
 * Format amount with currency symbol (uses current account's currency)
 * @param amount - The amount to format
 * @param currencyCode - Optional currency code override
 * @param showCode - Whether to show currency code alongside symbol
 */
export function formatCurrency(amount: number | string, currencyCode?: string, showCode = false): string {
  const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount

  if (isNaN(numAmount)) {
    const symbol = currencyCode ? CURRENCIES[currencyCode]?.symbol || "₹" : globalCurrentCurrency?.symbol || "₹"
    return `${symbol}0`
  }

  let currency: CurrencyInfo

  if (currencyCode) {
    currency = CURRENCIES[currencyCode] || DEFAULT_CURRENCY
  } else if (globalCurrentCurrency) {
    currency = globalCurrentCurrency
  } else {
    currency = DEFAULT_CURRENCY
  }

  // Format number with appropriate locale
  const formattedAmount =
    currency.code === "INR"
      ? numAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })
      : numAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })

  return showCode ? `${currency.symbol}${formattedAmount} ${currency.code}` : `${currency.symbol}${formattedAmount}`
}

/**
 * Get currency symbol (uses current account's currency)
 * @param currencyCode - Optional currency code override
 */
export function getCurrencySymbol(currencyCode?: string): string {
  if (currencyCode) {
    return CURRENCIES[currencyCode]?.symbol || DEFAULT_CURRENCY.symbol
  }

  return globalCurrentCurrency?.symbol || DEFAULT_CURRENCY.symbol
}

/**
 * Parse currency input (removes currency symbols and formatting)
 * @param input - The currency input string
 */
export function parseCurrency(input: string): number {
  return Number.parseFloat(input.replace(/[₹$,\s]/g, "")) || 0
}

/**
 * Clear the account currency cache
 * @param accountId - Optional account ID to clear specific cache entry
 */
export function clearCurrencyCache(accountId?: string): void {
  if (accountId) {
    accountCurrencyCache.delete(accountId)
  } else {
    accountCurrencyCache.clear()
  }
}
