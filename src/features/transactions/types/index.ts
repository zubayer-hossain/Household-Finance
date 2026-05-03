export type TransactionStatus = "draft" | "posted" | "archived";

export type TransactionSourceType =
  | "manual"
  | "recurring"
  | "ai_draft"
  | "ai_approved";

export interface TransactionRow {
  id: string;
  household_id: string;
  monthly_budget_id: string;
  budget_category_id: string;
  created_by: string;
  amount: number;
  note: string | null;
  transaction_date: string;
  source_type: TransactionSourceType;
  status: TransactionStatus;
  attachment_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category_name: string | null;
}

export interface TransactionAttachmentRow {
  id: string;
  transaction_id: string;
  household_id: string;
  file_url: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}
