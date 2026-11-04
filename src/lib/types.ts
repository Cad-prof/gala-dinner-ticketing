import type { TicketTypeId } from "@/lib/event";

export type OrderStatus =
  | "pending"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "refunded";

export interface OrderItem {
  type: TicketTypeId;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderRow {
  id: string;
  order_reference: string;
  status: OrderStatus;
  currency: string;
  amount_total: number;
  ticket_count: number;
  items: OrderItem[];
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  provider: string | null;
  provider_charge_id: string | null;
  provider_transaction_id: string | null;
  provider_checked_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketRow {
  id: string;
  code: string;
  order_reference: string;
  seq: number;
  ticket_type: TicketTypeId;
  checked_in_at: string | null;
  created_at: string;
}

export interface CartLine {
  type: TicketTypeId;
  quantity: number;
}

export interface CustomerInput {
  name: string;
  email: string;
  phone: string;
}

export interface WaveCheckoutSession {
  id: string;
  amount: string;
  currency: string;
  client_reference?: string | null;
  checkout_status: "open" | "complete" | "expired";
  payment_status: "processing" | "cancelled" | "succeeded";
  transaction_id?: string | null;
  wave_launch_url: string;
  when_expires?: string;
}

export interface WaveWebhookEvent {
  id: string;
  type: string;
  data: WaveCheckoutSession;
}

/** Temporary compatibility contracts while the legacy webhook is retired. */
export interface BictorysCheckoutLink {
  type: "CheckoutLinkObject";
  link: string;
  chargeId: string;
  opToken: string;
}

export interface BictorysError {
  status?: string;
  title?: string;
  details?: string;
}

export interface BictorysWebhookPayload {
  id: string;
  amount: number;
  currency: string;
  paymentReference?: string;
  status:
    | "succeeded"
    | "authorized"
    | "failed"
    | "cancelled"
    | "reversed"
    | "pending"
    | "processing";
  timestamp?: string;
}
