"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

import { updatePrepSetlist } from "@/features/setlist/actions/setlistActions";
import { TEAM_ROLE_OPTIONS, isMultiMemberRole, type TeamRoleCode } from "@/lib/team-roles";
import { toastPromise } from "@/lib/app-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type MemberOption = { id: string; username: string };

type EditSetlistDialogProps = {
  setlistId: string;
  initialTitle: string;
  initialEventDate: string;
  initialTracks: string[];
  initialLineup: Array<{ roleCode: TeamRoleCode; memberIds: string[] }>;
  members: MemberOption[];
};

export function EditSetlistDialog({
  setlistId,
  initialTitle,
  initialEventDate,
  initialTracks,
  initialLineup,
  members,
}: EditSetlistDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const baselineLineup = useMemo(
    () =>
      TEAM_ROLE_OPTIONS.map((role) => {
        const found = initialLineup.find((item) => item.roleCode === role.code);
        return { roleCode: role.code, memberIds: found?.memberIds ?? [] };
      }),
    [initialLineup],
  );

  const [title, setTitle] = useState(initialTitle);
  const [eventDate, setEventDate] = useState(initialEventDate.slice(0, 10));
  const [tracks, setTracks] = useState(() => (initialTracks.length > 0 ? initialTracks : [""]));
  const [lineup, setLineup] = useState(baselineLineup);

  const resetDraft = () => {
    setTitle(initialTitle);
    setEventDate(initialEventDate.slice(0, 10));
    setTracks(initialTracks.length > 0 ? initialTracks : [""]);
    setLineup(baselineLineup);
  };

  const onSave = () => {
    const cleanedTracks = tracks.map((t) => t.trim()).filter(Boolean);
    if (!title.trim()) return;
    if (!eventDate) return;
    if (cleanedTracks.length === 0) return;

    startTransition(async () => {
      try {
        await toastPromise(
          updatePrepSetlist({
            setlistId,
            title: title.trim(),
            eventDate,
            tracks: cleanedTracks.map((youtubeUrl) => ({ youtubeUrl })),
            lineup,
          }).then((res) => {
            if (!res.ok) throw new Error(res.message);
          }),
          "콘티를 수정하는 중입니다...",
        ).unwrap();
        setOpen(false);
        router.refresh();
      } catch {
        // handled by toastPromise
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) resetDraft();
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>수정하기</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>콘티 수정</DialogTitle>
          <DialogDescription>수록곡과 라인업을 수정해 저장할 수 있습니다.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">콘티 제목</p>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={pending} />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">예배 날짜</p>
            <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} disabled={pending} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">수록곡</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => setTracks((prev) => [...prev, ""])} disabled={pending}>
              <Plus className="size-4" />
              곡 추가
            </Button>
          </div>
          <div className="space-y-2">
            {tracks.map((track, index) => (
              <div key={`${index}-${track}`} className="flex gap-2">
                <Input
                  value={track}
                  onChange={(e) =>
                    setTracks((prev) => prev.map((item, idx) => (idx === index ? e.target.value : item)))
                  }
                  placeholder="https://www.youtube.com/watch?v=..."
                  disabled={pending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setTracks((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index)))}
                  disabled={pending || tracks.length <= 1}
                  aria-label="곡 삭제"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">라인업</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {lineup.map((item, index) => (
              <div key={item.roleCode} className="rounded-lg border border-border/60 bg-card/60 p-3">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">{item.roleCode}</p>
                {isMultiMemberRole(item.roleCode) ? (
                  <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-input bg-background p-2">
                    {members.map((member) => {
                      const checked = item.memberIds.includes(member.id);
                      return (
                        <label key={member.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setLineup((prev) => {
                                const next = [...prev];
                                const existing = next[index].memberIds;
                                next[index] = {
                                  ...next[index],
                                  memberIds: e.target.checked
                                    ? [...existing, member.id]
                                    : existing.filter((id) => id !== member.id),
                                };
                                return next;
                              });
                            }}
                            disabled={pending}
                          />
                          <span className="text-sm">{member.username}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <select
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                    value={item.memberIds[0] ?? ""}
                    onChange={(e) => {
                      setLineup((prev) => {
                        const next = [...prev];
                        next[index] = { ...next[index], memberIds: e.target.value ? [e.target.value] : [] };
                        return next;
                      });
                    }}
                    disabled={pending}
                  >
                    <option value="">미배정</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.username}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            취소
          </Button>
          <Button type="button" onClick={onSave} disabled={pending}>
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
