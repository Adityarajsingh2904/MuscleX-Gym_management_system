"use client"

import {
  Menu,
  Search,
  Settings,
  User,
  Building2,
  MapPin,
  LogOut,
  Mail,
  Loader2,
  Check,
  X,
  Users,
  UserCheck,
} from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useGymContext } from "@/lib/gym-context"

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void
  onNotificationClick?: () => void
}

interface Account {
  id: string
  name: string
  email: string
  phone: string
  onboarding_completed?: boolean
}

interface Subaccount {
  id: string
  name: string
  location: string
  account_id: string
}

interface UserAccount {
  id: string
  account_id: string
  subaccount_id: string
  is_owner: boolean
  role?: {
    id: string
    name: string
  }
  account: Account
  subaccount: Subaccount
}

interface Invitation {
  id: string
  email: string
  role: {
    id: string
    name: string
  }
  status: {
    id: string
    name: string
  }
  subaccount: {
    id: string
    name: string
    location: string
    account: {
      id: string
      name: string
    }
  }
  invited_at: string
  token: string
}

interface SearchResult {
  id: string
  name: string
  email: string
  type: "member" | "staff"
  role?: string
  status?: string
}

export function Header({ setSidebarOpen, onNotificationClick }: HeaderProps) {
  const router = useRouter()
  const { setCurrentContext, currentSubaccountId } = useGymContext()
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [selectedSubaccount, setSelectedSubaccount] = useState<Subaccount | null>(null)
  const [userName, setUserName] = useState("")
  const [userInitials, setUserInitials] = useState("JD")
  const [showNewFranchiseDialog, setShowNewFranchiseDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState("")
  const [hasOwnedGym, setHasOwnedGym] = useState(false)
  const [isOwnerOfCurrentGym, setIsOwnerOfCurrentGym] = useState(false)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null)
  const [creatingFranchise, setCreatingFranchise] = useState(false)
  const [newFranchise, setNewFranchise] = useState({
    name: "",
    location: "",
  })
  const [invitationsOpen, setInvitationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  // Search functionality state
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadUserData()
    loadInvitations()
  }, [])

  // Debounced search function
  const debouncedSearch = useCallback(
    (term: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      searchTimeoutRef.current = setTimeout(() => {
        if (term.trim().length >= 2 && currentSubaccountId) {
          performSearch(term.trim())
        } else if (term.trim().length === 0) {
          setSearchResults([])
          setShowSearchResults(false)
        }
      }, 300)
    },
    [currentSubaccountId],
  )

  // Perform the actual search
  const performSearch = async (term: string) => {
    if (!currentSubaccountId) return

    try {
      setIsSearching(true)
      setShowSearchResults(true)
      const results: SearchResult[] = []

      // Search members
      const { data: members, error: membersError } = await supabase
        .from("members")
        .select("id, name, email, is_active")
        .eq("subaccount_id", currentSubaccountId)
        .ilike("name", `%${term}%`)
        .limit(10)

      if (!membersError && members && members.length > 0) {
        results.push(
          ...members.map((member) => ({
            id: member.id,
            name: member.name,
            email: member.email || "",
            type: "member" as const,
            status: member.is_active ? "Active" : "Inactive",
          })),
        )
      }

      // Search by email if no name matches
      if (results.length === 0) {
        const { data: membersByEmail, error: membersEmailError } = await supabase
          .from("members")
          .select("id, name, email, is_active")
          .eq("subaccount_id", currentSubaccountId)
          .ilike("email", `%${term}%`)
          .limit(10)

        if (!membersEmailError && membersByEmail) {
          results.push(
            ...membersByEmail.map((member) => ({
              id: member.id,
              name: member.name,
              email: member.email || "",
              type: "member" as const,
              status: member.is_active ? "Active" : "Inactive",
            })),
          )
        }
      }

      // Search staff
      const { data: staff, error: staffError } = await supabase
        .from("users")
        .select(`
          id,
          name,
          email,
          is_active,
          role:roles(name)
        `)
        .eq("subaccount_id", currentSubaccountId)
        .ilike("name", `%${term}%`)
        .limit(10)

      if (!staffError && staff && staff.length > 0) {
        results.push(
          ...staff.map((staffMember) => ({
            id: staffMember.id,
            name: staffMember.name,
            email: staffMember.email || "",
            type: "staff" as const,
            role: staffMember.role?.name || "Staff",
            status: staffMember.is_active ? "Active" : "Inactive",
          })),
        )
      }

      setSearchResults(results)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    debouncedSearch(value)
  }

  // Handle search result click
  const handleSearchResultClick = (result: SearchResult) => {
    if (result.type === "member") {
      router.push(`/dashboard/members/${result.id}`)
    } else if (result.type === "staff") {
      router.push(`/dashboard/staff`)
    }

    setSearchTerm("")
    setSearchResults([])
    setShowSearchResults(false)
    if (searchInputRef.current) {
      searchInputRef.current.blur()
    }
  }

  const handleSearchFocus = () => {
    if (searchTerm.length >= 2) {
      performSearch(searchTerm)
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      // Handle search results
      if (searchInputRef.current && !searchInputRef.current.contains(target)) {
        const searchResults = document.querySelector("[data-search-results]")
        if (!searchResults || !searchResults.contains(target)) {
          setShowSearchResults(false)
        }
      }

      // Handle invitations dropdown
      const invitationsContainer = document.querySelector("[data-invitations-container]")
      if (invitationsOpen && invitationsContainer && !invitationsContainer.contains(target)) {
        setInvitationsOpen(false)
      }

      // Handle profile dropdown
      const profileContainer = document.querySelector("[data-profile-container]")
      if (profileOpen && profileContainer && !profileContainer.contains(target)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [invitationsOpen, profileOpen])

  const loadUserData = async () => {
    try {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth")
        return
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("name, email, role:roles(id, name)")
        .eq("id", user.id)

      if (userData && userData.length > 0) {
        const currentUser = userData[0]
        setUserName(currentUser.name || currentUser.email || "User")
        setUserRole(currentUser.role?.name || "")

        const initials = (currentUser.name || currentUser.email || "User")
          .split(" ")
          .map((part) => part[0])
          .join("")
          .toUpperCase()
          .substring(0, 2)
        setUserInitials(initials)
      } else {
        setUserName(user.user_metadata?.name || user.email || "User")

        const initials = (user.user_metadata?.name || user.email || "User")
          .split(" ")
          .map((part) => part[0])
          .join("")
          .toUpperCase()
          .substring(0, 2)
        setUserInitials(initials)
      }

      const { data: userAccountsData, error: accountsError } = await supabase
        .from("user_accounts")
        .select(`
          id,
          account_id,
          subaccount_id,
          is_owner,
          role:roles(id, name),
          account:accounts(id, name, email, phone, onboarding_completed),
          subaccount:subaccounts(id, name, location, account_id)
        `)
        .eq("user_id", user.id)

      if (userAccountsData && userAccountsData.length > 0) {
        setUserAccounts(userAccountsData as UserAccount[])

        const hasOwnership = userAccountsData.some((ua) => ua.is_owner)
        setHasOwnedGym(hasOwnership)

        const storedAccountId = localStorage.getItem("current_account_id")
        const storedSubaccountId = localStorage.getItem("current_subaccount_id")

        let selectedUserAccount = null

        if (storedAccountId && storedSubaccountId) {
          selectedUserAccount = userAccountsData.find(
            (ua) => ua.account.id === storedAccountId && ua.subaccount.id === storedSubaccountId,
          )
        }

        if (!selectedUserAccount && userAccountsData.length > 0) {
          selectedUserAccount = userAccountsData[0] as UserAccount
        }

        if (selectedUserAccount) {
          setSelectedAccount(selectedUserAccount.account)
          setSelectedSubaccount(selectedUserAccount.subaccount)
          setIsOwnerOfCurrentGym(selectedUserAccount.is_owner)

          localStorage.setItem("current_account_id", selectedUserAccount.account.id)
          localStorage.setItem("current_subaccount_id", selectedUserAccount.subaccount.id)
        } else {
          router.push("/onboarding")
        }
      } else {
        router.push("/onboarding")
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadInvitations = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: invitationsData, error: invitationsError } = await supabase
        .from("user_invitations")
        .select(`
          id,
          email,
          role:roles(id, name),
          status:status(id, name),
          subaccount:subaccounts(
            id,
            name,
            location,
            account:accounts(id, name)
          ),
          invited_at,
          token
        `)
        .eq("email", user.email)
        .eq("status.name", "pending")

      if (invitationsData) {
        const { data: userAccountsData } = await supabase
          .from("user_accounts")
          .select("subaccount_id")
          .eq("user_id", user.id)

        const userSubaccountIds = userAccountsData?.map((ua) => ua.subaccount_id) || []

        const filteredInvitations = invitationsData.filter(
          (invitation) => !userSubaccountIds.includes(invitation.subaccount.id),
        )

        setInvitations(filteredInvitations || [])
      }
    } catch (error) {
      console.error("Error loading invitations:", error)
    }
  }

  const handleAccountChange = (userAccount: UserAccount) => {
    setSelectedAccount(userAccount.account)
    setSelectedSubaccount(userAccount.subaccount)
    setIsOwnerOfCurrentGym(userAccount.is_owner)
    setCurrentContext(userAccount.account.id, userAccount.subaccount.id)
  }

  const handleSubaccountChange = (subaccount: Subaccount) => {
    const userAccount = userAccounts.find((ua) => ua.subaccount.id === subaccount.id)
    setSelectedSubaccount(subaccount)
    setIsOwnerOfCurrentGym(userAccount?.is_owner || false)

    if (selectedAccount) {
      setCurrentContext(selectedAccount.id, subaccount.id)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.clear()
    router.push("/auth")
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.round(diffMs / 1000)
    const diffMins = Math.round(diffSecs / 60)
    const diffHours = Math.round(diffMins / 60)
    const diffDays = Math.round(diffHours / 24)

    if (diffSecs < 60) return `${diffSecs} second${diffSecs !== 1 ? "s" : ""} ago`
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`

    return date.toLocaleDateString()
  }

  const accountGroups = userAccounts.reduce(
    (groups, userAccount) => {
      const accountId = userAccount.account.id
      if (!groups[accountId]) {
        groups[accountId] = {
          account: userAccount.account,
          subaccounts: [],
        }
      }
      groups[accountId].subaccounts.push(userAccount.subaccount)
      return groups
    },
    {} as Record<string, { account: Account; subaccounts: Subaccount[] }>,
  )

  const currentSubaccounts = selectedAccount ? accountGroups[selectedAccount.id]?.subaccounts || [] : []

  if (loading) {
    return (
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-teal-600"></div>
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative z-50">
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-2 sm:gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
        <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" />
        </button>

        <div className="h-6 w-px bg-gray-200 lg:hidden" />

        <div className="flex flex-1 gap-x-2 self-stretch lg:gap-x-4">
          {/* Current Context Display - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-x-2 text-sm text-gray-600">
            {selectedAccount && (
              <>
                <Building2 className="h-4 w-4" />
                <span className="font-medium truncate max-w-[120px] lg:max-w-none">{selectedAccount.name}</span>
                {(() => {
                  const currentUserAccount = userAccounts.find(
                    (ua) => ua.account.id === selectedAccount.id && ua.subaccount.id === selectedSubaccount?.id,
                  )
                  const isOwner = currentUserAccount?.is_owner

                  if (isOwner) {
                    return (
                      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Owner
                      </span>
                    )
                  }
                  return null
                })()}
              </>
            )}

            {selectedAccount && selectedSubaccount && (
              <>
                <span className="text-gray-400">/</span>
                <MapPin className="h-4 w-4" />
                <span className="truncate max-w-[120px] lg:max-w-none">{selectedSubaccount.name}</span>
              </>
            )}
          </div>

          {/* Search - Responsive */}
          <div className="relative flex flex-1 items-center max-w-md lg:max-w-lg">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={handleSearchFocus}
              className="w-full border-0 bg-gray-50 pl-10 pr-4 py-2 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-teal-500 rounded-md text-sm"
            />

            {/* Search Results - Mobile responsive */}
            {(showSearchResults || isSearching) && searchTerm.length >= 2 && (
              <div
                data-search-results
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[100] max-h-80 overflow-y-auto"
              >
                {isSearching ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    <span className="text-sm text-gray-500">Searching...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          handleSearchResultClick(result)
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex-shrink-0">
                          {result.type === "member" ? (
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <UserCheck className="h-4 w-4 text-green-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">{result.name}</p>
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                result.type === "member"
                                  ? "bg-blue-50 text-blue-700 ring-blue-600/20"
                                  : "bg-green-50 text-green-700 ring-green-600/20"
                              }`}
                            >
                              {result.type === "member" ? "Member" : "Staff"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{result.email}</p>
                          {result.status && (
                            <p className={`text-xs ${result.status === "Active" ? "text-green-600" : "text-gray-500"}`}>
                              {result.status}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No results found</p>
                    <p className="text-xs">Try searching by name, email, or ID</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-x-1 lg:gap-x-4">
            {/* Invitations - Responsive */}
            <div className="relative" data-invitations-container>
              <button
                type="button"
                onClick={() => setInvitationsOpen(!invitationsOpen)}
                className="relative p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <Mail className="h-5 w-5" />
                {invitations.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-500 text-xs text-white flex items-center justify-center">
                    {invitations.length}
                  </span>
                )}
              </button>

              {invitationsOpen && (
                <div className="absolute right-0 mt-1 w-80 sm:w-96 bg-white border border-gray-200 rounded-md shadow-lg z-[100] max-h-[80vh] overflow-y-auto">
                  <div className="p-4 border-b">
                    <h3 className="font-medium text-lg">Invitations</h3>
                    <p className="text-sm text-gray-500">
                      {invitations.length > 0
                        ? `You have ${invitations.length} pending invitation${invitations.length !== 1 ? "s" : ""}`
                        : "No pending invitations"}
                    </p>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto">
                    {invitations.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <Mail className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                        <p>No pending invitations</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {invitations.map((invitation) => (
                          <div key={invitation.id} className="p-4">
                            <div className="mb-2">
                              <div className="flex justify-between items-start">
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-medium truncate">{invitation.subaccount.account.name}</h4>
                                  <p className="text-sm text-gray-600 truncate">{invitation.subaccount.name}</p>
                                </div>
                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 ml-2">
                                  {invitation.role.name}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Invited {formatRelativeTime(invitation.invited_at)}
                              </p>
                            </div>

                            <div className="flex gap-2 mt-3">
                              <button
                                className="flex-1 inline-flex items-center justify-center rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50"
                                disabled={processingInvitation === invitation.id}
                              >
                                {processingInvitation === invitation.id ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4 mr-1" />
                                )}
                                Accept
                              </button>
                              <button
                                className="flex-1 inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                                disabled={processingInvitation === invitation.id}
                              >
                                {processingInvitation === invitation.id ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4 mr-1" />
                                )}
                                Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile - Responsive */}
            <div className="relative" data-profile-container>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="relative h-8 w-8 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <div className="h-full w-full rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm border-2 border-white">
                  <span className="text-sm font-medium text-white">{userInitials}</span>
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-1 w-80 sm:w-96 bg-white border border-gray-200 rounded-md shadow-lg z-[100] max-h-[80vh] overflow-y-auto">
                  <div className="p-3 border-b">
                    <div className="flex flex-col">
                      <span className="font-medium truncate">{userName}</span>
                      <span className="text-xs text-gray-500 truncate">
                        {selectedAccount ? `${selectedAccount.name}` : "No gym selected"}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        router.push("/dashboard/profile")
                        setProfileOpen(false)
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        router.push("/dashboard/settings")
                        setProfileOpen(false)
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </button>
                  </div>

                  <div className="border-t py-1">
                    <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Your Gyms
                    </div>
                    {Object.values(accountGroups).map(({ account, subaccounts }) => {
                      const userAccount = userAccounts.find((ua) => ua.account.id === account.id)
                      const isAccountOwner = userAccount?.is_owner || false
                      const truncatedName =
                        account.name.length > 20 ? `${account.name.substring(0, 20)}...` : account.name

                      return (
                        <button
                          key={account.id}
                          onClick={() => {
                            if (userAccount) {
                              handleAccountChange(userAccount)
                              setProfileOpen(false)
                            }
                          }}
                          className="flex w-full items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          title={account.name.length > 20 ? account.name : undefined}
                        >
                          <div className="flex items-center min-w-0 flex-1">
                            <Building2 className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className={`${selectedAccount?.id === account.id ? "font-medium" : ""} truncate`}>
                              {truncatedName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                            {isAccountOwner && (
                              <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                Owner
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {subaccounts.length} location{subaccounts.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {selectedAccount && currentSubaccounts.length > 0 && (
                    <div className="border-t py-1">
                      <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Locations
                      </div>
                      {currentSubaccounts.map((subaccount) => {
                        const userAccount = userAccounts.find((ua) => ua.subaccount.id === subaccount.id)
                        const isSubaccountOwner = userAccount?.is_owner || false
                        const truncatedName =
                          subaccount.name.length > 20 ? `${subaccount.name.substring(0, 20)}...` : subaccount.name
                        const truncatedLocation =
                          subaccount.location.length > 15
                            ? `${subaccount.location.substring(0, 15)}...`
                            : subaccount.location

                        return (
                          <button
                            key={subaccount.id}
                            onClick={() => {
                              handleSubaccountChange(subaccount)
                              setProfileOpen(false)
                            }}
                            className="flex w-full items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            title={`${subaccount.name} - ${subaccount.location}`}
                          >
                            <div className="flex items-center min-w-0 flex-1">
                              <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                              <div className="flex flex-col min-w-0 text-left">
                                <span
                                  className={`${selectedSubaccount?.id === subaccount.id ? "font-medium" : ""} truncate`}
                                >
                                  {truncatedName}
                                </span>
                                <span className="text-xs text-gray-400 truncate">{truncatedLocation}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                              {isSubaccountOwner && (
                                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                  Owner
                                </span>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <div className="border-t py-1">
                    <button
                      onClick={() => {
                        handleLogout()
                        setProfileOpen(false)
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
