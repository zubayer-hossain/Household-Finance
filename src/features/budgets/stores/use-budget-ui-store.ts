import { create } from "zustand";

interface BudgetUiState {
  adjustmentDrawer:
    | null
    | { categoryId: string; mode: "elevated" | "direct" };
  reallocationOpen: boolean;
  approveDialogOpen: boolean;
  monthlyCloseDialogOpen: boolean;
  createBudgetDialogOpen: boolean;
  addCategoryModalOpen: boolean;
  setAdjustmentDrawer: (
    drawer: BudgetUiState["adjustmentDrawer"]
  ) => void;
  setReallocationOpen: (open: boolean) => void;
  setApproveDialogOpen: (open: boolean) => void;
  setMonthlyCloseDialogOpen: (open: boolean) => void;
  setCreateBudgetDialogOpen: (open: boolean) => void;
  setAddCategoryModalOpen: (open: boolean) => void;
}

export const useBudgetUiStore = create<BudgetUiState>((set) => ({
  adjustmentDrawer: null,
  reallocationOpen: false,
  approveDialogOpen: false,
  monthlyCloseDialogOpen: false,
  createBudgetDialogOpen: false,
  addCategoryModalOpen: false,
  setAdjustmentDrawer: (drawer) => set({ adjustmentDrawer: drawer }),
  setReallocationOpen: (open) => set({ reallocationOpen: open }),
  setApproveDialogOpen: (open) => set({ approveDialogOpen: open }),
  setMonthlyCloseDialogOpen: (open) => set({ monthlyCloseDialogOpen: open }),
  setCreateBudgetDialogOpen: (open) => set({ createBudgetDialogOpen: open }),
  setAddCategoryModalOpen: (open) => set({ addCategoryModalOpen: open }),
}));
