// app/src/services/mockData.ts
import { Business, Party, Item, Invoice, InvoiceItem, Payment, User } from '../types';

export const mockUser: User = {
  id: 'u-1',
  name: 'Ramesh Gupta',
  email: 'admin@biluerp.com',
  phone: '9876543210',
  role: 'owner',
  plan: 'free',
  is_active: true,
};

export const mockBusinesses: Business[] = [
  { id: 'b-1', owner_id: 'u-1', name: 'Gupta Traders', gstin: '27ABCDE1234F1Z5', address: 'Market Yard, Pune, MH', state: 'Maharashtra', phone: '9876543210' },
  { id: 'b-2', owner_id: 'u-1', name: 'Gupta Kirana', gstin: '27FGHIJ5678K2Z9', address: 'Dadar, Mumbai, MH', state: 'Maharashtra', phone: '9876543211' },
];

export const mockParties: Party[] = [
  { id: 'p-1', business_id: 'b-1', name: 'Sharma Retail', phone: '9999990001', gstin: '27SHRM1234A1Z5', state: 'Maharashtra', type: 'customer', opening_balance: 0 },
  { id: 'p-2', business_id: 'b-1', name: 'Patel Wholesale', phone: '9999990002', gstin: '24PTLW5678B2Z9', state: 'Gujarat', type: 'customer', opening_balance: 0 },
  { id: 'p-3', business_id: 'b-1', name: 'Mehta Distributors', phone: '9999990003', gstin: '27MHTD9012C3Z1', state: 'Maharashtra', type: 'supplier', opening_balance: 0 },
  { id: 'p-4', business_id: 'b-1', name: 'Khan Traders', phone: '9999990004', state: 'Delhi', type: 'customer', opening_balance: 0 },
  { id: 'p-5', business_id: 'b-2', name: 'Joshi Stores', phone: '9999990005', state: 'Maharashtra', type: 'customer', opening_balance: 0 },
  { id: 'p-6', business_id: 'b-2', name: 'Verma Suppliers', phone: '9999990006', state: 'Maharashtra', type: 'supplier', opening_balance: 0 },
];

export const mockItems: Item[] = [
  { id: 'i-1', business_id: 'b-1', name: 'Rice 25kg', hsn: '1006', unit: 'bag', sale_price: 120000, purchase_price: 100000, gst_rate: 5, stock_qty: 50, low_stock_limit: 10 },
  { id: 'i-2', business_id: 'b-1', name: 'Wheat Flour 10kg', hsn: '1101', unit: 'bag', sale_price: 45000, purchase_price: 38000, gst_rate: 5, stock_qty: 30, low_stock_limit: 5 },
  { id: 'i-3', business_id: 'b-1', name: 'Sugar 1kg', hsn: '1701', unit: 'kg', sale_price: 4500, purchase_price: 4000, gst_rate: 5, stock_qty: 100, low_stock_limit: 20 },
  { id: 'i-4', business_id: 'b-1', name: 'Cooking Oil 1L', hsn: '1512', unit: 'ltr', sale_price: 18000, purchase_price: 15000, gst_rate: 5, stock_qty: 8, low_stock_limit: 15 },
  { id: 'i-5', business_id: 'b-1', name: 'Detergent 1kg', hsn: '3402', unit: 'kg', sale_price: 12000, purchase_price: 9000, gst_rate: 18, stock_qty: 25, low_stock_limit: 5 },
  { id: 'i-6', business_id: 'b-2', name: 'Tea 250g', hsn: '0902', unit: 'pkt', sale_price: 9000, purchase_price: 7000, gst_rate: 5, stock_qty: 40, low_stock_limit: 10 },
];

const ii1: InvoiceItem = { id: 'ii-1', invoice_id: 'inv-1', item_id: 'i-1', name: 'Rice 25kg', hsn: '1006', qty: 2, unit: 'bag', price: 120000, gst_rate: 5, amount: 240000 };
const ii2: InvoiceItem = { id: 'ii-2', invoice_id: 'inv-1', item_id: 'i-3', name: 'Sugar 1kg', hsn: '1701', qty: 5, unit: 'kg', price: 4500, gst_rate: 5, amount: 22500 };

export const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    business_id: 'b-1',
    party_id: 'p-1',
    party_name: 'Sharma Retail',
    party_gstin: '27SHRM1234A1Z5',
    billing_address: 'Shop 12, Market Yard, Pune, Maharashtra',
    invoice_no: 'INV-2026-27-0001',
    type: 'sale',
    doc_type: 'tax_invoice',
    supply_category: 'goods',
    date: '2026-11-01',
    subtotal: 262500,
    discount: 0,
    cgst: 6563,
    sgst: 6563,
    igst: 0,
    total: 275626,
    paid_amount: 100000,
    status: 'partial',
    items: [ii1, ii2],
  },
  {
    id: 'inv-2',
    business_id: 'b-1',
    party_id: 'p-2',
    party_name: 'Patel Wholesale',
    party_gstin: '24PTLW5678B2Z9',
    billing_address: 'Ring Road, Surat, Gujarat',
    invoice_no: 'INV-2026-27-0002',
    type: 'sale',
    doc_type: 'tax_invoice',
    supply_category: 'goods',
    date: '2026-11-02',
    subtotal: 45000,
    discount: 0,
    cgst: 0,
    sgst: 0,
    igst: 2250,
    total: 47250,
    paid_amount: 47250,
    status: 'paid',
    items: [{ id: 'ii-3', invoice_id: 'inv-2', item_id: 'i-2', name: 'Wheat Flour 10kg', hsn: '1101', qty: 1, unit: 'bag', price: 45000, gst_rate: 5, amount: 45000 }],
  },
  {
    id: 'inv-3',
    business_id: 'b-1',
    party_id: 'p-3',
    party_name: 'Mehta Distributors',
    party_gstin: '27MHTD9012C3Z1',
    billing_address: 'Dadar West, Mumbai, Maharashtra',
    invoice_no: 'PB-2026-27-0001',
    type: 'purchase',
    doc_type: 'tax_invoice',
    supply_category: 'goods',
    date: '2026-10-28',
    subtotal: 100000,
    discount: 0,
    cgst: 2500,
    sgst: 2500,
    igst: 0,
    total: 105000,
    paid_amount: 0,
    status: 'unpaid',
    items: [{ id: 'ii-4', invoice_id: 'inv-3', item_id: 'i-1', name: 'Rice 25kg', hsn: '1006', qty: 1, unit: 'bag', price: 100000, gst_rate: 5, amount: 100000 }],
  },
  {
    id: 'inv-4',
    business_id: 'b-1',
    party_id: 'p-4',
    party_name: 'Khan Traders',
    billing_address: 'Chandni Chowk, Delhi',
    invoice_no: 'INV-2026-27-0003',
    type: 'sale',
    doc_type: 'tax_invoice',
    supply_category: 'goods',
    date: '2026-11-03',
    subtotal: 18000,
    discount: 0,
    cgst: 0,
    sgst: 0,
    igst: 900,
    total: 18900,
    paid_amount: 0,
    status: 'unpaid',
    items: [{ id: 'ii-5', invoice_id: 'inv-4', item_id: 'i-4', name: 'Cooking Oil 1L', hsn: '1512', qty: 1, unit: 'ltr', price: 18000, gst_rate: 5, amount: 18000 }],
  },
  {
    id: 'inv-5',
    business_id: 'b-2',
    party_id: 'p-5',
    party_name: 'Joshi Stores',
    billing_address: 'Laxmi Road, Pune, Maharashtra',
    invoice_no: 'INV-2026-27-0004',
    type: 'sale',
    doc_type: 'tax_invoice',
    supply_category: 'goods',
    date: '2026-11-03',
    subtotal: 9000,
    discount: 0,
    cgst: 225,
    sgst: 225,
    igst: 0,
    total: 9450,
    paid_amount: 9450,
    status: 'paid',
    items: [{ id: 'ii-6', invoice_id: 'inv-5', item_id: 'i-6', name: 'Tea 250g', hsn: '0902', qty: 1, unit: 'pkt', price: 9000, gst_rate: 5, amount: 9000 }],
  },
];

export const mockPayments: Payment[] = [
  { id: 'pay-1', business_id: 'b-1', party_id: 'p-1', party_name: 'Sharma Retail', invoice_id: 'inv-1', amount: 100000, mode: 'upi', direction: 'in', date: '2026-11-01' },
  { id: 'pay-2', business_id: 'b-1', party_id: 'p-2', party_name: 'Patel Wholesale', invoice_id: 'inv-2', amount: 47250, mode: 'cash', direction: 'in', date: '2026-11-02' },
  { id: 'pay-3', business_id: 'b-1', party_id: 'p-3', party_name: 'Mehta Distributors', invoice_id: 'inv-3', amount: 0, mode: 'bank', direction: 'out', date: '2026-10-28' },
  { id: 'pay-4', business_id: 'b-2', party_id: 'p-5', party_name: 'Joshi Stores', invoice_id: 'inv-5', amount: 9450, mode: 'cash', direction: 'in', date: '2026-11-03' },
];

export const mockExpenses = [
  { id: 'exp-1', business_id: 'b-1', category: 'Rent', amount: 1500000, date: '2026-11-01', note: 'Monthly shop lease', account: 'bank' },
  { id: 'exp-2', business_id: 'b-1', category: 'Electricity', amount: 245000, date: '2026-10-28', note: 'MSEDCL electricity bill', account: 'bank' },
  { id: 'exp-3', business_id: 'b-1', category: 'Salary', amount: 1200000, date: '2026-11-01', note: 'Staff salary', account: 'bank' },
  { id: 'exp-4', business_id: 'b-1', category: 'Tea & Refreshments', amount: 85000, date: '2026-11-02', note: 'Customer tea & snacks', account: 'cash' },
];

export const mockBankAccounts = [
  { id: 'b-acc-1', business_id: 'b-1', bankName: 'HDFC Bank', accountNo: '...4819', balance: 4520000 },
  { id: 'b-acc-2', business_id: 'b-1', bankName: 'State Bank of India', accountNo: '...9012', balance: 1835000 },
];
