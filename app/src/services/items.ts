// app/src/services/items.ts
import axios from 'axios';
import { USE_MOCK, API_BASE_URL } from '../config';
import { mockItems } from './mockData';
import { Item } from '../types';
import safeStorage from '../lib/storage';

const ITEMS_STORAGE_KEY = 'samruddhi_items_data';
let items = [...mockItems];

// Auto-load persisted items on startup
safeStorage.getItem(ITEMS_STORAGE_KEY).then((data) => {
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        items = parsed;
        mockItems.splice(0, mockItems.length, ...parsed);
      }
    } catch (e) {}
  }
});

const persistItems = () => {
  safeStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  mockItems.splice(0, mockItems.length, ...items);
};

export async function listItems(businessId: string): Promise<Item[]> {
  if (USE_MOCK) return items.filter((i) => i.business_id === businessId);
  const res = await axios.get(`${API_BASE_URL}/items`, { params: { business_id: businessId } });
  return res.data;
}

export async function createItem(item: Omit<Item, 'id'>): Promise<Item> {
  if (USE_MOCK) {
    const created = { ...item, id: `i-${Date.now()}` };
    items.push(created);
    persistItems();
    return created;
  }
  const res = await axios.post(`${API_BASE_URL}/items`, item);
  return res.data;
}

export async function updateItem(id: string, data: Partial<Item>): Promise<Item> {
  if (USE_MOCK) {
    const idx = items.findIndex((i) => i.id === id);
    if (idx >= 0) items[idx] = { ...items[idx], ...data };
    persistItems();
    return items[idx];
  }
  const res = await axios.put(`${API_BASE_URL}/items/${id}`, data);
  return res.data;
}

export async function deleteItem(id: string): Promise<void> {
  if (USE_MOCK) {
    items = items.filter((i) => i.id !== id);
    persistItems();
    return;
  }
  await axios.delete(`${API_BASE_URL}/items/${id}`);
}

export async function adjustStock(id: string, delta: number, note?: string): Promise<void> {
  if (USE_MOCK) {
    const it = items.find((i) => i.id === id);
    if (it) it.stock_qty += delta;
    persistItems();
    return;
  }
  await axios.post(`${API_BASE_URL}/items/${id}/adjust`, { qty_change: delta * 1000, reason: 'adjustment', note });
}
