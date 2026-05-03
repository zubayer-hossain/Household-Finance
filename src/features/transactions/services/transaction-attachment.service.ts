import { transactionService } from "@/features/transactions/services/transaction.service";
import type { TransactionAttachmentRow } from "@/features/transactions/types";
import { getSupabaseBrowser } from "@/services/supabase-client";

function asDbMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const e = err as { message?: string; details?: string; hint?: string };
    const text = [e.message, e.details, e.hint].filter(Boolean).join(" — ");
    if (text) return text;
  }
  return "Request failed";
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      }
    );
  });
}

/** Stored path may be bucket-relative or a full Supabase object URL. */
export function normalizeReceiptStoragePath(raw: string): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const noQuery = s.split("?")[0] ?? s;
  if (/^https?:\/\//i.test(noQuery)) {
    try {
      const u = new URL(s);
      const parts = u.pathname.split("/receipts/");
      if (parts.length > 1) {
        return decodeURIComponent(parts.slice(1).join("/receipts/"));
      }
    } catch {
      /* ignore */
    }
  }
  const idx = noQuery.indexOf("/receipts/");
  if (idx !== -1) {
    return decodeURIComponent(noQuery.slice(idx + "/receipts/".length));
  }
  return noQuery.replace(/^\/+/, "");
}

function mapAttachment(data: Record<string, unknown>): TransactionAttachmentRow {
  return {
    id: String(data.id),
    transaction_id: String(data.transaction_id),
    household_id: String(data.household_id),
    file_url: String(data.file_url),
    file_name: String(data.file_name),
    mime_type: String(data.mime_type),
    file_size:
      typeof data.file_size === "number"
        ? data.file_size
        : Number(data.file_size) || 0,
    uploaded_by: String(data.uploaded_by),
    created_at: String(data.created_at),
  };
}

export const transactionAttachmentService = {
  async listForTransaction(
    transactionId: string,
    householdId: string
  ): Promise<TransactionAttachmentRow[]> {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from("transaction_attachments")
      .select("*")
      .eq("transaction_id", transactionId)
      .eq("household_id", householdId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(asDbMessage(error));
    return (data ?? []).map((r) =>
      mapAttachment(r as unknown as Record<string, unknown>)
    );
  },

  async createSignedUrl(
    storagePath: string,
    expiresSec = 3600
  ): Promise<string> {
    const path = normalizeReceiptStoragePath(storagePath);
    if (!path) throw new Error("Missing receipt path.");
    const supabase = getSupabaseBrowser();
    const { data, error } = await withTimeout(
      supabase.storage.from("receipts").createSignedUrl(path, expiresSec),
      15_000,
      "Receipt link timed out"
    );

    if (error) throw new Error(asDbMessage(error));
    if (!data?.signedUrl) throw new Error("Could not create download link.");
    return data.signedUrl;
  },

  async upload(opts: {
    transactionId: string;
    householdId: string;
    file: File;
    actorUserId: string;
  }): Promise<TransactionAttachmentRow> {
    const supabase = getSupabaseBrowser();
    const safeName = opts.file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
    const path = `${opts.householdId}/${opts.actorUserId}/${crypto.randomUUID()}-${safeName}`;

    const { error: upErr } = await supabase.storage
      .from("receipts")
      .upload(path, opts.file, {
        upsert: false,
        contentType: opts.file.type || "application/octet-stream",
      });

    if (upErr) throw new Error(asDbMessage(upErr));

    const { data: row, error: insErr } = await supabase
      .from("transaction_attachments")
      .insert({
        transaction_id: opts.transactionId,
        household_id: opts.householdId,
        file_url: path,
        file_name: opts.file.name,
        mime_type: opts.file.type || "application/octet-stream",
        file_size: opts.file.size,
        uploaded_by: opts.actorUserId,
      })
      .select("*")
      .single();

    if (insErr) throw new Error(asDbMessage(insErr));

    const tx = await transactionService.getTransaction(
      opts.transactionId,
      opts.householdId
    );
    if (tx) {
      await supabase
        .from("transactions")
        .update({ attachment_count: tx.attachment_count + 1 })
        .eq("id", opts.transactionId)
        .eq("household_id", opts.householdId);
    }

    return mapAttachment(row as unknown as Record<string, unknown>);
  },

  async remove(opts: {
    attachmentId: string;
    transactionId: string;
    householdId: string;
    storagePath: string;
  }): Promise<void> {
    const supabase = getSupabaseBrowser();
    const path = normalizeReceiptStoragePath(opts.storagePath);
    if (!path) throw new Error("Missing receipt path.");

    const { error: delSt } = await supabase.storage
      .from("receipts")
      .remove([path]);

    if (delSt) throw new Error(asDbMessage(delSt));

    const { error } = await supabase
      .from("transaction_attachments")
      .delete()
      .eq("id", opts.attachmentId)
      .eq("household_id", opts.householdId);

    if (error) throw new Error(asDbMessage(error));

    const tx = await transactionService.getTransaction(
      opts.transactionId,
      opts.householdId
    );
    if (tx && tx.attachment_count > 0) {
      await supabase
        .from("transactions")
        .update({ attachment_count: tx.attachment_count - 1 })
        .eq("id", opts.transactionId)
        .eq("household_id", opts.householdId);
    }
  },
};
