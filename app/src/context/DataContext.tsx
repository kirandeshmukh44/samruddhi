// app/src/context/DataContext.tsx
// Centralized single-source-of-truth store for BiLU ERP.
// Manages parties, items, invoices, payments, expenses, cash, and bank accounts.

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Party, Item, Invoice, Payment } from '../types';
import {
  mockParties,
  mockItems,
  mockInvoices,
  mockPayments,
  mockExpenses,
  mockBankAccounts,
} from '../services/mockData';
import { generateNextInvoiceNumber } from '../lib/invoiceNo';
import { getInvoiceDerivedStatus, ExpenseItem, BankAccount } from '../lib/selectors';

interface DataContextType {
  parties: Party[];
  items: Item[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: ExpenseItem[];
  cashInHand: number; // paise
  bankAccounts: BankAccount[];
  loading: boolean;
  addParty: (party: Omit<Party, 'id'>) => Promise<Party>;
  addItem: (item: Omit<Item, 'id'>) => Promise<Item>;
  adjustItemStock: (itemId: string, deltaQty: number) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoice_no' | 'status'> & { invoice_no?: string }) => Promise<Invoice>;
  recordPayment: (payment: Omit<Payment, 'id'>) => Promise<Payment>;
  addExpense: (expense: Omit<ExpenseItem, 'id'>) => Promise<ExpenseItem>;
  resetDemoData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

const STORAGE_KEY = '@bilu_erp_store_v1';

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [parties, setParties] = useState<Party[]>(mockParties);
  const [items, setItems] = useState<Item[]>(mockItems);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(mockExpenses as ExpenseItem[]);
  const [cashInHand, setCashInHand] = useState<number>(1450000); // 14,500.00 Rs in paise
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(mockBankAccounts);
  const [loading, setLoading] = useState<boolean>(true);

  // Load from local storage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          if (data.parties) setParties(data.parties);
          if (data.items) setItems(data.items);
          if (data.invoices) setInvoices(data.invoices);
          if (data.payments) setPayments(data.payments);
          if (data.expenses) setExpenses(data.expenses);
          if (typeof data.cashInHand === 'number') setCashInHand(data.cashInHand);
          if (data.bankAccounts) setBankAccounts(data.bankAccounts);
        }
      } catch (e) {
        // Fallback to in-memory state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Persist state changes
  const saveState = async (updates: any) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          parties,
          items,
          invoices,
          payments,
          expenses,
          cashInHand,
          bankAccounts,
          ...updates,
        })
      );
    } catch (e) {
      // Ignore write errors
    }
  };

  const addParty = async (partyData: Omit<Party, 'id'>): Promise<Party> => {
    const newParty: Party = {
      ...partyData,
      id: `p-${Date.now()}`,
    };
    const updated = [newParty, ...parties];
    setParties(updated);
    await saveState({ parties: updated });
    return newParty;
  };

  const addItem = async (itemData: Omit<Item, 'id'>): Promise<Item> => {
    const newItem: Item = {
      ...itemData,
      id: `i-${Date.now()}`,
    };
    const updated = [newItem, ...items];
    setItems(updated);
    await saveState({ items: updated });
    return newItem;
  };

  const adjustItemStock = async (itemId: string, deltaQty: number): Promise<void> => {
    const updated = items.map((it) =>
      it.id === itemId ? { ...it, stock_qty: Math.max(0, it.stock_qty + deltaQty) } : it
    );
    setItems(updated);
    await saveState({ items: updated });
  };

  const addInvoice = async (
    invData: Omit<Invoice, 'id' | 'invoice_no' | 'status'> & { invoice_no?: string }
  ): Promise<Invoice> => {
    const invoiceNo =
      invData.invoice_no || generateNextInvoiceNumber(invData.type, invoices);

    const paid = invData.paid_amount || 0;
    const status = getInvoiceDerivedStatus({ ...invData, paid_amount: paid } as Invoice);

    const newInvoice: Invoice = {
      ...invData,
      id: `inv-${Date.now()}`,
      invoice_no: invoiceNo,
      paid_amount: paid,
      status,
    };

    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);

    // Auto-create payment entry if money received/paid on bill creation
    let updatedPayments = payments;
    if (paid > 0) {
      const newPay: Payment = {
        id: `pay-${Date.now()}`,
        business_id: newInvoice.business_id,
        party_id: newInvoice.party_id,
        party_name: newInvoice.party_name,
        invoice_id: newInvoice.id,
        amount: paid,
        mode: 'cash',
        direction: newInvoice.type === 'sale' ? 'in' : 'out',
        date: newInvoice.date,
        note: `Payment for ${invoiceNo}`,
      };
      updatedPayments = [newPay, ...payments];
      setPayments(updatedPayments);
    }

    // Auto-update stock for line items
    let updatedItems = items;
    if (newInvoice.items && newInvoice.items.length > 0) {
      updatedItems = items.map((it) => {
        const line = newInvoice.items.find((li) => li.item_id === it.id || li.name.toLowerCase() === it.name.toLowerCase());
        if (line) {
          const delta = newInvoice.type === 'sale' ? -line.qty : line.qty;
          return { ...it, stock_qty: Math.max(0, it.stock_qty + delta) };
        }
        return it;
      });
      setItems(updatedItems);
    }

    await saveState({
      invoices: updatedInvoices,
      payments: updatedPayments,
      items: updatedItems,
    });

    return newInvoice;
  };

  const recordPayment = async (payData: Omit<Payment, 'id'>): Promise<Payment> => {
    const newPay: Payment = {
      ...payData,
      id: `pay-${Date.now()}`,
    };
    const updatedPayments = [newPay, ...payments];
    setPayments(updatedPayments);

    // If linked to an invoice, update invoice paid_amount and re-derive status
    let updatedInvoices = invoices;
    if (newPay.invoice_id) {
      updatedInvoices = invoices.map((inv) => {
        if (inv.id === newPay.invoice_id || inv.invoice_no === newPay.invoice_id) {
          const updatedPaid = (inv.paid_amount || 0) + newPay.amount;
          const status = getInvoiceDerivedStatus({ ...inv, paid_amount: updatedPaid });
          return { ...inv, paid_amount: updatedPaid, status };
        }
        return inv;
      });
      setInvoices(updatedInvoices);
    }

    await saveState({
      payments: updatedPayments,
      invoices: updatedInvoices,
    });

    return newPay;
  };

  const addExpense = async (expData: Omit<ExpenseItem, 'id'>): Promise<ExpenseItem> => {
    const newExp: ExpenseItem = {
      ...expData,
      id: `exp-${Date.now()}`,
    };
    const updatedExpenses = [newExp, ...expenses];
    setExpenses(updatedExpenses);

    // Deduct from cash or bank
    let updatedCash = cashInHand;
    let updatedBanks = bankAccounts;

    if (newExp.account === 'cash' || !newExp.account) {
      updatedCash = Math.max(0, cashInHand - newExp.amount);
      setCashInHand(updatedCash);
    } else {
      updatedBanks = bankAccounts.map((b) =>
        b.id === newExp.account || b.bankName === newExp.account
          ? { ...b, balance: Math.max(0, b.balance - newExp.amount) }
          : b
      );
      setBankAccounts(updatedBanks);
    }

    await saveState({
      expenses: updatedExpenses,
      cashInHand: updatedCash,
      bankAccounts: updatedBanks,
    });

    return newExp;
  };

  const resetDemoData = async (): Promise<void> => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setParties(mockParties);
    setItems(mockItems);
    setInvoices(mockInvoices);
    setPayments(mockPayments);
    setExpenses(mockExpenses as ExpenseItem[]);
    setCashInHand(1450000);
    setBankAccounts(mockBankAccounts);
  };

  return (
    <DataContext.Provider
      value={{
        parties,
        items,
        invoices,
        payments,
        expenses,
        cashInHand,
        bankAccounts,
        loading,
        addParty,
        addItem,
        adjustItemStock,
        addInvoice,
        recordPayment,
        addExpense,
        resetDemoData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData must be used within a DataProvider');
  }
  return ctx;
}

