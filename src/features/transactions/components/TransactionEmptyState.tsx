"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/ui/empty-state";

export function TransactionEmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <EmptyState icon={icon} title={title} description={description}>
      {children}
    </EmptyState>
  );
}
