"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";

import { createPrepSetlist } from "@/features/setlist/actions/setlistActions";
import {
  addSetlistFormSchema,
  type AddSetlistFormValues,
} from "@/features/setlist/schemas/addSetlist";
import { TEAM_ROLE_OPTIONS, teamRoleLabel } from "@/lib/team-roles";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toastPromise } from "@/lib/app-toast";
import { cn } from "@/lib/utils";

export type LineupMemberOption = {
  id: string;
  username: string;
};

type AddSetlistDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMembers: LineupMemberOption[];
};

function makeDefaultLineup() {
  return TEAM_ROLE_OPTIONS.map((role) => ({ roleCode: role.code, memberId: null }));
}

export function AddSetlistDialog({ open, onOpenChange, teamMembers }: AddSetlistDialogProps) {
  const form = useForm<AddSetlistFormValues>({
    resolver: zodResolver(addSetlistFormSchema),
    defaultValues: {
      title: "",
      eventDate: new Date(),
      tracks: [{ youtubeUrl: "" }],
      lineup: makeDefaultLineup(),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tracks",
  });

  const eventDateValue = useWatch({ control: form.control, name: "eventDate" });

  const resetForm = () => {
    form.reset({
      title: "",
      eventDate: new Date(),
      tracks: [{ youtubeUrl: "" }],
      lineup: makeDefaultLineup(),
    });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      title: values.title.trim(),
      eventDate: format(values.eventDate, "yyyy-MM-dd"),
      tracks: values.tracks.map((t) => ({
        youtubeUrl: t.youtubeUrl.trim(),
      })),
      lineup: values.lineup.map((l) => ({ roleCode: l.roleCode, memberId: l.memberId || null })),
    };

    try {
      await toastPromise(
        createPrepSetlist(payload).then((result) => {
          if (!result.ok) throw new Error(result.message);
        }),
        "Saving setlist...",
      ).unwrap();
      onOpenChange(false);
      resetForm();
    } catch {
      /* handled */
    }
  });

  const memberOptions = useMemo(() => teamMembers, [teamMembers]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetForm();
      }}
    >
      <DialogContent
        showCloseButton
        className="max-h-[min(90vh,760px)] w-[calc(100%-1.5rem)] max-w-lg gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        <div className="border-b border-border/60 px-4 py-4 sm:px-5">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-lg">Add prep setlist</DialogTitle>
            <DialogDescription>Save songs and lineup together.</DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-6 px-5 py-5 sm:px-6">
          <FieldSet className="gap-5">
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="setlist-title">Setlist title</FieldLabel>
                <Input
                  id="setlist-title"
                  placeholder="ex: Week 2 prep"
                  autoComplete="off"
                  aria-invalid={!!form.formState.errors.title}
                  {...form.register("title")}
                />
                <FieldError errors={[form.formState.errors.title]} />
              </Field>

              <Field>
                <FieldLabel>Setlist date</FieldLabel>
                <Popover>
                  <PopoverTrigger
                    nativeButton={false}
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-9 w-full justify-start gap-2 text-left font-normal",
                          !eventDateValue && "text-muted-foreground",
                        )}
                      />
                    }
                  >
                    <CalendarIcon className="size-4 opacity-70" />
                    {eventDateValue ? format(eventDateValue, "PPP", { locale: ko }) : <span>Select date</span>}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <Calendar
                      mode="single"
                      selected={eventDateValue}
                      onSelect={(d) => {
                        if (d) form.setValue("eventDate", d, { shouldValidate: true });
                      }}
                      locale={ko}
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
                <FieldError errors={[form.formState.errors.eventDate]} />
              </Field>
            </FieldGroup>

            <FieldGroup className="gap-3">
              <div className="flex items-end justify-between gap-2">
                <span className="text-sm font-medium leading-none">Songs (YouTube)</span>
                <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => append({ youtubeUrl: "" })}>
                  <Plus className="size-3.5" />
                  Add row
                </Button>
              </div>
              <ul className="flex flex-col gap-3">
                {fields.map((field, index) => (
                  <li key={field.id} className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="https://www.youtube.com/watch?v=..."
                        aria-invalid={!!form.formState.errors.tracks?.[index]?.youtubeUrl}
                        {...form.register(`tracks.${index}.youtubeUrl` as const)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={fields.length <= 1}
                        onClick={() => remove(index)}
                        aria-label="Delete row"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <FieldError errors={[form.formState.errors.tracks?.[index]?.youtubeUrl]} />
                  </li>
                ))}
              </ul>
            </FieldGroup>

            <FieldGroup className="gap-3">
              <span className="text-sm font-medium leading-none">Lineup assignment</span>
              <FieldDescription>Choose member by role. Empty value means unassigned.</FieldDescription>
              <ul className="grid gap-3 sm:grid-cols-2">
                {TEAM_ROLE_OPTIONS.map((role, index) => (
                  <li key={role.code} className="rounded-lg border border-border/60 bg-card/50 p-3">
                    <input type="hidden" {...form.register(`lineup.${index}.roleCode` as const)} value={role.code} />
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      {teamRoleLabel(role.code)}
                    </label>
                    <select
                      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                      {...form.register(`lineup.${index}.memberId` as const)}
                      defaultValue=""
                    >
                      <option value="">Unassigned</option>
                      {memberOptions.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.username}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            </FieldGroup>
          </FieldSet>

          <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.formState.isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddSetlistTriggerButton({
  className,
  variant = "outline",
  size = "sm",
  teamMembers,
}: {
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  teamMembers: LineupMemberOption[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn("gap-1.5 shadow-sm", className)}
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        Add setlist
      </Button>
      <AddSetlistDialog open={open} onOpenChange={setOpen} teamMembers={teamMembers} />
    </>
  );
}
