"use client";

import { Loader2, PencilLine, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { updateAvatar, updateProfile } from "@/features/profile/actions/profileActions";
import type { MyProfileRow } from "@/features/profile/queries/getMyProfile";
import type { ProfileRole } from "@/types/database";
import { toastPromise, toastError } from "@/lib/app-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function roleLabel(role: ProfileRole) {
  return role === "leader" ? "리더" : "팀원";
}

type ProfileSettingsProps = {
  profile: MyProfileRow;
};

export function ProfileSettings({ profile }: ProfileSettingsProps) {
  const router = useRouter();
  const [username, setUsername] = useState(profile.username);
  const [pendingName, startNameTransition] = useTransition();
  const [pendingAvatar, startAvatarTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const onSaveName = () => {
    const next = username.trim();
    if (!next) {
      toastError("이름을 입력해 주세요.");
      return;
    }
    if (next === profile.username) return;
    startNameTransition(async () => {
      try {
        await toastPromise(
          updateProfile(next).then((res) => {
            if (!res.ok) throw new Error(res.message);
          }),
          "프로필을 저장하는 중이에요…",
        ).unwrap();
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
          "이미지를 올리는 중이에요…",
        ).unwrap();
        router.refresh();
      } catch {
        /* handled */
      }
    });
  };

  const showUrl = profile.avatar_url;

  return (
    <div className="space-y-8">
      <section className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative">
          <button
            type="button"
            onClick={onPickAvatar}
            disabled={pendingAvatar}
            className={cn(
              "group relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:opacity-60",
            )}
            aria-label="아바타 이미지 변경"
          >
            <Avatar className="size-28 border-2 border-border/60 shadow-sm sm:size-32">
              {showUrl ? <AvatarImage src={showUrl} alt="" className="object-cover" /> : null}
              <AvatarFallback className="bg-muted text-lg font-semibold">
                <UserRound className="size-10 text-muted-foreground" aria-hidden />
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center rounded-full bg-foreground/45 text-primary-foreground opacity-0 transition-opacity",
                "group-hover:opacity-100 group-focus-visible:opacity-100",
              )}
            >
              {pendingAvatar ? (
                <Loader2 className="size-8 animate-spin" aria-hidden />
              ) : (
                <PencilLine className="size-8" aria-hidden />
              )}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={onFileChange}
          />
        </div>
        <div className="flex flex-1 flex-col gap-2 text-center sm:text-left">
          <p className="text-lg font-semibold tracking-tight">{profile.username}</p>
          <p className="text-sm text-muted-foreground">
            역할: <span className="font-medium text-foreground">{roleLabel(profile.role)}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            원형 사진을 눌러 PNG·JPG·WebP·GIF를 올릴 수 있어요. (최대 5MB)
          </p>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border/55 bg-card/60 p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-medium text-foreground">표시 이름</h2>
        <p className="text-xs text-muted-foreground">팀원 목록·게시판 등에 보이는 이름입니다.</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label htmlFor="profile-username" className="sr-only">
              사용자 이름
            </label>
            <Input
              id="profile-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={pendingName}
              maxLength={80}
              className="h-10"
            />
          </div>
          <Button
            type="button"
            disabled={pendingName || username.trim() === profile.username || !username.trim()}
            onClick={onSaveName}
            className="shrink-0 sm:w-auto"
          >
            {pendingName ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            저장
          </Button>
        </div>
      </section>
    </div>
  );
}
