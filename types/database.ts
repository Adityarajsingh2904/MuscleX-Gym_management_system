export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          subaccount_id: string | null
          name: string | null
          email: string
          phone: string | null
          role_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          subaccount_id?: string | null
          name?: string | null
          email: string
          phone?: string | null
          role_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subaccount_id?: string | null
          name?: string | null
          email?: string
          phone?: string | null
          role_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          website: string | null
          description: string | null
          onboarding_completed: boolean
          currency_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          website?: string | null
          description?: string | null
          onboarding_completed?: boolean
          currency_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          website?: string | null
          description?: string | null
          onboarding_completed?: boolean
          currency_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      subaccounts: {
        Row: {
          id: string
          account_id: string
          name: string
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          account_id: string
          name: string
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          account_id?: string
          name?: string
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_accounts: {
        Row: {
          id: string
          user_id: string
          account_id: string
          subaccount_id: string | null
          role_id: string | null
          is_owner: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          subaccount_id?: string | null
          role_id?: string | null
          is_owner?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          subaccount_id?: string | null
          role_id?: string | null
          is_owner?: boolean
          created_at?: string
        }
      }
      user_invitations: {
        Row: {
          id: string
          subaccount_id: string
          email: string
          role_id: string
          status_id: string
          token: string
          invited_by: string | null
          invited_at: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          subaccount_id: string
          email: string
          role_id: string
          status_id: string
          token: string
          invited_by?: string | null
          invited_at?: string
          responded_at?: string | null
        }
        Update: {
          id?: string
          subaccount_id?: string
          email?: string
          role_id?: string
          status_id?: string
          token?: string
          invited_by?: string | null
          invited_at?: string
          responded_at?: string | null
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      status: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export interface Currency {
  id: string
  name: string
  symbol: string
  code: string
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  subaccount_id: string
  name: string
  email?: string
  phone?: string
  gender?: string
  dob?: string
  join_date: string
  is_active: boolean
  active_plan?: string
  last_payment?: string
  next_payment?: string
  created_at: string
  updated_at: string
  plan?: Plan
}

export interface Plan {
  id: string
  subaccount_id: string
  name: string
  description?: string
  duration: number
  price: number
  metadata?: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  member_id: string
  plan_id?: string
  amount: number
  discount: number
  final_amount: number
  paid_at: string
  payment_method_id?: string
  notes?: string
  metadata?: any
  created_at: string
  member?: Member
  plan?: Plan
  payment_method?: PaymentMethod
}

export interface PaymentMethod {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
}

export interface EventType {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface EventLog {
  id: string
  subaccount_id: string
  user_id?: string
  event_type_id: string
  entity_type?: string
  entity_id?: string
  metadata?: any
  created_at: string
  event_type?: EventType
  user?: any
}
