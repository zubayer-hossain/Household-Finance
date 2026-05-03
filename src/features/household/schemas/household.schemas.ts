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
});

export type InviteMemberSchema = z.infer<typeof inviteMemberSchema>;

export const renameHouseholdSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Too long"),
});

export type RenameHouseholdSchema = z.infer<typeof renameHouseholdSchema>;
