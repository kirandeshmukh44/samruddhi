// app/src/services/invoices.ts
import axios from 'axios';
import { USE_MOCK, API_BASE_URL } from '../config';
import { mockInvoices, mockPayments, mockItems, mockParties } from './mockData';
import { Invoice, Payment } from '../types';
import safeStorage from '../lib/storage';

const INVOICES_STORAGE_KEY = 'bilu_invoices_data_v2';
const PAYMENTS_STORAGE_KEY = 'bilu_payments_data_v2';

let invoices = [...mockInvoices];
let payments = [...mockPayments];

// Auto-load persisted invoices & payments on startup
const loadStoredData = async () => {
  try {
    const invData = await safeStorage.getItem(INVOICES_STORAGE_KEY);
    if (invData) {
      const parsed = JSON.parse(invData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        invoices = parsed;
        mockInvoices.splice(0, mockInvoices.length, ...parsed);
      }
    }

    const payData = await safeStorage.getItem(PAYMENTS_STORAGE_KEY);
    if (payData) {
      const parsedPay = JSON.parse(payData);
      if (Array.isArray(parsedPay) && parsedPay.length > 0) {
        payments = parsedPay;
        mockPayments.splice(0, mockPayments.length, ...parsedPay);
      }
    }
  } catch (e) {
    console.warn('Error loading stored invoices/payments:', e);
  }
};
loadStoredData();

const persistInvoices = () => {
  safeStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices)).catch(() => {});
  mockInvoices.splice(0, mockInvoices.length, ...invoices);
};

const persistPayments = () => {
  safeStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(payments)).catch(() => {});
  mockPayments.splice(0, mockPayments.length, ...payments);
};

export async function listInvoices(businessId: string, type?: 'sale' | 'purchase'): Promise<Invoice[]> {
  if (USE_MOCK) {
    return invoices.filter((inv) => inv.business_id === businessId && (type ? inv.type === type : true));
  }
  try {
    const res = await axios.get(`${API_BASE_URL}/businesses/${businessId}/invoices`, { params: { type } });
    if (res.data?.invoices) return res.data.invoices;
    return res.data;
  } catch (e) {
    return invoices.filter((inv) => inv.business_id === businessId && (type ? inv.type === type : true));
  }
}

export async function getInvoice(id: string): Promise<Invoice | undefined> {
  if (USE_MOCK) return invoices.find((inv) => inv.id === id);
  try {
    const res = await axios.get(`${API_BASE_URL}/invoices/${id}`);
    return res.data;
  } catch (e) {
    return invoices.find((inv) => inv.id === id);
  }
}

export async function createInvoice(inv: Omit<Invoice, 'id'>): Promise<Invoice> {
  const created: Invoice = {
    ...inv,
    id: `inv-${Date.now()}`,
    status:
      inv.paid_amount >= inv.total
        ? 'paid'
        : inv.paid_amount > 0
        ? 'partial'
        : 'unpaid',
  };

  // 1. Prepend to in-memory list and persist
  invoices.unshift(created);
  persistInvoices();

  // 2. Adjust Stock for all item lines in this invoice
  if (inv.items && Array.isArray(inv.items)) {
    inv.items.forEach((line) => {
      const match = mockItems.find((it) => it.name.trim().toLowerCase() === line.name.trim().toLowerCase());
      if (match) {
        if (inv.type === 'sale') {
          match.stock_qty = Math.max(0, match.stock_qty - line.qty);
        } else {
          match.stock_qty += line.qty;
        }
      }
    });
    // Persist items stock
    safeStorage.setItem('bilu_items_data_v2', JSON.stringify(mockItems)).catch(() => {});
  }

  // 3. Update Party Balance if applicable
  if (inv.party_id) {
    const party = mockParties.find((p) => p.id === inv.party_id);
    if (party) {
      const due = inv.total - (inv.paid_amount || 0);
      if (inv.type === 'sale') {
        party.balance = (party.balance || 0) + due;
      } else {
        party.balance = (party.balance || 0) - due;
      }
      safeStorage.setItem('bilu_parties_data_v2', JSON.stringify(mockParties)).catch(() => {});
    }
  }

  // 4. Auto-generate Payment record if paid_amount > 0
  if (inv.paid_amount && inv.paid_amount > 0) {
    const autoPayment: Payment = {
      id: `pay-${Date.now()}`,
      business_id: inv.business_id,
      party_id: inv.party_id,
      party_name: inv.party_name,
      invoice_id: created.id,
      invoice_no: inv.invoice_no,
      amount: inv.paid_amount,
      mode: 'cash',
      type: inv.type === 'sale' ? 'in' : 'out',
      date: inv.date,
      notes: `Auto payment for ${inv.invoice_no}`,
    };
    payments.unshift(autoPayment);
    persistPayments();
  }

  // 5. Try syncing to API if available
  if (!USE_MOCK) {
    try {
      await axios.post(`${API_BASE_URL}/businesses/${inv.business_id}/invoices`, inv);
    } catch (e) {
      console.warn('API sync failed, saved locally in BiLU ERP storage:', e);
    }
  }

  return created;
}

export async function listPayments(businessId: string): Promise<Payment[]> {
  if (USE_MOCK) return payments.filter((p) => p.business_id === businessId);
  try {
    const res = await axios.get(`${API_BASE_URL}/businesses/${businessId}/payments`);
    return res.data;
  } catch (e) {
    return payments.filter((p) => p.business_id === businessId);
  }
}

export async function createPayment(
  businessIdOrPay: string | Omit<Payment, 'id'>,
  payData?: any
): Promise<Payment> {
  const pay: Omit<Payment, 'id'> =
    typeof businessIdOrPay === 'string'
      ? { ...payData, business_id: businessIdOrPay }
      : businessIdOrPay;

  const created: Payment = {
    ...pay,
    id: `pay-${Date.now()}`,
  };
  payments.unshift(created);
  persistPayments();

  // If payment is linked to invoice, adjust paid_amount on invoice
  if (pay.invoice_id || pay.invoice_no) {
    const inv = invoices.find((i) => i.id === pay.invoice_id || i.invoice_no === pay.invoice_no);
    if (inv) {
      inv.paid_amount = (inv.paid_amount || 0) + pay.amount;
      if (inv.paid_amount >= inv.total) {
        inv.status = 'paid';
      } else if (inv.paid_amount > 0) {
        inv.status = 'partial';
      }
      persistInvoices();
    }
  }

  if (!USE_MOCK) {
    try {
      await axios.post(`${API_BASE_URL}/businesses/${pay.business_id}/payments`, pay);
    } catch (e) {
      console.warn('API payment sync failed, saved locally in BiLU ERP storage:', e);
    }
  }

  return created;
}

export const recordPayment = createPayment;
