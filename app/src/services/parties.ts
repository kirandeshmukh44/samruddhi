// app/src/services/parties.ts
import axios from 'axios';
import { USE_MOCK, API_BASE_URL } from '../config';
import { mockParties } from './mockData';
import { Party } from '../types';

let parties = [...mockParties];

export async function listParties(businessId: string): Promise<Party[]> {
  if (USE_MOCK) return parties.filter((p) => p.business_id === businessId);
  const res = await axios.get(`${API_BASE_URL}/parties`, { params: { business_id: businessId } });
  return res.data;
}

export async function createParty(party: Omit<Party, 'id'>): Promise<Party> {
  if (USE_MOCK) {
    const created = { ...party, id: `p-${Date.now()}` };
    parties.push(created);
    return created;
  }
  const res = await axios.post(`${API_BASE_URL}/parties`, party);
  return res.data;
}

export async function updateParty(id: string, data: Partial<Party>): Promise<Party> {
  if (USE_MOCK) {
    const idx = parties.findIndex((p) => p.id === id);
    if (idx >= 0) parties[idx] = { ...parties[idx], ...data };
    return parties[idx];
  }
  const res = await axios.put(`${API_BASE_URL}/parties/${id}`, data);
  return res.data;
}

export async function deleteParty(id: string): Promise<void> {
  if (USE_MOCK) {
    parties = parties.filter((p) => p.id !== id);
    return;
  }
  await axios.delete(`${API_BASE_URL}/parties/${id}`);
}
