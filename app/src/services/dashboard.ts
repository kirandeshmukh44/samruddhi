// app/src/services/dashboard.ts
import { USE_MOCK } from '../config';
import { mockBusinesses, mockInvoices, mockItems, mockParties } from './mockData';
import { formatMoney } from '../lib/money';

export interface DashboardStats {
  todaySales: number; // paise
  todayPurchases: number; // paise
  toCollect: number; // paise
  toPay: number; // paise
  lowStockCount: number;
  recentInvoices: any[];
}

export async function getDashboard(businessId: string): Promise<DashboardStats> {
  if (USE_MOCK) {
    const invs = mockInvoices.filter((i) => i.business_id === businessId);
    const today = new Date().toISOString().slice(0, 10);
    const todaySalesInvs = invs.filter((i) => i.type === 'sale' && i.date === today);
    const todaySales = todaySalesInvs.length > 0
      ? todaySalesInvs.reduce((s, i) => s + i.total, 0)
      : invs.filter((i) => i.type === 'sale').slice(0, 2).reduce((s, i) => s + i.total, 0);

    const todayPurchasesInvs = invs.filter((i) => i.type === 'purchase' && i.date === today);
    const todayPurchases = todayPurchasesInvs.length > 0
      ? todayPurchasesInvs.reduce((s, i) => s + i.total, 0)
      : invs.filter((i) => i.type === 'purchase').slice(0, 1).reduce((s, i) => s + i.total, 0);

    const toCollect = invs.filter((i) => i.type === 'sale').reduce((s, i) => s + Math.max(0, i.total - (i.paid_amount || 0)), 0);
    const toPay = invs.filter((i) => i.type === 'purchase').reduce((s, i) => s + Math.max(0, i.total - (i.paid_amount || 0)), 0);
    const lowStockCount = mockItems.filter((it) => it.business_id === businessId && it.stock_qty <= it.low_stock_limit).length;
    const recentInvoices = invs.slice(0, 6);
    return { todaySales, todayPurchases, toCollect, toPay, lowStockCount, recentInvoices };
  }
  // Real API placeholder
  return { todaySales: 0, todayPurchases: 0, toCollect: 0, toPay: 0, lowStockCount: 0, recentInvoices: [] };
}

export { formatMoney };
