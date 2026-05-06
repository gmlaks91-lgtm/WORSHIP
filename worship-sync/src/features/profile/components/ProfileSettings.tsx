"use client";

import { Loader2, PencilLine, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { updateAvatar, updateProfile } from "@/features/profile/actions/profileActions";
import type { MyProfileRow } from "@/features/profile/queries/getMyProfile";
import { TEAM_ROLE_OPTIONS, teamRoleLabel } from "@/lib/team-roles";
import { toastError, toastPromise } from "@/lib/app-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function roleLabel(role: "leader" | "member") {
  return role === "leader" ? "Leader" : "Member";
}

export function ProfileSettings({ profile }: { profile: MyProfileRow }) {
  const router = useRouter();
  const [openEdit, setOpenEdit] = useState(false);
  const [username, setUsername] = useState(profile.username);
  const [role1, setRole1] = useState(profile.role_priority_1 ?? "");
  const [role2, setRole2] = useState(profile.role_priority_2 ?? "");
  const [role3, setRole3] = useState(profile.role_priority_3 ?? "");
  const [pendingSave, startSaveTransition] = useTransition();
  const [pendingAvatar, startAvatarTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const onSaveProfile = () => {
    const next = username.trim();
    if (!next) return toastError("Name is required.");

    startSaveTransition(async () => {
      try {
        await toastPromise(
          updateProfile({ username: next, rolePriority1: role1 || null, rolePriority2: role2 || null, rolePriority3: role3 || null }).then((res) => {
            if (!res.ok) throw new Error(res.message);
          }),
          "Saving profile...",
        ).unwrap();
        setOpenEdit(false);
        router.refresh();
      } catch {
        /* handled */
      }
    });
  };

  const onPickAvatar = () => fileRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    startAvatarTransition(async () => {
      try {
        await toastPromise(
          updateAvatar(fd).then((res) => {
            if (!res.ok) throw new Error(res.message);
          }),
          "Uploading image...",
        ).unwrap();
        router.refresh();
      } catch {
        /* handled */
      }
    });
  };

  return (
    <div className="space-y-8">
      <section className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative">
          <button type="button" onClick={onPickAvatar} disabled={pendingAvatar} className={cn("group relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring", "disabled:opacity-60")} aria-label="Change avatar">
            <Avatar className="size-28 border-2 border-border/60 shadow-sm sm:size-32">
              {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" className="object-cover" /> : null}
              <AvatarFallback className="bg-muted text-lg font-semibold"><UserRound className="size-10 text-muted-foreground" aria-hidden /></AvatarFallback>
            </Avatar>
            <span className={cn("absolute inset-0 flex items-center justify-center rounded-full bg-foreground/45 text-primary-foreground opacity-0 transition-opacity", "group-hover:opacity-100 group-focus-visible:opacity-100")}>
              {pendingAvatar ? <Loader2 className="size-8 animate-spin" aria-hidden /> : <PencilLine className="size-8" aria-hidden />}
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={onFileChange} />
        </div>
        <div className="flex flex-1 flex-col gap-2 text-center sm:text-left">
          <p className="text-lg font-semibold tracking-tight">{profile.username}</p>
          <p className="text-sm text-muted-foreground">Permission: <span className="font-medium text-foreground">{roleLabel(profile.role)}</span></p>
          <p className="text-sm text-muted-foreground">Roles: {teamRoleLabel(profile.role_priority_1)} / {teamRoleLabel(profile.role_priority_2)} / {teamRoleLabel(profile.role_priority_3)}</p>
          <p className="text-xs text-muted-foreground">Click avatar to upload PNG/JPG/WebP/GIF (max 5MB).</p>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border/60 bg-card/70 p-5 shadow-sm sm:p-6">
        <h2 className="text-sm font-medium text-foreground">Profile</h2>
        <p className="text-xs text-muted-foreground">Update your display name and role priorities.</p>
        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <DialogTrigger render={<Button type="button" variant="outline" className="w-full sm:w-auto" />}>Edit profile</DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>Set your name and role preference order.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="profile-username" className="text-xs font-medium text-muted-foreground">Name</label>
                <Input id="profile-username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={pendingSave} maxLength={80} />
              </div>
              {[{ v: role1, s: setRole1, l: "Priority 1" }, { v: role2, s: setRole2, l: "Priority 2" }, { v: role3, s: setRole3, l: "Priority 3" }].map((item) => (
                <div className="space-y-1.5" key={item.l}>
                  <label className="text-xs font-medium text-muted-foreground">{item.l}</label>
                  <select value={item.v} onChange={(e) => item.s(e.target.value)} className={cn("h-10 w-full rounded-lg border border-input bg-background px-3 text-sm", "outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40")}>
                    <option value="">None</option>
                    {TEAM_ROLE_OPTIONS.map((role) => <option key={role.code} value={role.code}>{role.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setOpenEdit(false)} disabled={pendingSave}>Cancel</Button>
              <Button type="button" onClick={onSaveProfile} disabled={pendingSave}>{pendingSave ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}
