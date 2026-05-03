"use client";

import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { transactionAttachmentService } from "@/features/transactions/services/transaction-attachment.service";
import type { TransactionAttachmentRow } from "@/features/transactions/types";
import { cn } from "@/lib/utils";

function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "";
  const u = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n < 10 && i > 0 ? n.toFixed(1) : Math.round(n)} ${u[i]}`;
}

function isPdfAttachment(row: TransactionAttachmentRow): boolean {
  const m = row.mime_type.toLowerCase();
  if (m === "application/pdf" || m.includes("pdf")) return true;
  return /\.pdf$/i.test(row.file_name);
}

function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

export function TransactionAttachmentList({
  attachments,
  onRemove,
  canRemove,
  className,
  /** Use in narrow panels (e.g. expense modal): one column, full width — avoids squeezed cards. */
  singleColumn = false,
}: {
  attachments: TransactionAttachmentRow[];
  onRemove: (row: TransactionAttachmentRow) => void | Promise<void>;
  canRemove: (row: TransactionAttachmentRow) => boolean;
  className?: string;
  singleColumn?: boolean;
}) {
  return (
    <ul
      className={cn(
        "gap-3",
        singleColumn
          ? "flex flex-col"
          : "grid grid-cols-1 md:grid-cols-2",
        className
      )}
      aria-label="Receipts"
    >
      {attachments.map((a) => (
        <li key={a.id} className="min-w-0">
          {isImageMime(a.mime_type) ? (
            <ImageReceiptRow row={a} onRemove={onRemove} canRemove={canRemove(a)} />
          ) : (
            <FileReceiptRow
              row={a}
              onRemove={onRemove}
              canRemove={canRemove(a)}
              variant={isPdfAttachment(a) ? "pdf" : "file"}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

/** Non-image files: no preview — signed URL only when opening. */
function FileReceiptRow({
  row,
  onRemove,
  canRemove,
  variant,
}: {
  row: TransactionAttachmentRow;
  onRemove: (row: TransactionAttachmentRow) => void | Promise<void>;
  canRemove: boolean;
  variant: "pdf" | "file";
}) {
  const [openBusy, setOpenBusy] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sizeLabel = formatFileSize(row.file_size);

  async function handleOpen() {
    setOpenError(null);
    setOpenBusy(true);
    try {
      const url = await transactionAttachmentService.createSignedUrl(row.file_url);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setOpenError(e instanceof Error ? e.message : "Could not open file");
    } finally {
      setOpenBusy(false);
    }
  }

  const badge = variant === "pdf" ? "PDF" : "FILE";
  const openLabel = openBusy
    ? "Opening…"
    : variant === "pdf"
      ? "Open PDF"
      : "Open";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/85 bg-muted/40 p-4 sm:flex-row sm:items-start sm:gap-4">
      <div
        className={cn(
          "flex size-14 shrink-0 items-center justify-center rounded-xl",
          variant === "pdf"
            ? "bg-red-600/10 text-red-700 dark:text-red-400"
            : "bg-muted text-muted-foreground"
        )}
        aria-hidden
      >
        <FileText className="size-7" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <p className="break-words text-[13px] font-semibold leading-snug text-foreground [overflow-wrap:anywhere]">
          {row.file_name}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ring-1 ring-border/80">
            {badge}
          </span>
          {sizeLabel ? (
            <span className="text-[11px] text-muted-foreground">{sizeLabel}</span>
          ) : null}
        </div>
        {openError ? (
          <p className="text-[11px] font-medium text-destructive">{openError}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-row flex-wrap items-center justify-start gap-2 sm:justify-end sm:pt-0.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg px-3 py-2 text-[13px]"
          onClick={() => void handleOpen()}
          disabled={openBusy}
        >
          {openLabel}
        </Button>
        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-lg text-destructive hover:bg-destructive/10"
            onClick={() => {
              setBusy(true);
              void Promise.resolve(onRemove(row)).finally(() => setBusy(false));
            }}
            disabled={busy}
          >
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function ImageReceiptRow({
  row,
  onRemove,
  canRemove,
}: {
  row: TransactionAttachmentRow;
  onRemove: (row: TransactionAttachmentRow) => void | Promise<void>;
  canRemove: boolean;
}) {
  const [href, setHref] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewBroken, setPreviewBroken] = useState(false);

  const fetchId = useRef(0);
  const showImagePreview = isImageMime(row.mime_type);

  useEffect(() => {
    if (!showImagePreview) {
      setLoading(false);
      setHref(null);
      setLoadError(null);
      return;
    }
    const id = ++fetchId.current;
    setLoading(true);
    setLoadError(null);
    setPreviewBroken(false);
    void (async () => {
      try {
        const url = await transactionAttachmentService.createSignedUrl(row.file_url);
        if (fetchId.current !== id) return;
        setHref(url);
      } catch (e) {
        if (fetchId.current !== id) return;
        setHref(null);
        setLoadError(e instanceof Error ? e.message : "Could not load receipt");
      } finally {
        if (fetchId.current === id) setLoading(false);
      }
    })();
  }, [row.file_url, showImagePreview]);

  const preview =
    showImagePreview && href && !previewBroken ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border/80"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- signed Supabase URL */}
        <img
          src={href}
          alt={row.file_name}
          width={112}
          height={112}
          className="size-28 object-cover md:size-36"
          loading="lazy"
          decoding="async"
          onError={() => setPreviewBroken(true)}
        />
      </a>
    ) : showImagePreview && loading ? (
      <div
        className="size-28 shrink-0 animate-pulse rounded-xl bg-muted ring-1 ring-border/60 md:size-36"
        aria-hidden
      />
    ) : null;

  const showFileIcon =
    !showImagePreview || previewBroken || !href;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/85 bg-muted/40 p-4 sm:flex-row sm:items-start sm:gap-5 md:gap-6">
      {preview ? <div className="shrink-0 self-start">{preview}</div> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          {showFileIcon ? (
            <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          ) : null}
          <span className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-foreground break-words [overflow-wrap:anywhere]">
            {row.file_name}
          </span>
        </div>
        <div className="flex flex-wrap items-stretch gap-2 sm:pt-0.5">
          {href ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-lg px-3 py-2 text-[13px]"
            >
              <a href={href} target="_blank" rel="noopener noreferrer">
                {showImagePreview && !previewBroken ? "Open full size" : "Open"}
              </a>
            </Button>
          ) : loading ? (
            <span className="self-center text-xs text-muted-foreground">Preparing…</span>
          ) : loadError ? (
            <span
              className="max-w-full self-center text-xs text-destructive"
              title={loadError}
            >
              {loadError.length > 64 ? `${loadError.slice(0, 61)}…` : loadError}
            </span>
          ) : (
            <span className="self-center text-xs text-muted-foreground">Unavailable</span>
          )}
          {canRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-lg text-destructive hover:bg-destructive/10"
              onClick={() => {
                setBusy(true);
                void Promise.resolve(onRemove(row)).finally(() => setBusy(false));
              }}
              disabled={busy}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
