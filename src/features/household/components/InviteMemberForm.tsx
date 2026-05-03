"use client";



import { useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { useQueryClient } from "@tanstack/react-query";



import { Button } from "@/components/ui/button";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

import { FormCallout } from "@/components/ui/form-callout";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { NativeSelect } from "@/components/ui/native-select";

import {

  inviteMemberSchema,

  type InviteMemberSchema,

} from "@/features/household/schemas/household.schemas";

import { membershipService } from "@/features/household/services/membership.service";

import { qk } from "@/lib/query-keys";



export function InviteMemberForm({ householdId }: { householdId: string }) {

  const queryClient = useQueryClient();

  const [msg, setMsg] = useState<string | null>(null);

  const [err, setErr] = useState<string | null>(null);

  const form = useForm<InviteMemberSchema>({

    resolver: zodResolver(inviteMemberSchema),

    defaultValues: { email: "", role: "contributor" },

  });



  async function onSubmit(values: InviteMemberSchema) {

    setErr(null);

    setMsg(null);

    try {

      await membershipService.inviteMember(householdId, values);

      form.reset({ email: "", role: values.role });

      setMsg("Invitation sent.");

      await queryClient.invalidateQueries({

        queryKey: qk.members(householdId),

      });

    } catch (e: unknown) {

      setErr(e instanceof Error ? e.message : "Invite failed");

    }

  }



  return (

    <Card className="border-input/85 shadow-soft">

      <CardHeader>

        <h2 className="text-lg font-semibold tracking-tight">Invite member</h2>

        <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">

          They must use the same email in Supabase Auth. New users receive an invite

          email if your project supports it.

        </p>

      </CardHeader>

      <form onSubmit={form.handleSubmit(onSubmit)}>

        <CardContent className="flex flex-col gap-5">

          {err ? <FormCallout tone="destructive">{err}</FormCallout> : null}

          {msg ? <FormCallout tone="neutral">{msg}</FormCallout> : null}

          <div className="space-y-2.5">

            <Label htmlFor="invite-email">Email</Label>

            <Input

              id="invite-email"

              type="email"

              autoComplete="off"

              {...form.register("email")}

            />

            {form.formState.errors.email ? (

              <p className="text-xs font-medium leading-relaxed text-destructive">

                {form.formState.errors.email.message}

              </p>

            ) : null}

          </div>

          <div className="space-y-2.5">

            <Label htmlFor="invite-role">Role</Label>

            <NativeSelect id="invite-role" {...form.register("role")}>

              <option value="contributor">Contributor</option>

              <option value="viewer">Viewer</option>

            </NativeSelect>

          </div>

        </CardContent>

        <CardFooter className="pb-[1.5rem] pt-2">

          <Button

            type="submit"

            className="w-full rounded-2xl"

            size="lg"

            disabled={form.formState.isSubmitting}

          >

            {form.formState.isSubmitting ? "Sending…" : "Send invite"}

          </Button>

        </CardFooter>

      </form>

    </Card>

  );

}

