// app/src/services/invoices.ts
import axios from 'axios';
import { USE_MOCK, API_BASE_URL } from '../config';
import { mockInvoices, mockPayments } from './mockData';
import { Invoice, Payment } from '../types';
import safeStorage from '../lib/storage';

const INVOICES_STORAGE_KEY = 'samruddhi_invoices_data';
const PAYMENTS_STORAGE_KEY = 'samruddhi_payments_data';

let invoices = [...mockInvoices];
let payments = [...mockPayments];

// Auto-load persisted invoices & payments on startup
safeStorage.getItem(INVOICES_STORAGE_KEY).then((data) => {
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        invoices = parsed;
        mockInvoices.splice(0, mockInvoices.length, ...parsed);
      }
    } catch (e) {}
  }
});

safeStorage.getItem(PAYMENTS_STORAGE_KEY).then((data) => {
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        payments = parsed;
        mockPayments.splice(0, mockPayments.length, ...parsed);
      }
    } catch (e) {}
  }
});

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
  const res = await axios.get(`${API_BASE_URL}/invoices`, { params: { business_id: businessId, type } });
  return res.data;
}

export async function getInvoice(id: string): Promise<Invoice | undefined> {
  if (USE_MOCK) return invoices.find((inv) => inv.id === id);
  const res = await axios.get(`${API_BASE_URL}/invoices/${id}`);
  return res.data;
}

export async function createInvoice(inv: Omit<Invoice, 'id'>): Promise<Invoice> {
  if (USE_MOCK) {
    const created = { ...inv, id: `inv-${Date.now()}` };
    invoices.unshift(created);
    persistInvoices();
    return created;
  }
  const res = await axios.post(`${API_BASE_URL}/invoices`, inv);
  return res.data;
}

export async function listPayments(businessId: string): Promise<Payment[]> {
  if (USE_MOCK) return payments.filter((p) => p.business_id === businessId);
  const res = await axios.get(`${API_BASE_URL}/payments`, { params: { business_id: businessId } });
  return res.data;
}

export async function createPayment(
  businessIdOrPay: string | Omit<Payment, 'id'>,
  payData?: any
): Promise<Payment> {
  const pay: Omit<Payment, 'id'> =
    typeof businessIdOrPay === 'string'
      ? { ...payData, business_id: businessIdOrPay }
      : businessIdOrPay;

  if (USE_MOCK) {
    const created = { ...pay, id: `pay-${Date.now()}` } as Payment;
    payments.unshift(created);
    persistPayments();
    return created;
  }
  const res = await axios.post(`${API_BASE_URL}/payments`, pay);
  return res.data;
}

export const recordPayment = createPayment;
