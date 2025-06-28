"use client"

import { useState, useEffect } from "react"
import { useGymContext } from "@/lib/gym-context"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AddAssignmentModal({ open, onClose, onSuccess }) {
  const { currentSubaccountId } = useGymContext()
  const [loading, setLoading] = useState(false)
  const [trainers, setTrainers] = useState([])
  const [members, setMembers] = useState([])
  const [formData, setFormData] = useState({
    trainer_id: "",
    member_id: "",
    notes: "",
  })

  const [memberSearchOpen, setMemberSearchOpen] = useState(false)
  const [memberSearchValue, setMemberSearchValue] = useState("")
  const [memberPage, setMemberPage] = useState(1)
  const [loadingMoreMembers, setLoadingMoreMembers] = useState(false)
  const [hasMoreMembers, setHasMoreMembers] = useState(true)
  const [searchError, setSearchError] = useState(false)
  const MEMBERS_PER_PAGE = 20

  // Debug state to track search issues
  const [debugInfo, setDebugInfo] = useState({
    lastSearch: "",
    resultsCount: 0,
    searchAttempts: 0,
  })

  useEffect(() => {
    if (open && currentSubaccountId) {
      loadTrainers()
      loadInitialMembers()
      setMemberPage(1)
      setMemberSearchValue("")
      setHasMoreMembers(true)
      setSearchError(false)
      // Reset form
      setFormData({
        trainer_id: "",
        member_id: "",
        notes: "",
      })
      // Reset debug info
      setDebugInfo({
        lastSearch: "",
        resultsCount: 0,
        searchAttempts: 0,
      })
    }
  }, [open, currentSubaccountId])

  const loadInitialMembers = () => {
    setLoadingMoreMembers(true)
    loadMembers(1, "")
  }

  const loadTrainers = async () => {
    try {
      console.log("Loading trainers for subaccount:", currentSubaccountId)

      // Step 1: Get all user_accounts for this subaccount
      const { data: userAccounts, error: userAccountsError } = await supabase
        .from("user_accounts")
        .select("id, user_id, role_id")
        .eq("subaccount_id", currentSubaccountId)

      if (userAccountsError) {
        console.error("Error fetching user_accounts:", userAccountsError)
        throw userAccountsError
      }

      console.log("Found user_accounts:", userAccounts)

      if (!userAccounts || userAccounts.length === 0) {
        console.log("No user_accounts found for this subaccount")
        setTrainers([])
        return
      }

      // Step 2: Get all roles to find trainer role
      const { data: roles, error: rolesError } = await supabase.from("roles").select("id, name")

      if (rolesError) {
        console.error("Error fetching roles:", rolesError)
        throw rolesError
      }

      console.log("Found roles:", roles)

      // Step 3: Find trainer role ID
      const trainerRole = roles?.find((role) => role.name.toLowerCase() === "trainer")

      if (!trainerRole) {
        console.log("No trainer role found")
        setTrainers([])
        return
      }

      console.log("Trainer role found:", trainerRole)

      // Step 4: Filter user_accounts with trainer role
      const trainerUserAccounts = userAccounts.filter((ua) => ua.role_id === trainerRole.id)

      console.log("Trainer user_accounts:", trainerUserAccounts)

      if (trainerUserAccounts.length === 0) {
        console.log("No trainers found for this subaccount")
        setTrainers([])
        return
      }

      // Step 5: Get user details for trainers
      const userIds = trainerUserAccounts.map((ua) => ua.user_id)

      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", userIds)

      if (usersError) {
        console.error("Error fetching users:", usersError)
        throw usersError
      }

      console.log("Found users:", users)

      // Step 6: Combine data - use user.id as the trainer_id (not user_account.id)
      const trainersWithDetails = trainerUserAccounts.map((ua) => {
        const user = users?.find((u) => u.id === ua.user_id)
        return {
          id: ua.user_id, // Use user_id as the trainer_id (this references users.id)
          user_account_id: ua.id, // Keep track of user_account_id for reference
          role_id: ua.role_id,
          users: user || { name: "Unknown", email: "unknown@email.com" },
        }
      })

      console.log("Final trainers data:", trainersWithDetails)
      setTrainers(trainersWithDetails)
    } catch (error) {
      console.error("Error loading trainers:", error)
      toast({
        title: "Error",
        description: "Failed to load trainers",
        variant: "destructive",
      })
      setTrainers([])
    }
  }

  const loadMembers = async (page = 1, searchQuery = "") => {
    try {
      setSearchError(false)
      console.log(`Loading members for subaccount: ${currentSubaccountId}, page: ${page}, search: "${searchQuery}"`)

      // Update debug info
      setDebugInfo((prev) => ({
        lastSearch: searchQuery,
        resultsCount: prev.resultsCount,
        searchAttempts: prev.searchAttempts + 1,
      }))

      const isFirstPage = page === 1

      if (isFirstPage) {
        setLoadingMoreMembers(true)
        // Don't clear members here to prevent flashing
      }

      const query = supabase
        .from("members")
        .select("id, name, email")
        .eq("subaccount_id", currentSubaccountId)
        .eq("is_active", true)
        .order("name")
        .range((page - 1) * MEMBERS_PER_PAGE, page * MEMBERS_PER_PAGE - 1)

      // Fix: Use ilike with % on both sides for partial matching
      if (searchQuery && searchQuery.trim()) {
        const trimmedSearch = searchQuery.trim().toLowerCase()
        query.or(`name.ilike.%${trimmedSearch}%,email.ilike.%${trimmedSearch}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error in search query:", error)
        throw error
      }

      console.log(`Loaded ${data?.length || 0} members for page ${page}, search: "${searchQuery}"`)

      // Update debug info with results
      setDebugInfo((prev) => ({
        ...prev,
        resultsCount: data?.length || 0,
      }))

      if (isFirstPage) {
        setMembers(data || [])
      } else {
        setMembers((prev) => [...prev, ...(data || [])])
      }

      setHasMoreMembers((data?.length || 0) === MEMBERS_PER_PAGE)
    } catch (error) {
      console.error("Error loading members:", error)
      setSearchError(true)
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive",
      })
      if (page === 1) {
        setMembers([])
      }
    } finally {
      setLoadingMoreMembers(false)
    }
  }

  const loadMoreMembers = async () => {
    if (!loadingMoreMembers && hasMoreMembers) {
      const nextPage = memberPage + 1
      setMemberPage(nextPage)
      setLoadingMoreMembers(true)
      await loadMembers(nextPage, memberSearchValue)
    }
  }

  // Debounced search
  useEffect(() => {
    if (currentSubaccountId && memberSearchOpen) {
      const timeoutId = setTimeout(() => {
        console.log("Searching for:", memberSearchValue)
        loadMembers(1, memberSearchValue)
        setMemberPage(1)
      }, 300)

      return () => clearTimeout(timeoutId)
    }
  }, [memberSearchValue, currentSubaccountId, memberSearchOpen])

  // Load members when dropdown opens
  useEffect(() => {
    if (memberSearchOpen && members.length === 0 && !loadingMoreMembers) {
      loadInitialMembers()
    }
  }, [memberSearchOpen, members.length, loadingMoreMembers])

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.trainer_id) {
      toast({
        title: "Error",
        description: "Please select a trainer",
        variant: "destructive",
      })
      return
    }

    if (!formData.member_id) {
      toast({
        title: "Error",
        description: "Please select a member",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Validate that the trainer_id exists in users table
      const { data: trainerExists, error: trainerCheckError } = await supabase
        .from("users")
        .select("id")
        .eq("id", formData.trainer_id)
        .single()

      if (trainerCheckError || !trainerExists) {
        console.error("Trainer validation failed:", trainerCheckError)
        throw new Error("Selected trainer is not valid. Please refresh and try again.")
      }

      // Validate that the member_id exists in members
      const { data: memberExists, error: memberCheckError } = await supabase
        .from("members")
        .select("id")
        .eq("id", formData.member_id)
        .single()

      if (memberCheckError || !memberExists) {
        console.error("Member validation failed:", memberCheckError)
        throw new Error("Selected member is not valid. Please refresh and try again.")
      }

      // Check if this assignment already exists
      const { data: existingAssignment, error: existingError } = await supabase
        .from("trainer_assignments")
        .select("id")
        .eq("trainer_id", formData.trainer_id)
        .eq("member_id", formData.member_id)
        .eq("subaccount_id", currentSubaccountId)
        .eq("is_active", true)
        .maybeSingle()

      if (existingError) {
        console.error("Error checking existing assignment:", existingError)
      }

      if (existingAssignment) {
        throw new Error("This trainer is already assigned to this member.")
      }

      const assignmentData = {
        trainer_id: formData.trainer_id, // This now references users.id
        member_id: formData.member_id,
        subaccount_id: currentSubaccountId,
        notes: formData.notes.trim() || null,
        assigned_at: new Date().toISOString(),
        is_active: true,
      }

      console.log("Creating assignment with validated data:", assignmentData)

      const { data, error } = await supabase.from("trainer_assignments").insert(assignmentData).select().single()

      if (error) {
        console.error("Database error:", error)
        throw error
      }

      console.log("Assignment created successfully:", data)

      toast({
        title: "Success",
        description: "Trainer assignment created successfully",
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error creating assignment:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create assignment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Trainer Assignment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="trainer_id">Trainer *</Label>
            <Select value={formData.trainer_id} onValueChange={(value) => handleChange("trainer_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select trainer" />
              </SelectTrigger>
              <SelectContent>
                {trainers.map((trainer) => (
                  <SelectItem key={trainer.id} value={trainer.id}>
                    {trainer.users?.name || "Unknown Trainer"} ({trainer.users?.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {trainers.length === 0 && (
              <p className="text-sm text-gray-500">No trainers found. Please add trainers first.</p>
            )}
            <p className="text-xs text-gray-400">Selected trainer ID: {formData.trainer_id || "None"}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="member_id">Member *</Label>
            <Popover open={memberSearchOpen} onOpenChange={setMemberSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={memberSearchOpen}
                  className="w-full justify-between"
                >
                  {formData.member_id
                    ? members.find((member) => member.id === formData.member_id)?.name || "Select member"
                    : "Select member"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" sideOffset={5}>
                <div className="h-[350px] flex flex-col">
                  <div className="flex items-center border-b px-3 py-2">
                    <input
                      className="flex h-9 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Search members..."
                      value={memberSearchValue}
                      onChange={(e) => setMemberSearchValue(e.target.value)}
                    />
                    {loadingMoreMembers && <Loader2 className="h-4 w-4 animate-spin opacity-70 ml-2" />}
                  </div>

                  <div
                    className="flex-1 overflow-y-scroll overscroll-contain"
                    style={{
                      WebkitOverflowScrolling: "touch",
                      scrollbarWidth: "thin",
                      height: "calc(100% - 53px)",
                    }}
                    onWheel={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    {loadingMoreMembers ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="flex flex-col items-center">
                          <Loader2 className="h-8 w-8 animate-spin mb-2" />
                          <p className="text-sm text-gray-500">Loading members...</p>
                        </div>
                      </div>
                    ) : members.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <p className="text-sm text-gray-500">
                          {searchError
                            ? "Error loading members. Please try again."
                            : memberSearchValue
                              ? "No members match your search."
                              : "No members found."}
                        </p>
                      </div>
                    ) : (
                      <div className="py-1">
                        {members.map((member) => (
                          <div
                            key={member.id}
                            className={cn(
                              "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                              formData.member_id === member.id ? "bg-accent text-accent-foreground" : "",
                            )}
                            onClick={() => {
                              handleChange("member_id", member.id === formData.member_id ? "" : member.id)
                              setMemberSearchOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.member_id === member.id ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{member.name}</span>
                              <span className="text-xs text-gray-500">{member.email}</span>
                            </div>
                          </div>
                        ))}

                        {hasMoreMembers && (
                          <div className="px-2 py-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={loadMoreMembers}
                              disabled={loadingMoreMembers}
                              className="w-full text-xs"
                            >
                              Load more members
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {members.length === 0 && !loadingMoreMembers && (
              <p className="text-sm text-gray-500">No active members found. Please add members first.</p>
            )}
            <p className="text-xs text-gray-400">Selected member ID: {formData.member_id || "None"}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
              placeholder="Additional notes about this assignment..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || trainers.length === 0 || members.length === 0}>
              {loading ? "Creating..." : "Create Assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
