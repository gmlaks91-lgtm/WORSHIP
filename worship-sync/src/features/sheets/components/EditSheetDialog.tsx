"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { updateSheet } from "@/features/sheets/actions/sheetActions";
import type { SheetChords, SheetStructure } from "@/features/sheets/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toastError, toastPromise } from "@/lib/app-toast";

type EditSheetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheetId: string;
  songTitle: string;
  currentChords?: SheetChords | null;
  currentStructure?: SheetStructure | null;
  currentMemo?: string | null;
};

export function EditSheetDialog({
  open,
  onOpenChange,
  sheetId,
  songTitle,
  currentChords,
  currentStructure,
  currentMemo,
}: EditSheetDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [chords, setChords] = useState<string>(() => {
    if (!currentChords?.chords) return "";
    return currentChords.chords.join(", ");
  });

  const [progression, setProgression] = useState<string>(() => {
    return currentChords?.progression ?? "";
  });

  const [orderStr, setOrderStr] = useState<string>(() => {
    if (!currentStructure?.order) return "";
    return currentStructure.order.join(",");
  });

  const [sections, setSections] = useState<string>(() => {
    if (!currentStructure?.sections) return "";
    return currentStructure.sections.join(", ");
  });

  const [memo, setMemo] = useState<string>(currentMemo ?? "");

  const handleSubmit = () => {
    const updates: Parameters<typeof updateSheet>[0] = {
      sheetId,
    };

    let hasChanges = false;

    // 코드 정보 파싱
    if (chords.trim() || progression.trim()) {
      const chordsArray = chords
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      updates.chords = {
        chords: chordsArray,
        progression: progression.trim() || undefined,
      };
      hasChanges = true;
    }

    // 진행 순서 파싱
    if (orderStr.trim() || sections.trim()) {
      const orderArray = orderStr
        .split(",")
        .map((o) => parseInt(o.trim(), 10))
        .filter((n) => !isNaN(n));

      const sectionsArray = sections
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      updates.songStructure = {
        order: orderArray,
        sections: sectionsArray,
      };
      hasChanges = true;
    }

    // 메모 확인
    if (memo !== (currentMemo ?? "")) {
      updates.memo = memo;
      hasChanges = true;
    }

    if (!hasChanges) {
      toastError("변경된 내용이 없습니다.");
      return;
    }

    startTransition(async () => {
      try {
        await toastPromise(
          updateSheet(updates).then((res) => {
            if (!res.ok) throw new Error(res.message);
          }),
          "악보를 수정하는 중입니다...",
        ).unwrap();

        router.refresh();
        onOpenChange(false);
      } catch {
        // 에러는 toastPromise에서 처리됨
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>악보 편집 - {songTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* 코드 섹션 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-neutral-900">코드</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-neutral-600">코드 목록 (쉼표 구분)</label>
                <input
                  type="text"
                  value={chords}
                  onChange={(e) => setChords(e.target.value)}
                  placeholder="Am, G, D, F, C"
                  className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus-visible:border-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-200/50"
                  disabled={pending}
                />
              </div>
              <div>
                <label className="text-xs text-neutral-600">진행도 (예: Verse→Chorus→Bridge→Chorus)</label>
                <input
                  type="text"
                  value={progression}
                  onChange={(e) => setProgression(e.target.value)}
                  placeholder="Verse→Chorus→Bridge→Chorus"
                  className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus-visible:border-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-200/50"
                  disabled={pending}
                />
              </div>
            </div>
          </div>

          {/* 진행 순서 섹션 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-neutral-900">진행 순서</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-neutral-600">순서 번호 (쉼표 구분, 1=Verse, 2=Chorus, 3=Bridge 등)</label>
                <input
                  type="text"
                  value={orderStr}
                  onChange={(e) => setOrderStr(e.target.value)}
                  placeholder="1, 2, 2, 3, 1"
                  className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus-visible:border-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-200/50"
                  disabled={pending}
                />
              </div>
              <div>
                <label className="text-xs text-neutral-600">섹션 이름 (쉼표 구분)</label>
                <input
                  type="text"
                  value={sections}
                  onChange={(e) => setSections(e.target.value)}
                  placeholder="Verse, Chorus, Bridge, Outro"
                  className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus-visible:border-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-200/50"
                  disabled={pending}
                />
              </div>
            </div>
          </div>

          {/* 메모 섹션 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-neutral-900">메모</h3>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="악보에 대한 추가 정보나 지도 사항을 입력하세요."
              className="h-24 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-200/50"
              disabled={pending}
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={pending}
              className="bg-neutral-900 hover:bg-neutral-800"
            >
              {pending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
