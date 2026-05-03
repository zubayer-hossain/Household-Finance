"use client";

import type { HouseholdRole } from "@/features/household/types";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const roleCopy: Record<HouseholdRole, string> = {
  owner: "Owner",
  admin: "Admin",
  contributor: "Contributor",
  viewer: "Viewer",
};

const roleVariant: Record<HouseholdRole, "default" | "primary" | "outline"> = {
  owner: "primary",
  admin: "primary",
  contributor: "outline",
  viewer: "outline",
};

export function RoleBadge({
  role,
  className,
}: {
  role: HouseholdRole | string;
  className?: string;
}) {
  const r = role as HouseholdRole;
  return (
    <Badge
      variant={roleVariant[r] ?? "default"}
      className={cn("tabular-nums", className)}
    >
      {roleCopy[r] ?? role}
    </Badge>
  );
}
