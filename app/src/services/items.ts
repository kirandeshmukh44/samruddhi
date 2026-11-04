// app/src/services/items.ts
import axios from 'axios';
import { USE_MOCK, API_BASE_URL } from '../config';
import { mockItems } from './mockData';
import { Item } from '../types';

let items = [...mockItems];

export async function listItems(businessId: string): Promise<Item[]> {
  if (USE_MOCK) return items.filter((i) => i.business_id === businessId);
  const res = await axios.get(`${API_BASE_URL}/items`, { params: { business_id: businessId } });
  return res.data;
}

export async function createItem(item: Omit<Item, 'id'>): Promise<Item> {
  if (USE_MOCK) {
    const created = { ...item, id: `i-${Date.now()}` };
    items.push(created);
    return created;
  }
  const res = await axios.post(`${API_BASE_URL}/items`, item);
  return res.data;
}

export async function updateItem(id: string, data: Partial<Item>): Promise<Item> {
  if (USE_MOCK) {
    const idx = items.findIndex((i) => i.id === id);
    if (idx >= 0) items[idx] = { ...items[idx], ...data };
    return items[idx];
  }
  const res = await axios.put(`${API_BASE_URL}/items/${id}`, data);
  return res.data;
}

export async function deleteItem(id: string): Promise<void> {
  if (USE_MOCK) {
    items = items.filter((i) => i.id !== id);
    return;
  }
  await axios.delete(`${API_BASE_URL}/items/${id}`);
}

export async function adjustStock(id: string, delta: number, note?: string): Promise<void> {
  if (USE_MOCK) {
    const it = items.find((i) => i.id === id);
    if (it) it.stock_qty += delta;
    return;
  }
  await axios.post(`${API_BASE_URL}/items/${id}/adjust`, { qty_change: delta * 1000, reason: 'adjustment', note });
}
