import { useGymContext } from "@/lib/gym-context"

export function useCurrency() {
  const { currentCurrency, formatAmount, getCurrencySymbol } = useGymContext()

  return {
    currency: currentCurrency,
    formatAmount,
    getCurrencySymbol,
    symbol: currentCurrency.symbol,
    code: currentCurrency.code,
    name: currentCurrency.name,
  }
}
