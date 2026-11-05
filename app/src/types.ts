// app/src/types.ts
// Shared TypeScript types for BiLU ERP by Pravara Infotech.

export type UserRole = 'admin' | 'owner';
export type UserPlan = 'free' | 'premium';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  plan: UserPlan;
  is_active: boolean;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  gstin?: string;
  address?: string;
  state?: string;
  phone?: string;
}

export type PartyType = 'customer' | 'supplier';

export interface Party {
  id: string;
  business_id: string;
  name: string;
  phone?: string;
  gstin?: string;
  address?: string;
  state?: string;
  type: PartyType;
  opening_balance: number; // paise
  balance?: number; // paise current ledger balance
}

export interface Item {
  id: string;
  business_id: string;
  name: string;
  hsn?: string;
  unit: string;
  sale_price: number; // paise
  purchase_price: number; // paise
  gst_rate: number; // percent integer
  stock_qty: number;
  low_stock_limit: number;
}

export type InvoiceType = 'sale' | 'purchase';
export type InvoiceStatus = 'unpaid' | 'partial' | 'paid';

export type DocumentType =
  | 'tax_invoice'
  | 'quotation'
  | 'proforma'
  | 'bill_of_supply'
  | 'composition'
  | 'credit_note'
  | 'delivery_challan';

export type SupplyCategory = 'goods' | 'services' | 'mixed';

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_id?: string;
  name: string;
  hsn?: string;
  qty: number;
  unit: string;
  price: number; // paise
  gst_rate: number;
  amount: number; // paise
}

export interface Invoice {
  id: string;
  business_id: string;
  party_id?: string;
  party_name?: string;
  party_gstin?: string;
  billing_address?: string;
  invoice_no: string;
  type: InvoiceType;
  doc_type?: DocumentType;
  supply_category?: SupplyCategory;
  date: string;
  subtotal: number; // paise
  discount: number; // paise
  cgst: number; // paise
  sgst: number; // paise
  igst: number; // paise
  total: number; // paise
  paid_amount: number; // paise
  status: InvoiceStatus;
  items: InvoiceItem[];
}

export type PaymentMode = 'cash' | 'upi' | 'card' | 'bank' | 'cheque';
export type PaymentDirection = 'in' | 'out';

export interface Payment {
  id: string;
  business_id: string;
  party_id?: string;
  party_name?: string;
  invoice_id?: string;
  invoice_no?: string;
  amount: number; // paise
  mode: PaymentMode;
  direction?: PaymentDirection;
  type?: PaymentDirection;
  date: string;
  note?: string;
  notes?: string;
}
