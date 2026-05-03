"use client";

import { create } from "zustand";

interface CategoryUiStore {
  reorderOpen: boolean;
  setReorderOpen: (open: boolean) => void;
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  editCategoryId: string | null;
  setEditCategoryId: (id: string | null) => void;
}

export const useCategoryUiStore = create<CategoryUiStore>((set) => ({
  reorderOpen: false,
  setReorderOpen: (open) => set({ reorderOpen: open }),
  createOpen: false,
  setCreateOpen: (open) => set({ createOpen: open }),
  editCategoryId: null,
  setEditCategoryId: (id) => set({ editCategoryId: id }),
}));
