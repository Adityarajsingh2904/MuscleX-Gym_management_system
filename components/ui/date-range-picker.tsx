"use client"

import * as React from "react"
import { addDays, format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { CalendarIcon, X } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerWithRangeProps {
  date: DateRange
  onDateChange: (date: DateRange) => void
  className?: string
}

export function DatePickerWithRange({ date, onDateChange, className }: DatePickerWithRangeProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [tempDateRange, setTempDateRange] = React.useState<DateRange>(date)
  const [selectedPreset, setSelectedPreset] = React.useState<string>("")

  // Update temp range when external date changes
  React.useEffect(() => {
    setTempDateRange(date)
  }, [date])

  // Presets with better naming and more options
  const presets = [
    {
      id: "today",
      name: "Today",
      dateRange: {
        from: new Date(),
        to: new Date(),
      },
    },
    {
      id: "yesterday",
      name: "Yesterday",
      dateRange: {
        from: addDays(new Date(), -1),
        to: addDays(new Date(), -1),
      },
    },
    {
      id: "last-7-days",
      name: "Last 7 days",
      dateRange: {
        from: addDays(new Date(), -6),
        to: new Date(),
      },
    },
    {
      id: "last-30-days",
      name: "Last 30 days",
      dateRange: {
        from: addDays(new Date(), -29),
        to: new Date(),
      },
    },
    {
      id: "this-month",
      name: "This month",
      dateRange: {
        from: startOfMonth(new Date()),
        to: new Date(),
      },
    },
    {
      id: "last-month",
      name: "Last month",
      dateRange: {
        from: startOfMonth(addDays(new Date(), -30)),
        to: endOfMonth(addDays(new Date(), -30)),
      },
    },
    {
      id: "last-3-months",
      name: "Last 3 months",
      dateRange: {
        from: addDays(new Date(), -90),
        to: new Date(),
      },
    },
    {
      id: "last-6-months",
      name: "Last 6 months",
      dateRange: {
        from: addDays(new Date(), -180),
        to: new Date(),
      },
    },
    {
      id: "this-year",
      name: "This year",
      dateRange: {
        from: startOfYear(new Date()),
        to: new Date(),
      },
    },
    {
      id: "last-year",
      name: "Last year",
      dateRange: {
        from: startOfYear(addDays(new Date(), -365)),
        to: endOfYear(addDays(new Date(), -365)),
      },
    },
  ]

  const handlePresetClick = (preset: (typeof presets)[0]) => {
    setTempDateRange(preset.dateRange)
    setSelectedPreset(preset.id)
  }

  const handleCalendarSelect = (range: DateRange | undefined) => {
    if (range) {
      setTempDateRange(range)
      setSelectedPreset("") // Clear preset selection when using calendar
    }
  }

  const handleApply = () => {
    if (tempDateRange?.from && tempDateRange?.to) {
      onDateChange(tempDateRange)
      setIsOpen(false)
    }
  }

  const handleCancel = () => {
    setTempDateRange(date)
    setSelectedPreset("")
    setIsOpen(false)
  }

  const handleClear = () => {
    const today = new Date()
    const defaultRange = {
      from: addDays(today, -30),
      to: today,
    }
    setTempDateRange(defaultRange)
    setSelectedPreset("")
  }

  const isValidRange = tempDateRange?.from && tempDateRange?.to
  const hasChanges =
    tempDateRange?.from?.getTime() !== date?.from?.getTime() || tempDateRange?.to?.getTime() !== date?.to?.getTime()

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-[280px] justify-start text-left font-normal border-gray-300 hover:border-gray-400 transition-colors",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
            {date?.from ? (
              date.to ? (
                <span className="text-gray-900">
                  {format(date.from, "MMM d")} - {format(date.to, "MMM d, yyyy")}
                </span>
              ) : (
                format(date.from, "MMM d, yyyy")
              )
            ) : (
              <span className="text-gray-500">Select date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 shadow-xl border-0" align="start">
          <div className="bg-white rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Select dates</h3>
              <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8 w-8 p-0 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex">
              {/* Presets Sidebar */}
              <div className="w-48 border-r border-gray-100 bg-gray-50/50">
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Quick select</h4>
                  <div className="space-y-1">
                    {presets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handlePresetClick(preset)}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                          selectedPreset === preset.id
                            ? "bg-blue-100 text-blue-700 font-medium"
                            : "text-gray-700 hover:bg-gray-100",
                        )}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calendar */}
              <div className="p-4">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={tempDateRange?.from}
                  selected={tempDateRange}
                  onSelect={handleCalendarSelect}
                  numberOfMonths={2}
                  className="border-0"
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: cn(
                      "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-gray-100 rounded-md",
                    ),
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-blue-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: cn(
                      "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md transition-colors",
                    ),
                    day_selected:
                      "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
                    day_today: "bg-gray-100 text-gray-900 font-medium",
                    day_outside: "text-gray-400 opacity-50",
                    day_disabled: "text-gray-400 opacity-50",
                    day_range_middle: "aria-selected:bg-blue-100 aria-selected:text-blue-900",
                    day_hidden: "invisible",
                  }}
                />

                {/* Selected Range Display */}
                {tempDateRange?.from && tempDateRange?.to && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-700">
                      <span className="font-medium">Selected range:</span>
                      <div className="mt-1">
                        {format(tempDateRange.from, "EEEE, MMMM d, yyyy")} -{" "}
                        {format(tempDateRange.to, "EEEE, MMMM d, yyyy")}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {Math.ceil(
                          (tempDateRange.to.getTime() - tempDateRange.from.getTime()) / (1000 * 60 * 60 * 24),
                        ) + 1}{" "}
                        days
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/50">
              <Button variant="ghost" size="sm" onClick={handleClear} className="text-gray-600 hover:text-gray-900">
                Clear
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel} className="px-4">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApply}
                  disabled={!isValidRange || !hasChanges}
                  className="px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
