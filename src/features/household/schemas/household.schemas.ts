import { z } from "zod";

export const createHouseholdSchema = z.object({
  name: z.string().trim().min(1, "Household name is required"),
  baseCurrency: z.string().trim().length(3),
  timezone: z.string().trim().min(1),
});

export type CreateHouseholdSchema = z.infer<typeof createHouseholdSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().trim().email("Valid email required"),
  role: z.enum(["contributor", "viewer"]),
  /** Optional seed for roster + new invitee metadata; members confirm or edit when they accept. */
  fullName: z.string().max(120, "Name is too long").optional(),
});

export type InviteMemberSchema = z.infer<typeof inviteMemberSchema>;

export const updatePendingInviteNameSchema = z.object({
  householdId: z.string().uuid(),
  membershipId: z.string().uuid(),
  fullName: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
});

export type UpdatePendingInviteNameSchema = z.infer<typeof updatePendingInviteNameSchema>;

export const updateMemberRoleSchema = z.object({
  role: z.enum(["admin", "contributor", "viewer"]),
});

export type UpdateMemberRoleSchema = z.infer<typeof updateMemberRoleSchema>;

export const renameHouseholdSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Too long"),
});

export type RenameHouseholdSchema = z.infer<typeof renameHouseholdSchema>;
