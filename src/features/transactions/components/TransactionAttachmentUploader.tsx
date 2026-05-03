"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function TransactionAttachmentUploader({
  id,
  disabled,
  pending,
  onFile,
  className,
}: {
  id: string;
  disabled?: boolean;
  pending?: boolean;
  onFile: (file: File) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id} className="text-[13px] font-semibold">
        Attach receipt
      </Label>
      <Input
        id={id}
        type="file"
        accept="image/*,application/pdf"
        disabled={disabled || pending}
        className="cursor-pointer rounded-xl text-[0.9375rem]"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <p className="text-xs text-muted-foreground">
        Images or PDF. One file per upload.
      </p>
    </div>
  );
}
