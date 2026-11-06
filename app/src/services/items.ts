// app/src/services/items.ts
import axios from 'axios';
import { USE_MOCK, API_BASE_URL } from '../config';
import { mockItems } from './mockData';
import { Item } from '../types';
import safeStorage from '../lib/storage';

const ITEMS_STORAGE_KEY = 'bilu_items_data_v2';
let items = [...mockItems];

// Auto-load persisted items on startup
const loadStoredItems = async () => {
  try {
    const data = await safeStorage.getItem(ITEMS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        items = parsed;
        mockItems.splice(0, mockItems.length, ...parsed);
      }
    }
  } catch (e) {
    console.warn('Error loading stored items:', e);
  }
};
loadStoredItems();

const persistItems = () => {
  safeStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  mockItems.splice(0, mockItems.length, ...items);
};

export async function listItems(businessId: string): Promise<Item[]> {
  if (USE_MOCK) return items.filter((i) => i.business_id === businessId);
  try {
    const res = await axios.get(`${API_BASE_URL}/businesses/${businessId}/items`);
    if (res.data?.items) return res.data.items;
    return res.data;
  } catch (e) {
    return items.filter((i) => i.business_id === businessId);
  }
}

export async function createItem(item: Omit<Item, 'id'>): Promise<Item> {
  const created = { ...item, id: `i-${Date.now()}` };
  items.unshift(created);
  persistItems();

  if (!USE_MOCK) {
    try {
      await axios.post(`${API_BASE_URL}/businesses/${item.business_id}/items`, item);
    } catch (e) {
      console.warn('API sync failed, saved in BiLU ERP local storage:', e);
    }
  }
  return created;
}

export async function updateItem(id: string, data: Partial<Item>): Promise<Item> {
  const idx = items.findIndex((i) => i.id === id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...data };
    persistItems();
  }

  if (!USE_MOCK) {
    try {
      await axios.put(`${API_BASE_URL}/items/${id}`, data);
    } catch (e) {}
  }
  return items[idx];
}

export async function deleteItem(id: string): Promise<void> {
  items = items.filter((i) => i.id !== id);
  persistItems();

  if (!USE_MOCK) {
    try {
      await axios.delete(`${API_BASE_URL}/items/${id}`);
    } catch (e) {}
  }
}

export async function adjustStock(id: string, delta: number, note?: string): Promise<void> {
  const it = items.find((i) => i.id === id);
  if (it) {
    it.stock_qty = Math.max(0, it.stock_qty + delta);
    persistItems();
  }

  if (!USE_MOCK) {
    try {
      await axios.post(`${API_BASE_URL}/items/${id}/adjust`, { qty_change: delta * 1000, reason: 'adjustment', note });
    } catch (e) {}
  }
}
