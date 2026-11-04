// app/src/services/businesses.ts
import { USE_MOCK, API_BASE_URL } from '../config';
import axios from 'axios';
import { mockBusinesses } from './mockData';
import { Business } from '../types';

let businesses = [...mockBusinesses];

export async function listBusinesses(ownerId: string): Promise<Business[]> {
  if (USE_MOCK) return businesses.filter((b) => b.owner_id === ownerId);
  const res = await axios.get(`${API_BASE_URL}/businesses`, { params: { owner_id: ownerId } });
  return res.data;
}

export async function createBusiness(b: Omit<Business, 'id'>): Promise<Business> {
  if (USE_MOCK) {
    const created = { ...b, id: `b-${Date.now()}` };
    businesses.push(created);
    return created;
  }
  const res = await axios.post(`${API_BASE_URL}/businesses`, b);
  return res.data;
}

export async function updateBusiness(id: string, data: Partial<Business>): Promise<Business> {
  if (USE_MOCK) {
    const idx = businesses.findIndex((b) => b.id === id);
    if (idx >= 0) businesses[idx] = { ...businesses[idx], ...data };
    return businesses[idx];
  }
  const res = await axios.put(`${API_BASE_URL}/businesses/${id}`, data);
  return res.data;
}
