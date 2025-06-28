export interface Gym {
  id: string
  name: string
  address: string
  phone: string
  email: string
  website?: string
  ownerId: string
  ownerName: string
  logo?: string
  description?: string
  createdAt: string
  settings: {
    timezone: string
    currency: string
    features: string[]
  }
}

export interface Franchise {
  id: string
  name: string
  address: string
  phone: string
  email: string
  gymId: string
  managerId?: string
  managerName?: string
  status: "active" | "pending" | "inactive"
  memberCount: number
  revenue: number
  createdAt: string
  settings: {
    capacity: number
    operatingHours: {
      monday: { start: string; end: string }
      tuesday: { start: string; end: string }
      wednesday: { start: string; end: string }
      thursday: { start: string; end: string }
      friday: { start: string; end: string }
      saturday: { start: string; end: string }
      sunday: { start: string; end: string }
    }
    amenities: string[]
  }
}

export interface Manager {
  id: string
  name: string
  email: string
  phone: string
  role: "franchise_manager" | "assistant_manager" | "shift_supervisor"
  franchiseId: string
  franchiseName: string
  gymId: string
  permissions: string[]
  status: "active" | "inactive"
  joinDate: string
  avatar?: string
}

export interface TeamInvitation {
  id: string
  email: string
  role: "owner" | "manager" | "staff"
  gymId?: string
  franchiseId?: string
  invitedBy: string
  invitedByName: string
  status: "pending" | "accepted" | "expired"
  expiresAt: string
  createdAt: string
  token: string
}

export interface OnboardingData {
  step: number
  gymInfo: {
    name: string
    address: string
    phone: string
    email: string
    website: string
    description: string
  }
  ownerInfo: {
    name: string
    email: string
    phone: string
    role: string
  }
  preferences: {
    timezone: string
    currency: string
    features: string[]
  }
  completed: boolean
}
