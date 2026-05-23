export type PaymentMethod = "bank" | "qr";
export type SplitMode = "equal" | "scan";
export type BillStatus = "active" | "completed" | "overdue" | "archived";
export type FlagStatus = "pending" | "resolved" | "dismissed";
export type WATone = "firm" | "funny" | "professional" | "custom";
export type ActivityType =
  | "payment_confirmed"
  | "payment_manual"
  | "flag_created"
  | "flag_resolved"
  | "reminder_sent"
  | "bill_created"
  | "bill_completed";

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  payment_method: PaymentMethod;
  bank_name?: string;
  bank_account?: string;
  bank_holder_name?: string;
  qr_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Bill {
  id: string;
  organizer_id: string;
  title: string;
  description?: string;
  category: string;
  split_mode: SplitMode;
  total_amount: number;
  tax: number;
  service_charge: number;
  pay_code: string;
  due_date: string;
  status: BillStatus;
  store_name?: string;
  receipt_url?: string;
  receipt_edited: boolean;
  created_at: string;
  updated_at: string;
  bill_members?: BillMember[];
  bill_items?: BillItem[];
}

export interface BillMember {
  id: string;
  bill_id: string;
  name: string;
  phone?: string;
  amount_owed: number;
  paid: boolean;
  paid_at?: string;
  payment_method?: string;
  payment_screenshot_url?: string;
  confirmed_by?: "member" | "organizer";
  personal_token: string;
  created_at: string;
  updated_at: string;
  item_claims?: ItemClaim[];
}

export interface BillItem {
  id: string;
  bill_id: string;
  name: string;
  original_price: number;
  edited_price: number;
  qty: number;
  is_edited: boolean;
  total_units_available: number;
  total_units_claimed: number;
  item_type: "item" | "tax" | "service_charge" | "discount";
  sort_order: number;
  created_at: string;
  item_claims?: ItemClaim[];
}

export interface ItemClaim {
  id: string;
  item_id: string;
  member_id: string;
  units_claimed: number;
  amount_share: number;
  created_at: string;
}

export interface Flag {
  id: string;
  bill_id: string;
  member_id: string;
  item_id?: string;
  member_note?: string;
  original_price?: number;
  charged_price?: number;
  resolved_price?: number;
  organizer_explanation?: string;
  status: FlagStatus;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  bill_members?: BillMember;
  bill_items?: BillItem;
}

export interface ActivityLog {
  id: string;
  bill_id: string;
  organizer_id: string;
  member_id?: string;
  flag_id?: string;
  activity_type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  bill_members?: BillMember;
  flags?: Flag;
  bills?: Bill;
}

export interface Reminder {
  id: string;
  bill_id: string;
  member_id?: string;
  tone: WATone;
  custom_message?: string;
  sent_at: string;
  created_at: string;
}

export interface ScanResult {
  storeName: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    qty: number;
  }>;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
}
