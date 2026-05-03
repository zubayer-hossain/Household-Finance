"use client";

import { create } from "zustand";

export interface TransactionUiFilters {
  year: number;
  month: number;
  categoryId: string | null;
}

interface TransactionUiStore {
  filters: TransactionUiFilters;
  setFilters: (partial: Partial<TransactionUiFilters>) => void;
  detailTransactionId: string | null;
  setDetailTransactionId: (id: string | null) => void;
  createSheetOpen: boolean;
  setCreateSheetOpen: (open: boolean) => void;
  editTransactionId: string | null;
  setEditTransactionId: (id: string | null) => void;
}

function todayParts(): { year: number; month: number } {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export const useTransactionUiStore = create<TransactionUiStore>((set) => ({
  filters: {
    ...todayParts(),
    categoryId: null,
  },
  setFilters: (partial) =>
    set((s) => ({ filters: { ...s.filters, ...partial } })),
  detailTransactionId: null,
  setDetailTransactionId: (id) => set({ detailTransactionId: id }),
  createSheetOpen: false,
  setCreateSheetOpen: (open) => set({ createSheetOpen: open }),
  editTransactionId: null,
  setEditTransactionId: (id) => set({ editTransactionId: id }),
}));
