export interface Member {
  id: string
  name: string
  email: string
  phone: string
  address: string
  emergencyContact: string
  package: string
  status: "active" | "inactive" | "expired"
  joinDate: string
  notes: string
}

export interface Trainer {
  id: string
  name: string
  email: string
  phone: string
  specializations: string[]
  certifications: string[]
  experience: string
  status: "active" | "inactive"
  rating: number
  hourlyRate: number
  bio: string
  joinDate: string
}

export interface CheckIn {
  id: string
  memberId: string
  memberName: string
  checkInTime: string
  checkOutTime: string | null
  method: "manual" | "qr" | "rfid" | "biometric"
  status: "active" | "completed"
}

export interface GymClass {
  id: string
  name: string
  type: string
  instructor: string
  instructorId: string
  schedule: {
    dayOfWeek: string
    startTime: string
    endTime: string
    recurring: boolean
  }
  capacity: number
  enrolled: number
  price: number
  description: string
  status: "active" | "cancelled"
  room: string
}

export interface Payment {
  id: string
  memberId: string
  memberName: string
  amount: number
  method: "credit_card" | "bank_transfer" | "cash" | "upi"
  status: "completed" | "pending" | "failed" | "overdue"
  type: "subscription" | "class" | "personal_training" | "product"
  description: string
  date: string
  dueDate: string
  invoiceId?: string
}

export interface Product {
  id: string
  name: string
  category: "supplements" | "apparel" | "accessories" | "equipment"
  price: number
  cost: number
  stock: number
  minStock: number
  sku: string
  description: string
  supplier: string
  status: "active" | "low_stock" | "out_of_stock"
  image?: string
}

export interface Invoice {
  id: string
  memberId: string
  memberName: string
  amount: number
  status: "paid" | "pending" | "overdue"
  dueDate: string
  issueDate: string
  items: Array<{
    description: string
    amount: number
  }>
  notes?: string
}

export interface Sale {
  id: string
  items: Array<{
    productId: string
    productName: string
    quantity: number
    price: number
    total: number
  }>
  total: number
  paymentMethod: string
  customerInfo?: any
  timestamp: string
  cashier: string
}

export interface ScheduleEvent {
  id: string
  title: string
  type: "class" | "personal_training" | "maintenance" | "event"
  startTime: string
  endTime: string
  instructor: string
  instructorId: string
  room: string
  capacity: number
  enrolled: number
  description: string
  status: "scheduled" | "confirmed" | "cancelled"
  recurring: boolean
  recurrencePattern?: "daily" | "weekly" | "monthly"
}

export interface MembershipPackage {
  id: string
  name: string
  description: string
  price: number
  duration: number
  durationType: "days" | "months" | "years"
  features: string[]
  limitations: string[]
  status: "active" | "inactive"
  color: string
  icon: string
  popular: boolean
  memberCount: number
}

export interface Notification {
  id: string
  title: string
  message: string
  type: "payment" | "member" | "class" | "maintenance" | "inventory" | "schedule"
  priority: "low" | "medium" | "high"
  status: "read" | "unread"
  timestamp: string
  recipient: string
  actionRequired: boolean
  relatedId?: string
}

export interface AccessRule {
  id: string
  name: string
  description: string
  membershipTypes: string[]
  areas: string[]
  timeRestrictions: {
    enabled: boolean
    schedule: Record<string, { start: string; end: string }>
  }
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
}

export interface AccessLog {
  id: string
  memberId: string
  memberName: string
  area: string
  action: "entry" | "exit"
  method: "rfid" | "qr" | "biometric" | "manual"
  timestamp: string
  status: "granted" | "denied"
  ruleApplied: string
  reason?: string
}
